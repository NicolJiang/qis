#
# Quru Image Server
#
# Document:      imagemagick.py
# Date started:  07 Mar 2011
# By:            Matt Fozard
# Purpose:       Provides an interface to the ImageMagick image processing library
# Requires:      qismagick (qismagick.so must be located somewhere in the PYTHONPATH)
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
# Last Changed:  $Date$ $Rev$ by $Author$
#
# Notable modifications:
# Date       By    Details
# =========  ====  ============================================================
# 18Jul2011  Matt  Added get_image_profile_data
# 27Oct2011  Matt  Added get_image_dimensions
# 20Nov2012  Matt  Added get_library_info
# 23Nov2012  Matt  Added burst_pdf
# 15Apr2013  Matt  Added init() function with configuration options
# 18Apr2013  Matt  Added colorspace parameter to adjust_image
# 29Apr2013  Matt  Added flip parameter to adjust_image
# 06May2013  Matt  Pass through DPI value for init() and burst_pdf()
# 13Jun2013  Matt  Added image overlay parameters to adjust_image
# 22Aug2013  Matt  Added align parameters to adjust_image
# 10Dec2015  Matt  qismagick 2.0 - pass through data formats for identification
#                  of ambiguous file types (plain TIFF vs RAW TIFF)
#

# TODO Change DPI to _dpi_x and _dpi_y, support x,y format in templates, web params, PDF handling
# TODO Consider testing/setting MAGICK_THREAD_LIMIT environment variable under mod_wsgi

import qismagick


def imagemagick_init(gs_path, temp_files_path, pdf_default_dpi):
    """
    Initialises the ImageMagick library.
    This function must be called once before the other functions can be used.

    gs_path - for PDF file support, the path to the Ghostscript command, e.g. "gs"
    temp_files_path - the directory in which to create temp files, e.g. "/tmp"
    pdf_default_dpi - the default target DPI when converting PDFs to images,
                      or when requesting the dimensions of a PDF, e.g. 150
    """
    qismagick.init(gs_path, temp_files_path, pdf_default_dpi)


