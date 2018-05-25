#
# Quru Image Server
#
# Document:      imaging_pillow.py
# Date started:  22 May 2018
# By:            Matt Fozard
# Purpose:       Provides an interface to the Pillow image processing library
# Requires:      The Python Pillow library (http://python-pillow.org)
# Copyright:     Quru Ltd (www.quru.com)
# Licence:
#
#   This program is free software: you can redistribute it and/or modify
#   it under the terms of the GNU Affero General Public License as published
#   by the Free Software Foundation, either version 3 of the License, or
#   (at your option) any later version.
#
#   This program is distributed in the hope that it will be useful,
#   but WITHOUT ANY WARRANTY; without even the implied warranty of
#   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#   GNU Affero General Public License for more details.
#
#   You should have received a copy of the GNU Affero General Public License
#   along with this program.  If not, see http://www.gnu.org/licenses/
#
# Notable modifications:
# Date       By    Details
# =========  ====  ============================================================
#

import io
import math

_pillow_import_error = None
try:
    import PIL
    from PIL import Image, ImageColor, ExifTags, TiffTags, IptcImagePlugin
except Exception as e:
    _pillow_import_error = e


class PillowBackend(object):
    """
    Implements a back-end for imaging.py using the Python Pillow library.
    """
    MAX_ICC_SIZE = 1048576 * 5

    def __init__(self, gs_path, temp_files_path, pdf_default_dpi):
        """
        Initialises the Pillow library. This function must be called once
        before the other functions can be used.

        See imaging.imaging_init() for a description of the parameters.
        An ImportError is raised if the Pillow library failed to load.
        """
        global _pillow_import_error
        if _pillow_import_error:
            raise ImportError("Failed to import Pillow: " + str(_pillow_import_error))

    def get_version_info(self):
        """
        Returns a string with the Pillow library version information.
        """
        return "Pillow version: " + PIL.__version__

    def adjust_image(
            self, image_data, data_type,
            page=1, iformat='jpg',
            new_width=0, new_height=0, size_auto_fit=False,
            align_h=None, align_v=None, rotation=0.0, flip=None,
            crop_top=0.0, crop_left=0.0, crop_bottom=1.0, crop_right=1.0, crop_auto_fit=False,
            fill_colour='#ffffff', rquality=3, cquality=75, sharpen=0,
            dpi=0, strip_info=False,
            overlay_data=None, overlay_size=1.0, overlay_pos=None, overlay_opacity=1.0,
            icc_profile=None, icc_intent=None, icc_bpc=False,
            colorspace=None, tile_spec=(0, 0)
        ):
        """
        Pillow implementation of imaging.adjust_image(),
        see the function documentation there for full details.

        This method may not support all the functionality of the ImageMagick version.
        """
        # Check for bad parameters
        if not image_data:
            raise ValueError('Image must be supplied')
        if align_h and len(align_h) > 16:
            raise ValueError('HAlign value too long')
        if align_v and len(align_v) > 16:
            raise ValueError('VAlign value too long')
        if flip and len(flip) > 1:
            raise ValueError('Flip value too long')
        if fill_colour and len(fill_colour) > 32:
            raise ValueError('Fill colour value too long')
        if iformat and len(iformat) > 4:
            raise ValueError('Format value too long')
        if overlay_pos and len(overlay_pos) > 32:
            raise ValueError('Overlay position value too long')
        if icc_profile and len(icc_profile) > PillowBackend.MAX_ICC_SIZE:
            raise ValueError('ICC profile too large')
        if icc_intent and len(icc_intent) > 10:
            raise ValueError('ICC rendering intent too long')        
        if tile_spec[0] > 0:
            grid_axis_len = int(math.sqrt(tile_spec[1]))
            if tile_spec[1] < 4 or tile_spec[1] != (grid_axis_len * grid_axis_len):
                raise ValueError('Tile grid size is not square, or is less than 4')

        # Read image data, blow up here if a bad image
        image = self._load_image_data(image_data, data_type)
        bufout = io.BytesIO()
        try:
            # Adjust parameters to safe values (part 1)
            page = self._limit_number(page, 1, 999999)
            rotation = self._limit_number(rotation, -360.0, 360.0)
            crop_top = self._limit_number(crop_top, 0.0, 1.0)
            crop_left = self._limit_number(crop_left, 0.0, 1.0)
            crop_bottom = self._limit_number(crop_bottom, 0.0, 1.0)
            crop_right = self._limit_number(crop_right, 0.0, 1.0)
            if crop_bottom < crop_top:
                crop_bottom = crop_top
            if crop_right < crop_left:
                crop_right = crop_left
            rquality = self._limit_number(rquality, 1, 3)
            cquality = self._limit_number(cquality, 1, 100)
            sharpen = self._limit_number(sharpen, -500, 500)
            dpi = self._limit_number(dpi, 0, 32000)
            if tile_spec[0] > 0:
                tile_spec[0] = self._limit_number(tile_spec[0], 1, tile_spec[1])
            overlay_size = self._limit_number(overlay_size, 0.0, 1.0)
            overlay_opacity = self._limit_number(overlay_opacity, 0.0, 1.0)

            # Page selection - P3

            # Get original image info
            cur_width = image.width
            cur_height = image.height
            # #2321 Ensure no div by 0
            if cur_width == 0 or cur_height == 0:
                raise ValueError('Image dimensions are zero')
            cur_aspect = cur_width / cur_height

            # Adjust parameters to safe values (part 2)
            # Prevent enlargements, using largest of width/height to allow for rotation.
            # If enabling enlargements, enforce some max value to prevent server attacks.
            max_dimension = max(cur_width, cur_height)
            new_width = self._limit_number(
                new_width, 0, cur_width if rotation == 0.0 else max_dimension
            )
            new_height = self._limit_number(
                new_height, 0, cur_height if rotation == 0.0 else max_dimension
            )

            # If the target format supports transparency and we need it,
            # upgrade the image to RGBA
            if fill_colour == 'none' or fill_colour == 'transparent':
                if self._supports_transparency(iformat):
                    if image.mode != 'LA' and image.mode != 'RGBA':
                        image = self._image_change_mode(
                            image,
                            'LA' if image.mode == 'L' else 'RGBA'
                        )
                else:
                    fill_colour = '#ffffff'

            # Set background colour, required for rotation or resizes that
            # change the overall aspect ratio
            try:
                if fill_colour == 'auto':
                    raise NotImplementedError('Auto fill is not yet implemented')
                elif fill_colour == 'none' or fill_colour == 'transparent':
                    fill_rgb = None
                elif fill_colour:
                    fill_rgb = ImageColor.getrgb(fill_colour)
                else:
                    fill_rgb = ImageColor.getrgb('#ffffff')
            except ValueError:
                raise ValueError('Invalid or unsupported fill colour')

            # The order of imaging operations is fixed, and defined in image_help.md#notes
            # (1) Flip
            if flip == 'h' or flip == 'v':
                image = self._image_flip(image, flip)
            # (2) Rotate
            if rotation:
                image = self._image_rotate(image, rotation, rquality, fill_rgb)
            # (3) Crop
            # (4) Resize
            if new_width != 0 or new_height != 0:
                image = self._image_resize(image, new_width, new_height, rquality)
            # (5) Overlay - P2
            # (6) Tile
            # (7) Apply ICC profile - P3
            # (8) Set colorspace - P3
            # (9) Strip TODO see jpeg save options for how to not strip

            # TODO set mode for file type before saving, consider transparency

            # Return encoded image bytes
            save_opts = self._get_pillow_save_options(image, iformat, cquality, dpi)
            image.save(bufout, **save_opts)
            return bufout.getvalue()
        finally:
            image.close()
            bufout.close()

    def burst_pdf(self, pdf_data, dest_dir, dpi):
        """
        Pillow implementation of imaging.burst_pdf(),
        see the function documentation there for full details.

        This method may not support all the functionality of the ImageMagick version.
        """
        raise NotImplementedError(
            'PDF support is not currently implemented in the free version'
        )

    def get_image_profile_data(self, image_data, data_type):
        """
        Pillow implementation of imaging.get_image_profile_data(),
        see the function documentation there for full details.

        This method may not support all the functionality of the ImageMagick version.
        """
        image = self._load_image_data(image_data, data_type)
        try:
            return self._get_image_tags(image)
        finally:
            image.close()

    def get_image_dimensions(self, image_data, data_type):
        """
        Pillow implementation of imaging.get_image_dimensions(),
        see the function documentation there for full details.
        """
        image = self._load_image_data(image_data, data_type)
        try:
            return image.size
        finally:
            image.close()

    def _load_image_data(self, image_data, data_type):
        """
        Returns a Pillow Image from raw image file bytes. The data type should
        be the image's file extension to provide a decoding hint. The image is
        lazy loaded - the pixel data is not decoded until either something requires
        it or the load() method is called.
        The caller should call close() on the image after use.
        Raises a ValueError if the image type is not supported.
        """
        try:
            return Image.open(io.BytesIO(image_data))
        except IOError:
            raise ValueError("Invalid or unsupported image format")

    def _get_image_tags(self, image):
        """
        The back end of get_image_profile_data(),
        returning a list of tuples in the format expected by exif.py.
        """
        results = []
        # JpegImagePlugin and WebPImagePlugin
        try:
            results += self._tag_dict_to_tuplist(image._getexif(), 'exif', ExifTags.TAGS)
        except AttributeError:  # ._getexif
            pass
        # TiffImageplugin
        try:
            results += self._tag_dict_to_tuplist(image.tag, 'tiff', TiffTags.TAGS)
        except AttributeError:  # .tag
            pass
        # JpegImagePlugin and TiffImageplugin
        results += self._tag_dict_to_tuplist(
            self._fix_iptc_dict(IptcImagePlugin.getiptcinfo(image)),
            'iptc',
            IptcTags
        )
        # PNGImagePlugin - Pillow has no built-in support for reading XMP or EXIF data
        #                  from the headers. EXIF in PNG was only standardised in July 2017.
        # <nothing to do for PNG>
        results.sort()
        return results

    def _tag_dict_to_tuplist(self, tag_dict, key_type, key_dict):
        """
        Converts a Pillow tag dictionary to a list of tuples in the format
        expected by exif.py: [('exif', 'key', 'value'), ...]. Returns an empty
        list if the dictionary is None or empty or if no tags were recognised.
        """
        results = []
        if tag_dict:
            for k, v in tag_dict.items():
                key_name = key_dict.get(k)
                if key_name:
                    if key_name == "GPSInfo":
                        results += self._tag_dict_to_tuplist(v, 'exif', ExifTags.GPSTAGS)
                    else:
                        results.append(
                            (key_type, key_name, self._tag_value_to_string(v))
                        )
        return results

    def _tag_value_to_string(self, val):
        """
        Converts an EXIF/TIFF tag value from the Python type returned by Pillow
        into the string format required by exif.py. From the exif.py documentation:
        >
        > raw_string_val should be in format "str" for strings, "123" for numbers,
        > "10/50" for ratios, "1/2, 11/20" for a list of ratios,
        > and "83, 84, 82" for binary (this representing "STR")
        >
        """
        if isinstance(val, str):
            return val
        elif isinstance(val, bytes):
            return ', '.join([str(c) for c in val])
        elif isinstance(val, (int, float)):
            return str(val)
        elif isinstance(val, tuple) and len(val) == 1:
            return self._tag_value_to_string(val[0])
        elif isinstance(val, tuple) and len(val) == 2 and isinstance(val[0], int):
            return "%d/%d" % val
        elif isinstance(val, tuple):
            return ', '.join(self._tag_value_to_string(v) for v in val)
        else:
            # We don't know how to handle, but return something
            return str(val)

    def _fix_iptc_dict(self, tag_dict):
        """
        Given Pillow's IPTC dict in the format {(datatype, tagcode): b'value'},
        returns a new dict in the format {tagcode: 'value'} similar to the EXIF
        and TIFF dicts.
        """
        fixed_dict = {}
        if tag_dict:
            # Convert {(datatype, tagcode): value} to {tagcode:value}
            fixed_dict = {k[1]:v for k, v in tag_dict.items()}
            # Convert byte values to str and [byte, byte] to (str, str)
            for k, v in fixed_dict.items():
                if isinstance(v, bytes):
                    fixed_dict[k] = v.decode('utf8')
                elif isinstance(v, (tuple, list)) and v and isinstance(v[0], bytes):
                    fixed_dict[k] = tuple([vi.decode('utf8') for vi in v])
        return fixed_dict

    def _limit_number(self, val, min_val, max_val):
        """
        Returns val, or min_val or max_val if val is out of range.
        """
        if val < min_val:
            return min_val
        elif val > max_val:
            return max_val
        return val

    def _supports_transparency(self, format):
        """
        Returns whether the given file format supports transparency.
        """
        return self._get_pillow_format(format) in ['gif', 'png']

    def _get_pillow_save_options(self, image, format, quality, dpi):
        """
        Returns a dictionary of save options for an image plus desired image
        format, quality, and other file options.
        """
        save_opts = {}
        # DPI
        if dpi > 0:
            save_opts['dpi'] = (dpi, dpi)
        elif 'dpi' in image.info:
            save_opts['dpi'] = image.info['dpi']
        # Progressive JPEG
        if format in ['pjpg', 'pjpeg']:
            format = 'jpeg'
            save_opts['progressive'] = True
        elif 'progression' in image.info:
            save_opts['progressive'] = image.info['progression']
        # Format
        save_opts['format'] = self._get_pillow_format(format)
        if save_opts['format'] in ['jpg', 'jpeg']:
            save_opts['quality'] = quality
        return save_opts

    def _get_pillow_format(self, format):
        """
        Converts a file extension to a Pillow file format.
        Pillow is a bit picky with it's file format names.
        """
        format = format.lower()
        if format in ['jpg', 'jpeg', 'jpe', 'jfif', 'jif']:
            return 'jpeg'
        elif format in ['tiff', 'tif']:
            return 'tiff'
        else:
            return format

    def _get_pillow_resample(self, quality, rotating=False):
        """
        Returns a Pillow resampling filter from 1 (fastest) to 3 (best quality).
        """
        if quality == 1:
            return Image.BILINEAR if not rotating else Image.NEAREST
        elif quality == 2:
            return Image.BICUBIC if not rotating else Image.BILINEAR
        else:
            return Image.LANCZOS if not rotating else Image.BICUBIC

    def _image_change_mode(self, image, mode, auto_close=True):
        """
        Copies and changes the mode of an image, e.g. to 'RGBA',
        returning the new copy.
        """
        if mode == 'P':
            new_image = image.convert(mode, dither=Image.FLOYDSTEINBERG, palette=Image.ADAPTIVE)
        else:
            new_image = image.convert(mode)
        if auto_close:
            image.close()
        return new_image

    def _image_flip(self, image, flip, auto_close=True):
        """
        Copies and flips an image left to right ('h') or top to bottom ('v'),
        returning the new copy.
        """
        if flip == 'h':
            new_image = image.transpose(Image.FLIP_LEFT_RIGHT)
        else:
            new_image = image.transpose(Image.FLIP_TOP_BOTTOM)
        if auto_close:
            image.close()
        return new_image

    def _image_rotate(self, image, angle, quality, fill, auto_close=True):
        """
        Copies and rotates an image clockwise, returning the new copy.
        """
        new_image = image.rotate(
            angle * -1,
            self._get_pillow_resample(quality, rotating=True),
            expand=True,
            fillcolor=fill  # Added Pillow 5.2
        )
        if auto_close:
            image.close()
        return new_image

    def _image_resize(self, image, width, height, quality, auto_close=True):
        """
        Resizes an image, returning a resized copy.
        The quality number can be from 1 (fastest) to 3 (best quality).
        The image will not be resized beyond its original size.
        """
        # TODO Constrain size
        # TODO Test for aspect changes
        # TODO Do we need to gamma correct?
        new_image = image.resize(
            (width, height),
            resample=self._get_pillow_resample(quality)
        )
        if auto_close:
            image.close()
        return new_image


