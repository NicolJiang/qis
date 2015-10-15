# v1.35
_Changes: bug fix to make usernames case insensitive_

Run the following DDL (SQL) on the database server, QIS management database:

	$ sudo -u qis psql qis-mgmt
	
	DROP INDEX idx_us_username;
	CREATE UNIQUE INDEX idx_us_username ON users (lower(username));

If there are any errors (because of duplicate usernames), you will need to log
into the admin interface, rename each unwanted user account, and re-run the SQL
until it succeeds.
Or if you are comfortable working with the database, you can delete the duplicate
user accounts by first migrating row values of the `user_id` column in tables:
`usergroups`, `imagesaudit`, and `tasks`.

Update the Python and web code  
Restart the Apache service


# v1.34
_Changes: recache=1 and cache=0 are no longer public,
add html5 responsive image tags to publisher output_

These undocumented internal image parameters killed performance when used accidentally.
A new setting is required for running benchmarks, see benchmark.md for details.

Update the Python and web code  
Restart the Apache service


# v1.33
_Changes: first-run permissions now make images publicly viewable,
first version licensed under the AGPL_

Relevant only to new installations.


# v1.32.1
_Changes: adds public image width and height default/limit_

Optional: to enforce a maximum public image size (and to set a default size when
no width or height is given), add new settings to `local_settings.py`:

	PUBLIC_MAX_IMAGE_WIDTH = 1000
	PUBLIC_MAX_IMAGE_HEIGHT = 1000

Update the Python and web code  
Restart the Apache service


# v1.31
_Changes: add proxy server support_

Optional: If the installation is fronted by a proxy server or load balancer,
add a new setting to `local_settings.py`:

	PROXY_SERVERS = 1

Update the Python and web code  
Restart the Apache service


# v1.30.1
_Changes: Standardise the zoom levels in image zoomer_

Update the Python and web code (only the `canvas_view*.js` files have changed)  
Restart the Apache service


# v1.30
_Changes: switch the Memcached client to pylibmc, support badly encoded query strings_

Install libmemcached, which is a new dependency. On systems that supply
libmemcached v0.32 or above:

	sudo yum install libmemcached
	or
	sudo apt-get install libmemcached

On RHEL 6.5 you first need to install the EPEL and IUS repositories:

	# First install EPEL
	wget http://dl.fedoraproject.org/pub/epel/6/x86_64/epel-release-6-8.noarch.rpm
	sudo rpm -Uvh epel-release-6*.rpm
	# Then install IUS for RHEL 6.5
	wget http://dl.iuscommunity.org/pub/ius/stable/RedHat/6/x86_64/ius-release-1.0-14.ius.el6.noarch.rpm
	sudo rpm -Uvh ius-release*.rpm
	# Then install libmemcached v1.x (note the custom package name)
	sudo yum install libmemcached10

Update the Python dependencies  
Update the Python and web code  
Delete *.pyc:

	sudo -u qis rm -f `find src -name '*.pyc'`

If upgrading from v1.29, delete the `cache_manager_pylibmc.py` file:

	sudo -u qis rm src/imageserver/cache_manager_pylibmc.py

Restart the Apache service


# v1.29
_Changes: updated default Apache configuration, path handling bug fixes,
unofficial support for pylibmc, new documentation, add performance stats to Apache
logs, new benchmarking script_

Optional: update the Apache conf files with new defaults:

* Adds `KeepAlive` into the `VirtualHost` section
* Reduces default number of `WSGIDaemonProcess` processes from `4` to `2`
* Reduces default number of `WSGIDaemonProcess` threads from `25` to `15`
* Enables access logs (with a custom format)

Update the Python and web code  
Delete *.pyc:

	sudo -u qis rm -f `find src -name '*.pyc'`

Restart the Apache service

Unsupported: non-default but working Memcached interface using pylibmc.
See comments at the top of `cache_manager_pylibmc.py`, rename this file to
`cache_manager.py` (overwriting the default file) to enable support.


# v1.28
_Changes: markdown help pages, docs folder reorg, bug fixes_

Check `local_settings.py` for any overrides of the 4 `xxxx_BASE_DIR` settings.
If present, add a new entry for new setting `DOCS_BASE_DIR`. Consider replacing the
existing overrides with the new layout from `base_settings.py`:

	INSTALL_DIR = "/opt/qis/"
	DOCS_BASE_DIR = INSTALL_DIR + "doc/"
	ICC_BASE_DIR = INSTALL_DIR + "icc/"
	IMAGES_BASE_DIR = INSTALL_DIR + "images/"
	LOGGING_BASE_DIR = INSTALL_DIR + "logs/"
	TEMPLATES_BASE_DIR = INSTALL_DIR + "templates/"

