# Quru Image Server - dynamic imaging for web and print

QIS is a high performance web server for creating and delivering dynamic images.
It is ideal for use in conjunction with your existing web site, for applications
such as image galleries and product catalogues.

Quru has been using QIS in production since 2012, and the majority of source code
is made available here under the
[Affero GPL license](https://www.gnu.org/licenses/why-affero-gpl.en.html).
<a name="qismagick.so"></a>

**Please note that at present, one of the required runtime packages -
`qismagick` - is not open source, and must be requested from Quru Ltd.**
This is due to some licencing restrictions which we are working on resolving.
To contact us, please send an email to info@quru.com

Quru also offers commercial support for the image server.

## An example - HTML5 responsive images

With QIS it is a breeze to serve HTML5 [responsive images](https://responsiveimages.org/)
without having to manually resize or store multiple copies of the same image.

First we upload a single high resolution image `africa_dxm.png`.  
With different URLs we can then request scaled and cropped versions of the original:

![Earth small](doc/images/nasa_africa_300.jpg)
![Earth smaller](doc/images/nasa_africa_200.jpg)
![Earth tiny crop](doc/images/nasa_africa_100_c.jpg)

and with a snippet of HTML we can ask the web browser to download whichever
*one* of these is most appropriate for the screen size for the device (desktop,
tablet, or phone):

	<div style="width:33%">
	<img src="https://images.quru.com/image?src=nasa/africa_dxm.png&format=jpg&width=500"
	     alt="NASA picture of planet Earth"
	     srcset="https://images.quru.com/image?src=nasa/africa_dxm.png&format=jpg&width=300 300w,
	             https://images.quru.com/image?src=nasa/africa_dxm.png&format=jpg&width=200 200w,
	             https://images.quru.com/image?src=nasa/africa_dxm.png&format=jpg&width=100&left=0.15&top=0.15&right=0.7&bottom=0.7 100w"
	     sizes="33vw" />
	</div>

You might notice we have also converted the image from `png` to `jpg` format,
to achieve smaller file sizes. These scaled images are automatically created
on-demand, and are then stored in a memory cache so that they are instantly
available next time around. The original image file is stored in a directory
on the server and is never modified.

## Features

Dynamic image operations include:

* Resize, rotate, flip, and crop
* Conversion to different image formats
* Blur and sharpen
* Overlays (for adding watermarks)
* Colorspace conversion
* ICC / ICM colour profiles (for print publishing)
* Stripping of image metdata to minimise image file sizes
* PDF to image conversion

See the [imaging user's guide](doc/image_help.md) for a full list.

Image presentation features include:

* Bookmarkable image URLs
* Image thumbnail generation
* HTML/Javascript libraries
  * Simple image zooming for legacy web browsers
  * Advanced HTML5 image zooming for modern web browsers and tablets
  * Full-screen image view
  * Image carousel / slideshow
  * Image gallery / folder viewer
* Image publishing wizard
* Access control via user-groups and folders

Programmatic features include:

* Image generation templates (a defined group of image operations)
* A REST API that allows you to securely upload images, generate dynamic images,
  and perform management and administration

See the [API user's guide](doc/api_help.md) for more detail.

Management features in the web interface include:

* File system and image browser
  * Add, rename, move, and delete image files and folders
* User and group administration
* Access control / user permissions administration
* System reports
  * Most popular images (by number of requests, bandwidth, processing time)
  * Server performance charts

## Screenshots

JavaScript library - image gallery (incorporating zooming viewer)  
![Embeddable gallery component](doc/images/mgmt_gallery_800.jpg)

Web interface - folder browse  
![Folder browse](doc/images/mgmt_folder_browse_800.jpg)

Web interface - image details  
![Image details view](doc/images/mgmt_image_view_800.jpg)

Web interface - image publisher  
![Image publisher](doc/images/mgmt_publish_800.jpg)

## Architecture

QIS depends on the following open source tools and applications:

* Linux operating system
* Python 2.x - to run the QIS application code
* Apache 2.2 or 2.4 - the web server
* mod_wsgi Apache module - to run the QIS Python application inside Apache
* ImageMagick - to provide the image processing capabilities
* Memcached - for caching generated images and frequently accessed data
* PostgreSQL - to store image and folder data, users, groups, and permissions

For how these should be installed and configured,
see the [install guide](doc/install.md) and the [tuning guide](doc/tuning.md).

For low or predictable loads, you can install all of these on one server.
A single server installation will easily serve 5 million images per day
(60 per second), based on an 8 core CPU, 32GB RAM with a 20GB Memcached
instance, mostly scaling and cropping digital camera photographs,
and with 95% of requests served from cache.

For high or variable loads, you will want to separate the system into web and
storage tiers. Web servers scale better as multiple small servers (rather than
one large server), and image processing is typically CPU intensive, therefore it
is primarily the web tier that should be scaled out. As an example:

![Example web and storage tiers](doc/images/arch_scaling.jpg)

This system can be scaled up and down on-demand (elastic scaling) by adding or
removing web servers at any time. Memcached can run either on a separate server
if the network is fast, on one "master" web server, or configured as a cluster
across all the permanent web servers. QIS enables
[consistent hashing](https://en.wikipedia.org/wiki/Consistent_hashing) when
using a Memcached cluster, but you should avoid adding/removing servers to/from
the cluster because of the re-distribution of keys that will occur.

The storage tier is harder to scale. Although in general QIS does not use the
PostgreSQL database heavily, storing the Postgres data files on a fast disk
or SSD is advantageous. The v9.x releases of Postgres have seen some significant
performance improvements, so always use the latest version available.
PostgreSQL though, can also be clustered and replicated.

## Developing, building and running

To run QIS in a development environment, you will need either local or remote
Memcached and PostgreSQL servers, ImageMagick installed locally, Python 2.6 or
Python 2.7, and Python development tools `pip`, `setuptools`, `wheel`, and
`virtualenv`. Development is possible on Linux or on Mac OS X.

### Operating system packages

See the [install guide](doc/install.md) for the required system packages.

The following development packages (on a Fedora-based system) are also required
in order to build and install the Python libraries:

	$ sudo yum install gcc gcc-c++ git curl wget make tar zip unzip \
	                   python-devel openldap-devel postgresql-devel libmemcached-devel

### Starting development

Get the code, create a virtualenv and install the Python dependencies:

	$ git clone https://github.com/quru/qis.git
	$ cd qis
	$ virtualenv .
	$ . bin/activate
	$ pip install -r doc/requirements.txt

Create 2 empty Postgres databases, `qis-cache` and `qis-mgmt`.
Create a `local_settings.py` file in the `conf` folder, and add settings:

* `DEBUG` to `True`
* `MEMCACHED_SERVERS`, `CACHE_DATABASE_CONNECTION`, and `MGMT_DATABASE_CONNECTION`
* `INSTALL_DIR` to be the path of your project root
* Repeat all the `*_BASE_DIR` values, to apply the new value of `INSTALL_DIR`

To see the default values and other settings you can override, see the
[default settings file](src/imageserver/conf/base_settings.py).

You will need to [request a copy of the `qismagick` package](#qismagick.so)
for your development platform, and install it:

	$ pip install qismagick-1.41.0-cp27-none-macosx_10_10_intel.whl

Then run the server in development mode with:

	$ python src/runserver.py
	2015-08-28 10:41:06,942 qis_10369  INFO     Quru Image Server v1.33 engine startup
	2015-08-28 10:41:06,944 qis_10369  INFO     Using settings base_settings + local_settings.py
	...
	Running on http://127.0.0.1:5000/ (Press CTRL+C to quit)

On first run, the required database tables and default data will be created
automatically. Watch the output for the creation of the `admin` user account,
and make a note of the password. If you didn't enable `DEBUG` mode, look for it
in `logs/qis.log` instead.

To run QIS in production, you will need files:

* `Quru Image Server-1.xx.tar.gz` - the main QIS Python web application
* `dependencies.tar.gz` - the application's Python dependencies,
  including compiled C extensions as platform-specific binaries
* and unless your `dependencies.tar.gz` was supplied by Quru, you will also
  need to [request a copy of the `qismagick` package](#qismagick.so) for your
  production platform

To generate these from the development project:

	$ cd <project root>
	$ . bin/activate
	$ python setup.py sdist
	$ ./package_deps.sh python2.7
	$ ls -l dist/
	...
	-rw-r--r--  1 matt  staff  27441170 28 Aug 11:19 Quru Image Server-1.33.tar.gz
	-rw-r--r--  1 matt  staff   5064883 28 Aug 11:19 dependencies.tar.gz

With these files prepared you should then follow the [install guide](doc/install.md).

QIS has been tested running inside Docker containers, see the
[Docker notes](deploy/docker/readme_docker.md).  
QIS has also been deployed on single-server and multi-server load balanced
configurations at Amazon Web Services.  
For help in deploying QIS as Docker containers or on AWS, contact Quru at
info@quru.com - we have experience of such deployments and can save you time.

## Roadmap

QIS version 1 is receiving bug fixes but no significant new features while we
start to develop new functionality for version 2:

* Store image templates in the database instead of flat files
* Enforce a default image template
  * Globally (to replace the `IMAGE_*_DEFAULT` settings)
  * By user group?
  * By folder?
  * For single images?
* Prevent certain image attributes (width, height, overlay) from being overridden
* REST API improvements
* Image search
* Web interface improvements
  * Add a grid / thumbnail browse view
  * Search and results
  * Freshen up the UI
* Ship with support for RAW camera images by default

Also under consideration:

* Convert the code base to Python 3
* Modernise the public JavaScript APIs / viewers
  * Use HTML5 `data-` attributes for code-free initialisation
  * Remove dependencies on the MooTools library (moving to vanilla JS, not jQuery!)
  * Reduce the number of included files
* Image tags
  * System-defined e.g. assignment of an image category
  * User-defined
  * Tagging a zone or location on an image
  * Searching by tag
* Image folios
  * A "basket" of selected images
  * Short URL to view the images (gallery viewer integration?)
  * Download all as a zip
  * Special access controls, e.g. guest access?
* The ability to use an object store (e.g. Amazon S3) for back-end image storage
* New imaging operations
  * Automatic crop to target dimensions
  * Generate image frames from video files
  * Enhanced EXIF / XMP support e.g. to set copyright text
* Social media integration (Instagram, Flickr, Pinterest, ...)