def imagemagick_adjust_image(
        filename, image_data,
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
    Alters a raw image in any of the following ways, returning a new raw image:
    Resize, rotate, crop, change format, change compression, sharpen or blur,
    adjust colour profile.

    filename    - the image's filename
    image_data  - the raw image data
    page        - the page number to return (for multi-page images), default 1
    iformat     - the lower case image format to return, default "jpg"
    new_width   - the new image width, or 0 to proportion the image by its new height
    new_height  - the new image height, or 0 to proportion the image by its new width
    size_auto_fit - whether to adjust the requested width and height to retain the
                    image proportions and avoid padding, True or False
    align_h     - optional horizontal alignment if the image is to be padded.
                  Specify the edge to align: L, C, or R; and position, 0 to 1, default C0.5
    align_v     - optional vertical alignment if the image is to be padded.
                  Specify the edge to align: T, C, or B; and position, 0 to 1, default C0.5
    rotation    - number of degrees to rotate the image clockwise by, -360 to 360, default 0.0
    flip        - flip the image horizontally or vertically, "h" or "v", default None
    crop_top    - the top cropping value, 0 to 1, default 0.0
    crop_left   - the left cropping value, 0 to 1, default 0.0
    crop_bottom - the bottom cropping value, 0 to 1, default 1.0
    crop_right  - the right cropping value, 0 to 1, default 1.0
    crop_auto_fit - whether to adjust cropping positions to best fit the requested width
                    and height (used only when both width and height are specified),
                    True or False
    fill_colour - new image background colour (used only when specifying a new width
                  and height or rotating). Formats "blue", "#ffffff", "rgb(0,0,0)"
                  or the special value "auto".
    rquality    - resize algorithm, 1 (fastest) to 3 (best quality), default 3
    cquality    - lossy image format compression quality %, 0 to 100, default 75
    sharpen     - sharpening to apply during resize operations, -500 (heavy blur)
                  to +500 (heavy sharpen), default 0 (none)
    dpi         - the new DPI value to assign to the image, default 0 (keep existing DPI)
    strip_info  - whether to strip EXIF/IPTC/XMP and colour profile meta data from
                  the image, True or False
    overlay_data - optional raw image data to overlay as a watermark, or None
    overlay_size - the size of the overlay in relation to the main image, 0 to 1, default 1.0
    overlay_pos  - the position of the overlay on the main image:
                   "N", "NE", "E", "SE", "S", "SW", "W", "NW".
                   Any other value (and the default) centres the overlay.
    overlay_opacity - the opacity of the overlay, 0 to 1, default 1.0 (opaque)
    icc_profile - the raw data of an ICC profile to apply to the image, default None
    icc_intent  - an optional value for how to apply the ICC profile.
                  "saturation", "perceptual", "absolute", or "relative", default None
    icc_bpc     - whether to use Black Point Compensation when applying an ICC profile with
                  the relative rendering intent, True or False
    colorspace  - a quick alternative to applying an ICC profile, provides the ability to
                  change the colour model of an image. Specify "rgb", "gray", or "cmyk".
    tile_spec   - optional final crop to produce an image tile following all other
                  adjustments. The tuple represents tile number, grid size.

    Both width and height of 0 will retain the original image size.

    If the requested new width/height or cropping values define a different aspect
    ratio, and size_auto_fit is false, the image will be returned at the requested
    size, with the original image centred within it, surrounded by the fill colour.
    If size_auto_fit is true, either the width or height will be reduced so that
    there is no fill (the requested size then is not respected).

    When cropping the image and a target width and a height have been specified,
    the optional crop_auto_fit flag can be enabled. This will attempt to minimise
    the amount of fill colour (padding) in the final image by enlarging the
    requested crop rectangle to best fill the target. Padding will not necessarily
    be eliminated unless the size_auto_fit flag is also used.

    Identifying fill colours of the form "turquoise" require an array scan of
    nearly 700 colour names (i.e. it can be slow).

    If a tile of the image is requested, tile number must be between 1 and
    the grid size inclusive. The grid size must be a square (4, 9, 16, etc),
    minimum size 4. Tile number 1 is top left in the grid, and the last tile is
    bottom right. The tile is generated last, after all other adjustments.
    """
    return qismagick.adjust_image(
        filename,
        image_data,
        page,
        new_width,
        new_height,
        1 if size_auto_fit else 0,
        align_h,
        align_v,
        rotation,
        flip,
        crop_top,
        crop_left,
        crop_bottom,
        crop_right,
        1 if crop_auto_fit else 0,
        fill_colour,
        iformat,
        rquality,
        cquality,
        sharpen,
        dpi,
        1 if strip_info else 0,
        overlay_data,
        overlay_size,
        overlay_pos,
        overlay_opacity,
        icc_profile,
        icc_intent,
        1 if icc_bpc else 0,
        colorspace,
        tile_spec[0],
        tile_spec[1]
    )


def imagemagick_burst_pdf(pdf_data, dest_dir, dpi):
    """
    Exports every page of a PDF file as separate PNG files into a directory
    using Ghostscript. Note that this operation may take some time.

    pdf_data - the raw PDF data
    dest_dir - the full absolute path of the destination directory,
               which must exist and be writable
    dpi - the target PNG image DPI (larger values result in larger images),
          or 0 to use the default value

    Returns a boolean for whether the command succeeded. If not, some files
    may have been written to the destination directory, and it is left up to
    the caller to decide whether to remove them or not.

    Raises an EnvironmentError if Ghostscript is not installed.
    Raises an ValueError if the supplied data is not a PDF.
    Raises an IOError if the destination path is invalid.
    """
    return qismagick.burst_pdf(pdf_data, dest_dir, dpi)


def imagemagick_get_image_profile_data(filename, image_data):
    """
    Reads and returns all EXIF / IPTC / XMP / etc profile data from an image.

    filename   - the image's filename
    image_data - the raw image data

    Returns a list of tuples with format (profile, property, value)
    E.g. [('exif', 'Make', 'Canon'), ('exif', 'Model', '300D')]
    or an empty list if no profile data was found in the image.

    Raises an ValueError if the supplied data is not a supported image.
    """
    return qismagick.get_image_profile_data(filename, image_data)


def imagemagick_get_image_dimensions(filename, image_data):
    """
    Obtains the pixel dimensions an image in an efficient way,
    avoiding the need to decode the image.

    filename   - the image's filename
    image_data - the raw image data

    Returns a tuple with format (width, height)

    Raises an ValueError if the supplied data is not a supported image.
    """
    return qismagick.get_image_dimensions(filename, image_data)


def imagemagick_get_version_info():
    """
    Returns a string with the ImageMagick library version information.
    """
    return qismagick.get_library_info()