# A mapping of Pillow's IPTC tag codes to the exif.py tag names
IptcTags = {
    5: 'ObjectName',
    7: 'EditStatus',
    8: 'EditorialUpdate',
    10: 'Urgency',
    12: 'SubjectReference',
    15: 'Category',
    20: 'SupplementalCategories',
    22: 'FixtureIdentifier',
    25: 'Keywords',
    26: 'ContentLocationCode',
    27: 'ContentLocationName',
    30: 'ReleaseDate',
    35: 'ReleaseTime',
    37: 'ExpirationDate',
    38: 'ExpirationTime',
    40: 'SpecialInstructions',
    42: 'ActionAdvised',
    45: 'ReferenceService',
    47: 'ReferenceDate',
    50: 'ReferenceNumber',
    55: 'DateCreated',
    60: 'TimeCreated',
    62: 'DigitalCreationDate',
    63: 'DigitalCreationTime',
    65: 'OriginatingProgram',
    70: 'ProgramVersion',
    75: 'ObjectCycle',
    80: 'By-line',
    85: 'By-lineTitle',
    90: 'City',
    92: 'Sub-location',
    95: 'Province-State',
    100: 'Country-PrimaryLocationCode',
    101: 'Country-PrimaryLocationName',
    103: 'OriginalTransmissionReference',
    105: 'Headline',
    110: 'Credit',
    115: 'Source',
    116: 'CopyrightNotice',
    118: 'Contact',
    120: 'Caption-Abstract',
    121: 'LocalCaption',
    122: 'Writer-Editor',
    125: 'RasterizedCaption',
    130: 'ImageType',
    131: 'ImageOrientation',
    135: 'LanguageIdentifier',
}