Delete the old documentation folder (it will get replaced):

	sudo -u qis rm -rf /opt/qis/doc

Update the Python dependencies  
Update the Python and web code  
Delete *.pyc:

	sudo -u qis rm -f `find src -name '*.pyc'`

Restart the Apache service


# v1.27
_Changes: Tasks storage bug fix, add 503 too busy response, unicode filename support, bug fixes_

Stop the background tasks aux process  
Upgrade the database:

	DROP TABLE tasks;

Update the Python and web code  
Delete *.pyc:

	sudo -u qis rm -f `find src -name '*.pyc'`

Restart the Apache service


# v1.26
_Changes: API token authentication, API versioning_

Add to the SSL Apache conf file, qis-ssl.conf:

	# Pass through HTTP Auth headers for API token authentication
	WSGIPassAuthorization On

Update the users table to add an API permission flag:

	ALTER TABLE users ADD COLUMN allow_api boolean NOT NULL DEFAULT false;

Update the Python dependencies  
Update the Python and web code  
Delete *.pyc:

	sudo -u qis rm -f `find src -name '*.pyc'`

Restart the Apache service


# v1.25
_Changes: Slideshow improvements, clean aux process shutdowns, auto template reloading, psutil v2.2.1, imaging bug fixes, cache key collision detection_

Edit wsgi.conf to allow signals:

	WSGIRestrictSignal Off

Update the Python dependencies (including qismagick.so)  
Update the Python and web code  
Delete *.pyc:

	sudo -u qis rm -f `find src -name '*.pyc'`

Kill the QIS aux processes  
Optionally restart memcached

	DROP TABLE cachectl; /* Faster than waiting for deletion of all rows */

Restart the Apache service  
If memcached is not restarted, expect "Cache value integrity" errors
in the logs until the old cache values have all been replaced for
`DB:IMG_ID`, `IMG_MD`, and `FPERM` keys.


# v1.24
_Changes: Gamma correction for sRGB image resizes_

New qismagick.so, so update the dependencies (lib folder)  
Delete *.pyc:

	sudo -u qis rm -f `find src -name '*.pyc'`

Update the Python and web code  
Restart the Apache service


# v1.23
_Changes: Revised groups, task priorities and results, task polling APIs, folder moves as tasks, fix JSON date encoding, UI bug fixes_

Update the groups specification and add new task fields:

	UPDATE groups SET group_type=1, name='Administrators' where id=3;
	ALTER TABLE tasks ADD COLUMN priority int NOT NULL DEFAULT 20;
	ALTER TABLE tasks ADD COLUMN result text NULL;

Delete *.pyc:

	sudo -u qis rm -f `find src -name '*.pyc'`

Update the Python and web code  
Kill the QIS aux processes  
Restart the Apache service


# v1.22
_Changes: Daily anonymous stats upload, tidy-ups_

Update the Python and web code  
Delete *.pyc:

	sudo -u qis rm -f `find src -name '*.pyc'`

Delete `src/imageserver/identity.*`  
Kill the QIS aux processes  
Restart the Apache service


# v1.21
_Changes: Refactored and improved settings_

Create the new local `conf` directory  
Move the local settings file to the new `conf` directory as `local_settings.py`  
Edit local settings file:

1. Delete `PORT
2. Replace `SERVER_PUBLIC_URL = "http://foo/"`
   with    `PUBLIC_HOST_NAME = "foo"`
3. Any override for `INTERNAL_BROWSING_SSL` now needs to
   reset            `SESSION_COOKIE_SECURE` too

Update the Python and web code  
Delete *.pyc:
  
	sudo -u qis rm -f `find src -name '*.pyc'`

Delete the old settings files in `src/imageserver/conf/` (dev and quru)  
Kill the QIS aux processes  
Restart the Apache service


# v1.20
_Changes: Multiple file upload API, drag & drop uploads, login API_

Update the Python and web code  
Delete *.pyc  
Restart the Apache service


# v1.19
_Changes: Fixed and enhanced stats_

Note due to the fixed image stats bug (creating 60x the correct number of records),
I recommend dropping the imagestats table entirely before upgrading:

	DROP TABLE imagestats;

But the alternative is to upgrade it beforehand and leave the extra data in place:

	ALTER TABLE imagestats ADD COLUMN requests bigint NOT NULL DEFAULT 0;
	ALTER TABLE imagestats ADD COLUMN cached_views bigint NOT NULL DEFAULT 0;
	ALTER TABLE imagestats ADD COLUMN request_seconds double precision NOT NULL DEFAULT 0;
	ALTER TABLE imagestats ADD COLUMN max_request_seconds double precision NOT NULL DEFAULT 0;

Delete the alembic package  
Upgrade the requests package from the Python requirements.txt  
Install the psutil package from the Python requirements.txt  
Stop the QIS stats aux process  
Perform remaining database changes:

	DROP TABLE imagestats; /* Recommended (if not upgrading) */
	ALTER TABLE systemstats RENAME COLUMN hits TO requests;
	ALTER TABLE systemstats ADD COLUMN max_request_seconds double precision NOT NULL DEFAULT 0;
	DROP TABLE alembic_version;

Update the Python and web code  
Delete *.pyc  
Restart the Apache service


# v1.18
_Changes: Re-written image publisher_

Update the Python and web code  
If upgrading from v1.16, restart memcached (see v1.17 notes)  
Restart the QIS service


# v1.17
_Changes: Fix ETags, implement HTTP 304, longer default caching, SQLA 0.9.8_

**NOTE:** Commit 018a755 causes old KRGB cache keys to become Krgb, therefore the cache needs to be reset or left to rebuild.

Add 7 day Expires instructions to the the Apache conf files  
Update the Python dependencies, Python and web code  
Review settings file for the image cache expiry time  
Stop the QIS service  
Restart memcached (see above)  
Start the QIS service


# v1.16.4
_Changes: Bug fixes, MooTools upgrade_

Update the Python and web code  
Restart the QIS service


# v1.16.2, v1.16.3
_Changes: Library version bumps, Docker support, tidy distribution scripts, bug fixes to aux process socket binding, fix SSL confs for POODLE_

Upgrade SQLAlchemy to 0.9.4 (v1.16.2), 0.9.7 (v1.16.3):

	$ sudo -u qis bash -c 'export PYTHONPATH=/opt/qis/lib/python2.6/site-packages && pip install --install-option="--prefix=/opt/qis" -r doc/requirements.txt'

Update the Python and web code  
Restart the QIS service


# v1.16.1
_Changes: Apache conf upgrades, distribute robots.txt_ 

Copy from source code, if it does not exist:

	/opt/qis/src/imageserver/static/robots.txt

Apply changes to wsgi.conf:

	WSGIRestrictEmbedded On

Apply changes to qis.conf:

    WSGIApplicationGroup qis
    # Preload the code to reduce the delay at startup
    WSGIImportScript /opt/qis/src/wsgi/runserver.wsgi process-group=qis application-group=qis

Apply changes to qis-ssl.conf:

    WSGIApplicationGroup qis
    # Preload the code to reduce the delay at startup
    WSGIImportScript /opt/qis/src/wsgi/runserver.wsgi process-group=qis-ssl application-group=qis

Restart the QIS service


# v1.15 to 1.16.1
_Changes: Gallery bug fixes, bug fixes to crop + rotate behaviour, bug fix to PNG to JPG conversion, progressive JPG support_

Upgrade SQLAlchemy to 0.9.2, psycopg2 to 2.5.2:

	$ sudo -u qis bash -c 'export PYTHONPATH=/opt/qis/lib/python2.6/site-packages:/opt/qis-python/lib64/python2.6/site-packages && /opt/qis-python/bin/pip install --install-option="--prefix=/opt/qis" -r doc/requirements.txt'

Install the new qismagick.so  
Update the Python and web code  
Stop the QIS service  
Stop the QIS auxiliary processes  
Start the QIS service


# v1.13.1255 to 1.15
_Changes: Use private gs, colorspace param, working colour management, flip param, page param, DPI setting for PDF conversions, overlay params, publishing wizard, gallery viewer, alignment params, architectural changes and wheel deployment_

Add missing Directory and Alias entries in the Apache confs:

    Alias /admin/static/   /opt/qis/src/imageserver/admin/static/
    Alias /reports/static/ /opt/qis/src/imageserver/reports/static/
    
    <Directory /opt/qis/src/imageserver/admin/static>
        Order deny,allow
        Allow from all
    </Directory>
    <Directory /opt/qis/src/imageserver/reports/static>
        Order deny,allow
        Allow from all
    </Directory>

Reduce the number of database connections in the settings file to total 50 or less

Upgrade qis-ImageMagick (or the system ImageMagick) to 6.8.4-10 via RPM (or via manual install)

Upgrade SQLAlchemy to 0.8.2, python-memcached to 1.53, Flask to 0.10.1, add alembic and requests:

	$ sudo -u qis bash -c 'export PYTHONPATH=/opt/qis/lib/python2.6/site-packages:/opt/qis-python/lib64/python2.6/site-packages && /opt/qis-python/bin/pip install --install-option="--prefix=/opt/qis" -r doc/requirements.txt'

Add new columns to SystemStats table:

    hits bigint not null default 0
    request_seconds double not null default 0

Upgrade image templates to:
* Update the comments for "strip" and "icc" and "dpi".
* Add the new "colorspace" option.
* Add the new "flip" option.
* Add the new "page" option.
* Add the new "overlay" option.
* Add the new "ovsize" option.
* Add the new "ovpos" option.
* Add the new "ovopacity" option.
* Add the new "halign" option.
* Add the new "valign" option.

Install the new qismagick.so  
Update the Python and web code  
Check the new `PDF_FILE_TYPES` setting is present  
Check the new `GHOSTSCRIPT_PATH` setting is correct  
Stop the QIS service  
Stop the QIS auxiliary processes  
Restart the memcached service  
Start the QIS service  

Also had to create a new directory after upgrading setuptools:

	/opt/qis/.python-eggs

and make it writable to the Apache/mod_wsgi processes.


# v1.12.1242 to 1.13.1255
_Changes: Folder permissions admin and engine, enhanced admin_

Update the Python and web code from SVN.  
Stop the QIS auxiliary processes.  
Restart the QIS service  
Set up the desired groups and folder permissions


# v1.12.1199 to v1.12.1242
_Changes: Fix for foreign key error in stats recording process_

Update the Python and web code from SVN.  
Stop the QIS auxiliary processes.  
Restart the QIS service.


# v1.12.1142 to 1.12.1199
_Changes: Unicode filename support, faster caching, switch to binary pickle for cache items_

Check the database character set encoding is UTF8 for qis-mgmt and qis-cache:

	$ psql -U owner_user qis-mgmt
	# \l

Specify the Python LANG to use under mod_wsgi, in either `/etc/sysconfig/httpd` or `/etc/sysconfig/apache2`:

	# QIS
	# These lines are required to avoid "ascii codec can't decode byte" errors
	# when dealing with files and directories that contain non-ascii characters
	export LANG="en_GB.UTF-8"
	export LC_ALL="en_GB.UTF-8"

Update the Python and web code from SVN.  
Stop the QIS service.  
Stop the QIS auxiliary processes.  
Stop the memcached service.  
Start the memcached service.  
Start the QIS service.


# v1.0.887 to 1.12.1142
_Changes: Enhanced admin, adds groups and permissions, better PDF handling, file system syncing, bg tasks engine, nostats op renamed to stats, slideshow viewer, new housekeeping tasks, folder permission tables_

Consider upgrading Ghostscript to v9.04 or above. Conversion for some catalogues requires v9.05 or above for indexed color space bug fixes.

On production servers:  
Back up the Apache conf files, QIS templates, wsgi bootstrap and conf files  
Upgrade from a new rpm, check/restore conf files and wsgi file, resume at template editing:

	$ sudo rpm -U qis-1.12-1142.qis.el6.x86_64.rpm
	$ sudo rm -rf /opt/qis/dist/*.sh /opt/qis/dist/*.spec
	$ sudo rm -rf /opt/qis/doc/
	$ sudo rm -rf /opt/qis/src-c/
	$ sudo rm -f /opt/qis/src/*.sh /opt/qis/src/*.py*

On dev servers:  
Upgrade SQLAlchemy to 0.7.10, Werkzeug to 0.8.3, Flask to 0.9, python-ldap to 2.4.10:

	$ sudo su qis
	$ export PYTHONPATH=/opt/qis/lib/python2.6/site-packages:/opt/qis-python/lib64/python2.6/site-packages
	$ /opt/qis-python/bin/easy_install -U --prefix=/opt/qis/ SQLAlchemy==0.7.10
	$ /opt/qis-python/bin/easy_install -U --prefix=/opt/qis/ Werkzeug==0.8.3
	$ /opt/qis-python/bin/easy_install -U --prefix=/opt/qis/ Flask==0.9
	$ /opt/qis-python/bin/easy_install -U --prefix=/opt/qis/ python-ldap==2.4.10
	$ rm -rf /opt/qis/lib/python2.6/site-packages/SQLAlchemy-0.7.8*
	$ rm -rf /opt/qis/lib/python2.6/site-packages/Werkzeug-0.7*
	$ rm -rf /opt/qis/lib/python2.6/site-packages/Flask-0.7*
	$ rm -rf /opt/qis/lib/python2.6/site-packages/python_ldap-2.4.6*

Update the Python and web code from SVN  
Install a new libpymagick.so  
Remove `statslogserver` directory if it still exists  
Update the templates from SVN  
Edit custom templates to replace the `nostats` section  
Stop the QIS service.  
Stop the QIS auxiliary processes.  
Stop the memcached service.  
Start the memcached service.  
Start the QIS service.  
Insert default data for newly created tables:

	$ psql -U owner_user qis-mgmt
	
	/* Add admin to super users */
	INSERT INTO usergroups(user_id, group_id) VALUES (1, 3);
	
	/* Generate inserts to add everyone to Normal Users */
	SELECT 'INSERT INTO usergroups (user_id, group_id) VALUES ('||id||',2);' FROM users;
	SELECT 'Now run the created SQL insert statements!';
	
	SELECT 'Also assign your admin users to the super users group';
	
	/* Create base folder permissions - backwards compatible, not the new defaults */
	INSERT INTO folderpermissions (folder_id, group_id, access) VALUES (1, 1, 10);
	INSERT INTO folderpermissions (folder_id, group_id, access) VALUES (1, 2, 40);
	
	/* Add new image table index */
	CREATE INDEX idx_im_folder ON images USING btree (folder_id, status);
	
	/* Upgrade image history */
	ALTER TABLE imagesaudit ALTER COLUMN action_info TYPE text;
	
	/* Delete stored image sizes for PDF files */
	DELETE FROM imagestats WHERE image_id IN (SELECT id FROM images WHERE src LIKE '%.pdf');
	DELETE FROM imagesaudit WHERE image_id IN (SELECT id FROM images WHERE src LIKE '%.pdf');
	DELETE FROM images WHERE src LIKE '%.pdf';


# v1.0.887
_Changes:  bug fix for template load error with an ICC profile_

Released immediately


# v1.0.823 to v1.0.878
_Changes: Canvas viewer tablet support fixes, nostats template support_

Add the "nostats" section to all template files. **NOTE:** JAN 2013 - `nostats` changed to `stats`  
Update the Python and web code from SVN.  
Re-start the QIS service.


# v1.0.812 to v1.0.823
_Changes: Canvas viewer bug fixes and API additions_

Upgrade SQLAlchemy and psycopg2:

	$ sudo su qis
	$ export PYTHONPATH=/opt/qis/lib/python2.6/site-packages:/opt/qis-python/lib64/python2.6/site-packages
	$ /opt/qis-python/bin/easy_install -U --prefix=/opt/qis/ SQLAlchemy==0.7.8
	$ rm -rf /opt/qis/lib/python2.6/site-packages/SQLAlchemy-0.7.5*
	$ /opt/qis-python/bin/easy_install -U --prefix=/opt/qis/ psycopg2==2.4.5
	$ rm -rf /opt/qis/lib/python2.6/site-packages/psycopg2-2.4.4*

Update the Python and web code from SVN.  
Re-start the QIS service.


# v1.0.783 to v1.0.812
_Changes: Viewer API improvements, canvas viewer first release_

Update the Python and web code from SVN.  
Re-start the QIS service.  
Upgrade web site code (only simple viewer changes listed):

* Include only 1 combined MooTools JS
* Rename all `img_simple_view_*` functions to `simple_view_*`
* Remove any uses of `simple_view_init` colour parameter (3)
* Rename any `simple_view_init2` to `simple_view_init_image`
* Rename any `simple_view_reset2` to `simple_view_reset_image`

**NOTE:** temporary compatibility layer allows `img_simple_view_*` functions to continue working until the next release.


# v1.0.740 to v1.0.783
_Changes: ICC bug fixes, PDF bug fixes_

Update the Python and web code from SVN.  
Install a new libpymagick.so.  
Re-start the QIS service.
Delete image records for existing PDF files (those that have 0x0 as dimensions):

	$ sudo -u qis psql qis-mgmt
	# delete from images where src like '%.pdf' and width=0;


# v0.9.592 to v1.0.696
_Changes: adds tiled image zoomer_

Stop the QIS service.  
Stop the QIS auxilliary processes.  
Stop the memcached service.  
Drop the cachectl table:

	$ psql imagecachedb imaging
	# drop table cachectl;

Enhance the images and folders tables to support long file paths:

	$ psql imagedb imaging
	# alter table images alter column src type varchar(1024);
	# alter table folders alter column path type varchar(1024);
	# alter table folders alter column name type varchar(1024);

Enhance the images table to store image dimensions:

	$ psql imagedb imaging
	# alter table images add column width integer default 0 not null;
	# alter table images add column height integer default 0 not null;

Update the python code from SVN.  
Install a new libpymagick.so.  
Start the memcached service.  
Start the QIS service.


# v0.9.558 to v0.9.592
_Changes: re-structured Flask initializer_

Activate the QIS python environment.  
Upgrade psycopg2 to version 2.4.2, remove old version:

	$ sudo -u qis easy_install psycopg2==2.4.2

Update the code from SVN.  
Edit `runserver.wsgi` and change the last line:

	from imageserver import app as application
	to:
	from imageserver.flask_app import app as application

Re-start the QIS service.


# v0.9.472 to v0.9.558
_Changes: enable stats recording_

Activate the QIS python environment.  
Set the `QIS_SETTINGS` environment variable.  
Stop the QIS service.  
Stop the QIS auxilliary processes.  
Update the code from SVN.  
Delete the cached image IDs:

	$ python utils/cache_util.py del_ids

Drop the imagestats and systemstats tables:

	$ psql imagedb imaging
	# drop table systemstats;
	# drop table imagestats;

Start the QIS service.


# v0.8 to v0.9

Change to the image server user:

	$ sudo su qis

To add LDAP support, install OpenLDAP, then install and test python-ldap:

	<activate environment>
	$ easy_install python-ldap
	$ python
	>>> import ldap
	>>> quit()

On error from easy_install or the "import ldap" command, verify that the 
OpenLDAP libraries and its dependencies are installed and install or 
update them.

Note that the openssl-devel package may be required. Try installing this
before attempting to resolve "libssl not found" errors as below.

On error from easy_install, if the include or library path is wrong, you can
download the python-ldap source code, and edit setup.cfg:

	[_ldap]
	library_dirs = /opt/openldap-RE24/lib /usr/lib /lib
	include_dirs = /opt/openldap-RE24/include /usr/include/sasl /usr/include

Then install (from the activated environment) with:

	$ python setup.py build
	$ python setup.py install

See also http://www.python-ldap.org/doc/html/installing.html

End LDAP section.

Stop the QIS service  
Create diff of `base_settings.py`  
Delete `base_settings.py`  
svn update all source code  
Re-apply diff changes as a new settings.py file  
Set the new or changed settings in the new settings file:

	INTERNAL_BROWSING_PORT
	SECRET_KEY (use os.urandom(24))
	LOGGING_SERVER and LOGGING_SERVER_PORT
	STATS_SERVER and STATS_SERVER_PORT
	LDAP settings
  
Set the name of the settings.py file in runserver.wsgi.

Upgrade Flask to v0.72:

	$ easy_install -U Flask

Upgrade SQLAlchemy to v0.72:

	$ easy_install -U SQLAlchemy

Delete the old cache control database in Postgres, and create the new version
and new management database:

	$ psql postgres postgres
	# drop database qisdb;
	# drop user qis;
	# create user imaging with createdb password 'imaging';
	# create database imagecachedb owner imaging;
	# create database imagedb owner imaging;
	# \q

Disable Apache access logs and hostname lookups for mod_wsgi virtual hosts.
Add the following line to the image server Apache conf files:

	CustomLog /var/log/apache2/qis_access_log common env=NON_EXISTENT
	HostnameLookups Off

Enable Apache SSL session caching if there is an SSL virtual host, and if it is
not already enabled. Add one of the following lines to the main Apache conf file
(outside of a VirtualHost):

	SSLSessionCache shm:/var/log/apache2/ssl_gcache_data(512000)
	or
	SSLSessionCache dbm:/var/log/apache2/ssl_gcache_data

Start the QIS service
