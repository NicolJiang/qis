# API user's guide

Quru Image Server provides a web-based Application Programming Interface (API) so that
software developers can integrate QIS into their own web sites and imaging solutions.

The API consists a number of HTTP [RESTful web services](http://en.wikipedia.org/wiki/Representational_state_transfer#RESTful_web_services)
that return data in the [JSON](http://www.json.org/) format.

## Contents

* [About JSON](#json)
* [Using the API](#usage)
* [Public web services](#api_public)
	* [list - lists the images in a folder path](#api_list)
	* [details - retrieve image information by path](#api_details)
* [Protected web services](#api_private)
	* [token - obtain an API authentication token](#api_token)
	* [upload - upload an image](#api_upload)
* [Administration web services](#api_admin)
	* [image data - manage image metadata](#api_data_images)
	* [image templates - manage image templates](#api_data_templates)
	* [users - manage user accounts](#api_data_users)
	* [groups - manage groups and system permissions](#api_data_groups)
	* [group membership - manage group members](#api_data_usergroups)
	* [folder permissions - manage access permissions](#api_data_permissions)
	* [disk files - manage the file system](#api_disk_files)
	* [disk folders - manage the file system](#api_disk_folders)
	* [system tasks - run background tasks](#api_tasks)

<a name="json"></a>
## About JSON

[JavaScript Object Notation](http://www.json.org/) (JSON) is a lightweight format used for
exchanging data. Despite being based on a small subset of JavaScript, JSON is language independent,
and is typically smaller and simpler to use than alternative data formats such as XML.

JSON handling libraries are available for almost all common programming languages in use today,
including Java, C, C#, PHP, Python, Ruby, Perl, Visual Basic, and so on.

Importantly for web applications, JSON data can be retrieved and converted directly into
JavaScript objects from within the web browser. Native support for the encoding and decoding of
JSON data is built into all modern web browsers, and can be emulated in older web browsers that
support JavaScript. In addition, most of the common JavaScript frameworks such as
[jQuery](http://jquery.com/) provide a simple means of calling JSON web services via XHR
(sometimes known as Ajax).

<a name="usage"></a>
## Using the API

### Calling an API function from a web page

The following HTML fragment illustrates how to call an API function from a web page
using JavaScript and the MooTools framework. If you are using a different JavaScript framework
(or no framework), the required code will be different but the concepts are the same.

	<script src="http://images.example.com/static/js/mootools-core.js" type="text/javascript"></script>
	
	<script>
		var ajaxRequest = new Request.JSON({
			
			// Set the URL of the API web service
			url: 'http://images.example.com/api/v1/list',
			
			// Set the parameters for the API call
			data: { 'path': 'myfolder' },
			
			// GET, POST, PUT, or DELETE (as supported by the API call)
			method: 'GET',
			
			// Authentication token, not required for public API functions
			// user: 'abcdef0123456789abcdef0123456789',
			// password: 'unused',
			
			// Callback function on success
			onSuccess: function(jsonObj) {
				alert('Successfully returned with status code ' + jsonObj.status);
				alert('The folder contains ' + jsonObj.data.length + ' images');
			},
			
			// Callback function on error
			onFailure: function(xhr) {
				alert('The request failed with status code ' + xhr.status);
			}
		});
		
		// Initiate the API request
		ajaxRequest.send();
	</script>

### Calling an API function with cURL

[cURL](http://curl.haxx.se/) is a popular command line utility that allows you to make HTTP calls
without a web browser. It is available for all common operating systems, and allows you to create
useful scripts and quickly test individual functions.

This document will also use cURL for most of its examples. In these, the `$` represents the
command line prompt, and is not to be typed. The cURL equivalent of the above HTML example is simply:

	$ curl 'http://images.example.com/api/v1/list?path=myfolder'

This displays the raw JSON text returned by the server, but does not check the values or process
them.

### Call methods

The following types of method are supported in general.
See the rest of the documentation for which methods are supported by which API calls.

<table class="padded">
	<tr class="odd"><td><i>Method</i></td><td><i>Meaning</i></td></tr>
	<tr class="even"><td><code>GET</code></td><td>Get and return an existing object</td></tr>
	<tr class="odd"><td><code>POST</code></td><td>Create and return a new object</td></tr>
	<tr class="even"><td><code>PUT</code></td><td>Update an existing object</td></tr>
	<tr class="odd"><td><code>DELETE</code></td><td>Delete an object</td></tr>
</table>

For the `PUT` and `POST` methods, parameters should be sent using standard form encoding 
(`application/x-www-form-urlencoded`). An exception to this is if you are performing a file upload, 
in which case `multipart/form-data` encoding is required. If you are using a JavaScript framework
such as in the HTML example above, this detail will be taken care of automatically.

### Return values

Every API call returns JSON text containing the requested data within a wrapper object.
The wrapper provides a status code and (if relevant) an error message.
The following JSON illustrates a successful API call:

	{
		status: 200,
		message: "OK",
		data: [1, 2, 3, 4, 5]
	}

The `data` attribute provides the return value from the API call, with the return value
being different for each API function. On error, the `data` attribute is usually set to `null`.

In the HTML example function call above, the MooTools framework has taken care of converting
the returned JSON text into a JavaScript object for us, making it available as `jsonObj`.
The code is then able to access the results of the function as `jsonObj.status`, `jsonObj.message`
and `jsonObj.data`.

Because the API functions are called using HTTP, in addition to the status code returned
in the JSON there is also an HTTP status code associated with the whole response. At present
these status codes are set to the same value and you can check either one. In keeping with
HTTP standards, status codes beginning with 2xx indicate success, those beginning 4xx indicate
a problem with the client's request, and those beginning 5xx indicate a problem on the server side.

The following status codes may be returned:

<table class="padded">
	<tr class="odd"><td><i>Status</i></td><td><i>Meaning</i></td></tr>
	<tr class="even"><td>200</td><td>Success, complete</td></tr>
	<tr class="odd"><td>202</td><td>Success, but the function is continuing in the background</td></tr>
	<tr class="even"><td>400</td><td>A parameter to the function was missing or invalid</td></tr>
	<tr class="odd"><td>401</td><td>The client must be logged in to use the function</td></tr>
	<tr class="even"><td>403</td><td>The client does not have permission to perform the requested action</td></tr>
	<tr class="odd"><td>404</td><td>The requested path or image does not exist</td></tr>
	<tr class="even"><td>409</td><td>The item already exists</td></tr>
	<tr class="odd"><td>415</td><td>The requested image is invalid or unsupported</td></tr>
	<tr class="even"><td>500</td><td>Some other error occurred (check the server log files)</td></tr>
	<tr class="odd"><td>503</td><td>The server is too busy (wait a short time and try again)</td></tr>
</table><br>


<a name="api_public"></a>
# Public web services

For publicly accessible images, these web services can be called from an anonymous
(not logged in) session without requiring an [API authentication token](#api_token).
For images with a [folder permission](#api_data_permissions) in place,
a token is still required however.

<a name="api_list"></a>
## list
Retrieves the list of the images within a folder path, returning the filename, a URL to display
the image, and optionally additional image attributes. This function returns a maximum of 1,000
images by default.

### URL
* `/api/v1/list`

### Supported methods
* `GET`

### Parameters
* `path` - Mandatory, text - Specifies the folder path to list
* `attributes` - Optional, boolean - When true, adds the unique ID, title, description, width and
	height fields from the image database to the returned objects. Set to false for improved
	performance if these fields are not required.
* `limit` - Optional, integer - The maximum number of results to return, default `1000`. Or set to
    `0` to specify no limit.
* _`[any]`_ - Optional, mixed - Any additional parameters are appended to the returned image URLs so
	that for example the required image sizes can be specified

### Permissions required
* View permission for the requested folder path
* If no authentication token has been provided, the folder must be publicly accessible

### Returns
An array of 0 or more objects.

### Example

	$ curl 'http://images.example.com/api/v1/list?path=myfolder&attributes=1&tmp=Thumbnail'
	{
	  "data": [
	    {
	      "url": "http://images.example.com/image?tmp=Thumbnail&src=myfolder%2Fimage1.jpg", 
	      "id": 1000, 
	      "title": "", 
	      "description": "", 
	      "height": 1200, 
	      "width": 1600, 
	      "filename": "image1.jpg"
        },
	    {
	      "url": "http://images.example.com/image?tmp=Thumbnail&src=myfolder%2Fimage2.jpg", 
	      "id": 1001, 
	      "title": "", 
	      "description": "", 
	      "height": 1200, 
	      "width": 1600, 
	      "filename": "image2.jpg"
	    },
	    {
	      "url": "http://images.example.com/image?tmp=Thumbnail&src=myfolder%2Fimage3.jpg", 
	      "id": 1002, 
	      "title": "", 
	      "description": "", 
	      "height": 3000, 
	      "width": 4000, 
	      "filename": "image3.jpg"
	    }
	  ],
	  "message": "OK",
	  "status": 200
	}

<a name="api_details"></a>
## details
Retrieves the attributes of a single image from its path.

### URL
* `/api/v1/details`

### Supported methods
* `GET`

### Parameters
* `src` - Mandatory, text - The folder and filename of an image

### Permissions required
* View permission for the folder that the image resides in
* If no authentication token has been provided, the folder must be publicly accessible

### Returns
An object containing image attributes, as shown below.

### Example

	$ curl 'http://images.example.com/api/v1/details?src=myfolder/myimage.jpg'
	{
	  "data": {
	    "id": 4,
	    "title": "",
	    "description": "",
	    "download": true,
	    "height": 1200,
	    "src": "myfolder/myimage.jpg",
	    "url": "http://images.example.com/image?src=myfolder/myimage.jpg",
	    "width": 1600
	  },
	  "message": "OK",
	  "status": 200
	}


<a name="api_private"></a>
# Protected web services

All other web services require the caller to be logged in so that permissions can be
checked and a username recorded in the audit trail. Since the QIS login web page cannot be
used alongside the API, to achieve this the caller must first obtain an
[API authentication token](#api_token) and then provide this along with every function call.

<a name="api_token"></a>
## token
This service returns a unique time-limited token that can be used to call all the other API functions.
It is the equivalent of logging in on the QIS web site, and in fact requires the username and
password of a valid QIS user.

The advantage of obtaining a token is that the username and password are only required once,
and they never need to leave the server side. The token can then be passed through to a less secure
area (e.g. a web page) with the username and password never having been revealed. Note that the token
must also be treated securely, as anyone who takes a copy of it will then be able to use it to access
the API until that token expires. On a web site therefore, use an encrypted HTTPS connection and do
not pass around the token where it can be seen (e.g. on the end of a URL).

The token's expiry time is configured by the `API_TOKEN_EXPIRY_TIME` system setting.
The default value is 1 hour.

### URL
* `/api/v1/token`

### Supported methods
* `POST`

### Parameters
* `username` - Mandatory, text - The username to authenticate with
* `password` - Mandatory, text - The password to authenticate with

These parameters can be supplied either as standard `POST` data,
or alternatively using [HTTP Basic Authentication](http://en.wikipedia.org/wiki/Basic_access_authentication) instead.

### Permissions required
* The username must match an existing QIS user account
* That user account must have the _Allow API_ setting enabled

### Returns
An object that currently has only one attribute - `token` - as a string.

To use the token, call the other API functions using
[HTTP Basic Authentication](http://en.wikipedia.org/wiki/Basic_access_authentication)
with the token as the username value. The password value is unused and can be blank or a dummy value.

### Example

	$ curl -X POST -u username:password 'https://images.example.com/api/v1/token'
	{
	  "data": {
	    "token": "eyJhbGciOiJIUzI1NiIsImZ4cCI6MTQyOTcwNTI4NSwibWF0IjoxNDI5NzAxNjg1fQ.eyJ1c2VyX2lkIj5zfQ.nVdH2Eee8aw2lUamFSz3Wu6CKPl49GrrGz-2LgN791Y"
	  },
	  "message": "OK",
	  "status": 200
	}

<a name="api_upload"></a>
## upload
Uploads one or more image files, optionally replacing any existing files that already exist
with the same name.

### URL
* `/api/v1/upload`

### Supported methods
* `POST`

### Parameters
* `files` - Mandatory, binary - One or more files to upload
* `path_index` - Mandatory, integer - The destination folder index, or -1
	* If 0 or above, this is the index of a standard upload folder as defined by the
	  `IMAGE_UPLOAD_DIRS` system setting. As a trusted location, the folder will be
	  created if it does not already exist.
	* If -1, you must specify the destination folder in the `path` parameter. 
* `path` - Optional, text - The destination folder path used when `path_index` is -1.
  This folder path must already exist. You can use the [disk folder](#api_disk_folders) API
  to find or create a folder.
* `overwrite` - Mandatory, boolean - Whether to overwrite existing files if they already
  exist with the same name in the destination folder

As is standard for file upload forms on the web, the parameter data must be
`multipart/form-data` encoded.

### Permissions required
* Upload permission for the destination folder

### Returns
An object containing one attribute for every uploaded file, which maps the original filename
to either success data or an error object. Success data is in the same format as for the
[image details](#api_details) function. The error object contains the same data as the standard
API error response.

Note that for each uploaded file, the returned filename may be different from the original filename.
This is because dangerous or unsupported characters are removed from filenames. By default, unicode
letters and numbers are allowed, but not unicode symbols. You can have unicode letters converted to
their simplest form (ASCII) by disabling the `ALLOW_UNICODE_FILENAMES` system setting.

If all files are uploaded successfully, the returned status will be `OK` and the data object as
described above.

If one file upload fails, the function continues to try all the other files, but returns a status
of error (describing the first error that occurred). The data object is returned as described above,
meaning you need to check the entry for each filename to determine which files were uploaded and
which failed (and why).

If there is an error with a parameter such that no uploads were even attempted,
no data object is returned.

### Examples

	$ curl -X POST -u <token>:unused -F files=@myimage.jpg -F path_index=-1 -F path=test_images -F overwrite=false 'https://images.example.com/api/v1/upload'
	{
	  "data": {
	    "myimage.jpg": {
	      "id": 524,
	      "title": "",
	      "description": "",
	      "download": true,
	      "height": 1200,
	      "src": "test_images/myimage.jpg",
	      "url": "http://images.example.com/image?src=test_images/myimage.jpg",
	      "width": 1600
	    }
	  },
	  "message": "OK",
	  "status": 200
	}

But then running the same command again:

	$ curl -X POST -u <token>:unused -F files=@myimage.jpg -F path_index=-1 -F path=test_images -F overwrite=false 'https://images.example.com/api/v1/upload'
	{
	  "data": {
	    "myimage.jpg": {
	      "error": {
	        "data": null,
	        "message": "The specified item already exists (file 'myimage.jpg' already exists at this location on the server)",
	        "status": 409
	      }
	    }
	  },
	  "message": "The specified item already exists (file 'myimage.jpg' already exists at this location on the server)",
	  "status": 409
	}

<a name="api_admin"></a>
# Administration web services

These web services provide file system, user, group, data management, and system maintenance
facilities. All require an [API authentication token](#api_token) to be provided.

<a name="api_data_images"></a>
## image data
Gets or updates image metadata in the image database.

### URL
* `/api/v1/admin/images/[image id]/`

### Supported methods
* `GET`
* `PUT`

### Parameters
* None for `GET`
* For `PUT`:
	* `title` - Mandatory, text - the image title
	* `description` - Mandatory, text - the image description

### Permissions required
* View permission for the folder that the image resides in
* Edit permission is required for `PUT`

### Returns
The image's database object.

### Examples

	$ curl -u <token>:unused 'https://images.example.com/api/v1/admin/images/524/'
	{
	  "data": {
	    "description": "",
	    "folder": {
	      "id": 3,
	      "name": "/test_images",
	      "parent_id": 1,
	      "path": "/test_images",
	      "status": 1
	    },
	    "folder_id": 3,
	    "height": 1200,
	    "id": 524,
	    "src": "test_images/myimage.jpg",
	    "status": 1,
	    "title": "",
	    "width": 1600
	  },
	  "message": "OK",
	  "status": 200
	}

	$ curl -X PUT -u <token>:unused -F 'title=my sample image' -F 'description=the updated description of my sample image' 'https://images.example.com/api/v1/admin/images/524/'
	{
	  "data": {
	    "description": "the updated description of my sample image",
	    "folder": {
	      "id": 3,
	      "name": "/test_images",
	      "parent_id": 1,
	      "path": "/test_images",
	      "status": 1
	    },
	    "folder_id": 3,
	    "height": 1200,
	    "id": 524,
	    "src": "test_images/myimage.jpg",
	    "status": 1,
	    "title": "my sample image",
	    "width": 1600
	  },
	  "message": "OK",
	  "status": 200
	}

<a name="api_data_templates"></a>
## image templates
Gets the content of an image template.

### URL
* `/api/v1/admin/templates/[template_name]/`

### Supported methods
* `GET`

### Parameters
* None

### Permissions required
* None

### Returns
An object containing the image generation parameter names and values defined in the template.
Values are `null` if the template does not set them.

### Example

	$ curl -u <token>:unused 'https://images.example.com/api/v1/admin/templates/smalljpeg/'
	{
	  "data": {
	    "align_h": null,
	    "align_v": null,
	    "attachment": null,
	    "bottom": null,
	    "colorspace": "rgb",
	    "crop_fit": null,
	    "dpi_x": 72,
	    "dpi_y": 72,
	    "expiry_secs": null,
	    "filename": "smalljpeg",
	    "fill": null,
	    "flip": null,
	    "format": "jpg",
	    "height": 200,
	    "icc_bpc": null,
	    "icc_intent": null,
	    "icc_profile": null,
	    "left": null,
	    "overlay_opacity": null,
	    "overlay_pos": null,
	    "overlay_size": null,
	    "overlay_src": null,
	    "page": null,
	    "quality": 70,
	    "record_stats": null,
	    "right": null,
	    "rotation": null,
	    "sharpen": 50,
	    "size_fit": null,
	    "strip": true,
	    "template": null,
	    "tile": null,
	    "top": null,
	    "width": 200
	  },
	  "message": "OK",
	  "status": 200
	}

<a name="api_data_users"></a>
## users
Lists all user accounts, or gets, creates, updates, or deletes a single user account.

### URL
* `/api/v1/admin/users/` for `GET` (list users) and `POST`
* `/api/v1/admin/users/[user id]/` for `GET`, `PUT`, and `DELETE`

### Supported methods
* `GET`
* `POST`
* `PUT`
* `DELETE`

### Parameters
* None for `GET` or `DELETE`
* For `POST` and `PUT`:
	* `first_name` - Mandatory, text - The user's first name
	* `last_name` - Mandatory, text - The user's last name
	* `email` - Mandatory, text - The user's email address
	* `username` - Mandatory, text - The account username
	* `password` - Mandatory for `POST`, optional for `PUT`, text - The account password
	* `auth_type` - Mandatory, integer - Should be set to `1`
	* `allow_api` - Mandatory, boolean - Whether this account should be allowed to request
	  an API authentication token

### Permissions required
* The current user can `GET` and `PUT` their own user account
* But otherwise user administration permission is required

### Returns
A list of user objects (for the list users URL), or a single user object (for all other URLs).

### Examples

	$ curl -u <token>:unused 'https://images.example.com/api/v1/admin/users/'
	{
	  "data": [
	    {
	      "allow_api": false,
	      "auth_type": 1,
	      "email": "",
	      "first_name": "Administrator",
	      "id": 1,
	      "last_name": "",
	      "status": 1,
	      "username": "admin"
	    },
	    {
	      "allow_api": true,
	      "auth_type": 1,
	      "email": "",
	      "first_name": "Matt",
	      "id": 2,
	      "last_name": "Fozard",
	      "status": 1,
	      "username": "matt"
	    }
	  ],
	  "message": "OK",
	  "status": 200
	}

	$ curl -u <token>:unused 'https://images.example.com/api/v1/admin/users/2/'
	{
	  "data": {
	    "allow_api": true,
	    "auth_type": 1,
	    "email": "",
	    "first_name": "Matt",
	    "id": 2,
	    "last_name": "Fozard",
	    "status": 1,
	    "username": "matt"
	  },
	  "message": "OK",
	  "status": 200
	}

	$ curl -X PUT -u <token>:unused -F 'first_name=Matthew' -F 'last_name=Fozard' -F 'username=mattfoo' -F 'email=matt@quru.com' -F 'auth_type=1' -F 'allow_api=true' 'https://images.example.com/api/v1/admin/users/2/'
	{
	  "data": {
	    "allow_api": true,
	    "auth_type": 1,
	    "email": "matt@quru.com",
	    "first_name": "Matthew",
	    "id": 2,
	    "last_name": "Fozard",
	    "status": 1,
	    "username": "mattfoo"
	  },
	  "message": "OK",
	  "status": 200
	}

<a name="api_data_groups"></a>
## groups
Lists all user groups, or gets, creates, updates, or deletes a single group.
Groups are used to define the system-wide access permissions for logged in users.
The special system group _Public_ defines access permissions for anonymous (not logged in) users.
You can use the [folder permissions](#api_data_permissions) API to define folder-level access
controls.

### URL
* `/api/v1/admin/groups/` for `GET` (list groups) and `POST`
* `/api/v1/admin/groups/[group id]/` for `GET`, `PUT`, and `DELETE`

### Supported methods
* `GET`
* `POST`
* `PUT`
* `DELETE`

### Parameters
* None for `GET` or `DELETE`
* For `POST` and `PUT`:
	* `name` - Mandatory, text - the name of the group
	* `description` - Mandatory, text - a description of the group
	* `group_type` - Mandatory, integer - set to `1` for required system groups that must not
	  be deleted, set to `2` for normal, user-defined groups
	* `access_folios` - Mandatory, boolean - Currently unused
	* `access_reports` - Mandatory, boolean - Whether the group provides access to reports
	* `access_admin_users` - Mandatory, boolean - Whether the group provides user administration
	  permission (and basic group administration)
	* `access_admin_files` - Mandatory, boolean - Whether the group provides file administration
	  permission (change and delete any file or folder, regardless of folder permissions)
	* `access_admin_folios` - Mandatory, boolean - Currently unused
	* `access_admin_permissions` - Mandatory, boolean - Whether the group provides permissions
	  administration (and full group administration)
	* `access_admin_all` - Mandatory, boolean - Whether the group provides _super user_
	  permission (full access to everything)

### Permissions required
* User administration permission is required for `GET`, or to `PUT` an updated group name or
  description
* Permissions administration permission is additionally required for `POST` or `DELETE`, or
  to `PUT` updated permissions flags for a group

### Returns
A list of group objects (for the list groups URL), a single group object (for most other URLs),
or nothing (after a delete).

### Examples

	$ curl -u <token>:unused 'https://images.example.com/api/v1/admin/groups/'
	{
	  "data": [
	    {
	      "description": "Provides full administration access",
	      "group_type": 1,
	      "id": 3,
	      "name": "Administrators",
	      "permissions": {
	        "admin_all": true,
	        "admin_files": true,
	        "admin_folios": false,
	        "admin_permissions": true,
	        "admin_users": true,
	        "folios": false,
	        "group_id": 3,
	        "reports": true
	      }
	    },
	    {
	      "description": "Provides the default access rights for known users",
	      "group_type": 1,
	      "id": 2,
	      "name": "Normal users",
	      "permissions": {
	        "admin_all": false,
	        "admin_files": false,
	        "admin_folios": false,
	        "admin_permissions": false,
	        "admin_users": false,
	        "folios": false,
	        "group_id": 2,
	        "reports": false
	      }
	    },
	    {
	      "description": "Provides the access rights for unknown users",
	      "group_type": 1,
	      "id": 1,
	      "name": "Public",
	      "permissions": {
	        "admin_all": false,
	        "admin_files": false,
	        "admin_folios": false,
	        "admin_permissions": false,
	        "admin_users": false,
	        "folios": false,
	        "group_id": 1,
	        "reports": false
	      }
	    }
	  ],
	  "message": "OK",
	  "status": 200
	}

	$ curl -X POST -u <token>:unused -F 'name=Website editors' -F 'description=Access to reports and to change any file or folder' -F 'group_type=2' -F 'access_folios=false' -F 'access_reports=true' -F 'access_admin_users=false' -F 'access_admin_files=true' -F 'access_admin_folios=false' -F 'access_admin_permissions=false' -F 'access_admin_all=false' 'https://images.example.com/api/v1/admin/groups/'
	{
	  "data": {
	    "description": "Access to reports and to change any file or folder",
	    "group_type": 2,
	    "id": 7,
	    "name": "Website editors",
	    "permissions": {
	      "admin_all": false,
	      "admin_files": true,
	      "admin_folios": false,
	      "admin_permissions": false,
	      "admin_users": false,
	      "folios": false,
	      "group_id": 7,
	      "reports": true
	    },
	    "users": []
	  },
	  "message": "OK",
	  "status": 200
	}
	
	$ curl -X DELETE -u <token>:unused 'https://images.example.com/api/v1/admin/groups/7/'
	{
	  "data": null,
	  "message": "OK",
	  "status": 200
	}

<a name="api_data_usergroups"></a>
## group membership
Adds a user to a group or removes a user from a group. Use the [groups](#api_data_groups) API
to list the members of a group.

### URL
* `/api/v1/admin/groups/[group id]/members/` for `POST`
* `/api/v1/admin/groups/[group id]/members/[user id]/` for `DELETE`

### Supported methods
* `POST`
* `DELETE`

### Parameters
* None for `DELETE`
* For `POST`:
	* `user_id` - Mandatory, integer - The ID of the user to add to the group

### Permissions required
* User administration permission is required as a minimum
* Permissions administration permission is additionally required to add a user to a group
  that itself grants permissions administration or _super user_

### Returns
No return value.

### Example

	$ curl -u <token>:unused 'https://images.example.com/api/v1/admin/groups/4/'
	{
	  "data": {
	    "description": "Those that are editing the web pages and managing the /web directory of this instance",
	    "group_type": 2,
	    "id": 4,
	    "name": "Web editors",
	    "permissions": {
	      "admin_all": false,
	      "admin_files": false,
	      "admin_folios": false,
	      "admin_permissions": false,
	      "admin_users": false,
	      "folios": true,
	      "group_id": 4,
	      "reports": true
	    },
	    "users": [
	      {
	        "allow_api": false,
	        "auth_type": 1,
	        "email": "jc@quru.com",
	        "first_name": "JC",
	        "id": 3,
	        "last_name": "",
	        "status": 1,
	        "username": "jc"
	      },
	      {
	        "allow_api": false,
	        "auth_type": 1,
	        "email": "",
	        "first_name": "Jenny",
	        "id": 2,
	        "last_name": "Darcs",
	        "status": 1,
	        "username": "jenny"
	      }
	    ]
	  },
	  "message": "OK",
	  "status": 200
	}
	
	$ curl -X DELETE -u <token>:unused 'https://images.example.com/api/v1/admin/groups/4/members/2/'
	{
	  "data": null,
	  "message": "OK",
	  "status": 200
	}
	
	$ curl -u <token>:unused 'https://images.example.com/api/v1/admin/groups/4/'
	{
	  "data": {
	    "description": "Those that are editing the web pages and managing the /web directory of this instance",
	    "group_type": 2,
	    "id": 4,
	    "name": "Web editors",
	    "permissions": {
	      "admin_all": false,
	      "admin_files": false,
	      "admin_folios": false,
	      "admin_permissions": false,
	      "admin_users": false,
	      "folios": true,
	      "group_id": 4,
	      "reports": true
	    },
	    "users": [
	      {
	        "allow_api": false,
	        "auth_type": 1,
	        "email": "jc@quru.com",
	        "first_name": "JC",
	        "id": 3,
	        "last_name": "",
	        "status": 1,
	        "username": "jc"
	      }
	    ]
	  },
	  "message": "OK",
	  "status": 200
	}

<a name="api_data_permissions"></a>
## folder permissions
Lists all defined folder permissions, or gets, creates, updates, or deletes a single
permission for a particular folder and group.

Folder permissions are hierarchical, meaning that if you set a permission for `/myfolder`, that
rule will be inherited by `/myfolder/subfolder1`, `/myfolder/subfolder2`, and so on. Similarly,
the permission you define for the root folder `/` acts as the default permission for all other
folders.

The permission record for the root folder `/` and the _Public_ group determines whether your
images default to being publicly visible or not.

### URL
* `/api/v1/admin/permissions/` for `GET` (list permissions) and `POST`
* `/api/v1/admin/permissions/[permission id]/` for `GET`, `PUT`, and `DELETE`

### Supported methods
* `GET`
* `POST`
* `PUT`
* `DELETE`

### Parameters
* None for `GET` or `DELETE`
* For `POST` and `PUT`:
	* `group_id` - Mandatory, integer - the ID of the group to set a folder permission for
	* `folder_id` - Mandatory, integer - the ID of the folder to set a permission for
	* `access` - Mandatory, integer - the permission level to set:
		* `0` - No access
		* `10` - View images
		* `20` - View and download images
		* `30` - Edit image metadata (plus the above)
		* `40` - Upload files to the folder (plus the above)
		* `50` - Delete files from the folder (plus the above)
		* `60` - Create new sub-folders (plus the above)
		* `70` - Delete the entire folder (plus the above)

Note that `group_id` and `folder_id` are not changed during a `PUT` operation.

### Permissions required
* Permissions administration

### Returns
A list of folder permission objects (for the list URL), a single folder permission object
(for most other URLs), or nothing (after a delete).

### Examples

	$ curl -u <token>:unused 'https://images.example.com/api/v1/admin/permissions/'
	{
	  "data": [
	    {
	      "access": 70,
	      "folder_id": 1,
	      "group_id": 3,
	      "id": 3
	    },
	    {
	      "access": 20,
	      "folder_id": 1,
	      "group_id": 1,
	      "id": 1
	    },
	    {
	      "access": 20,
	      "folder_id": 1,
	      "group_id": 2,
	      "id": 2
	    }
	  ],
	  "message": "OK",
	  "status": 200
	}

Allow any logged in user to upload images by default:

	$ curl -X PUT -u <token>:unused -F 'group_id=2' -F 'folder_id=1' -F 'access=40' 'https://images.example.com/api/v1/admin/permissions/2/'
	{
	  "data": {
	    "access": 40,
	    "folder_id": 1,
	    "group_id": 2,
	    "id": 2
	  },
	  "message": "OK",
	  "status": 200
	}

<a name="api_disk_files"></a>
## disk files
Moves, renames, or deletes an image file on disk, and updates the associated metadata and
audit trail. Use the [upload](#api_upload) API to create a new file.

### URL
* `/api/v1/admin/filesystem/images/[image id]/`

### Supported methods
* `PUT`
* `DELETE`

### Parameters
* None for `DELETE`
* For `PUT`:
	* `path` - Mandatory, text - the new path and filename for the image file. If the folder
	  path changes, the file will be moved. If only the filename changes, the file will be
	  renamed.

### Permissions required
* Either file administration permission or
* For `PUT` when renaming, upload permission for the folder that contains the image
* For `PUT` when moving, delete permission for the folder that currently contains the
  image, and upload permission for the destination folder
* For `DELETE`, delete file permission for the folder that contains the image

### Returns
The image's updated database object.

### Example

	$ curl -u <token>:unused 'https://images.example.com/api/v1/admin/images/524/'
	{
	  "data": {
	    "description": "the description of my sample image",
	    "folder": {
	      "id": 3,
	      "name": "/test_images",
	      "parent_id": 1,
	      "path": "/test_images",
	      "status": 1
	    },
	    "folder_id": 3,
	    "height": 1200,
	    "id": 524,
	    "src": "test_images/Image0007.jpg",
	    "status": 1,
	    "title": "my sample image",
	    "width": 1600
	  },
	  "message": "OK",
	  "status": 200
	}

To move this image to the `web` folder:

	$ curl -X PUT -u <token>:unused -F 'path=/web/Image0007.jpg' 'https://images.example.com/api/v1/admin/filesystem/images/524/'
	{
	  "data": {
	    "description": "the description of my sample image",
	    "folder": {
	      "id": 6,
	      "name": "/web",
	      "parent_id": 1,
	      "path": "/web",
	      "status": 1
	    },
	    "folder_id": 6,
	    "height": 1200,
	    "id": 524,
	    "src": "web/Image0007.jpg",
	    "status": 1,
	    "title": "my sample image",
	    "width": 1600
	  },
	  "message": "OK",
	  "status": 200
	}

<a name="api_disk_folders"></a>
## disk folders
Creates, moves, renames, or deletes a disk folder, and updates the associated metadata.

Moving, renaming or deleting a folder is a recursive operation that also affects all the
sub-folders and files it contains, and can therefore take a long time. In the same way note
that if you rename a folder, this changes the paths of all the images contained within.

### URL
* `/api/v1/admin/filesystem/folders/` for `POST`
* `/api/v1/admin/filesystem/folders/[folder id]/` for `PUT` and `DELETE`

### Supported methods
* `POST`
* `PUT`
* `DELETE`

### Parameters
* None for `DELETE`
* For `POST` and `PUT`:
	* `path` - Mandatory, text - the new path for the disk folder. If the parent part of the
	  folder path changes, the folder will be moved. If only the folder's own name changes,
	  the folder will be renamed.

### Permissions required
* Either file administration permission or
* For `POST`, create sub-folder permission for the nearest existing parent folder
* For `PUT` when renaming, create sub-folder permission for the parent folder
* For `PUT` when moving, full delete permission for the current parent folder,
  and create sub-folder permission for the destination parent folder
* For `DELETE`, full delete permission for the parent folder

### Returns
For `POST`, returns the new folder's database object.

For `PUT` and `DELETE`, if the function completes in less than 30 seconds, returns the
folder's updated database object. If however the function is ongoing after 30 seconds, returns
status `202` and a task object that you can track using the [system tasks](#api_tasks) API.

### Example

	$ curl -u <token>:unused -F 'path=/test_images/mynewfolder/' 'https://images.example.com/api/v1/admin/filesystem/folders/'
	{
	  "data": {
	    "id": 63,
	    "name": "/test_images/mynewfolder",
	    "parent": {
	      "id": 3,
	      "name": "/test_images",
	      "parent_id": 1,
	      "path": "/test_images",
	      "status": 1
	    },
	    "parent_id": 3,
	    "path": "/test_images/mynewfolder",
	    "status": 1
	  },
	  "message": "OK",
	  "status": 200
	}

	$ curl -X PUT -u <token>:unused -F 'path=/renamed-large-folder' 'https://images.example.com/api/v1/admin/filesystem/folders/23/'
	{
	  "data": {
	    "error_log_level": "error",
	    "funcname": "move_folder",
	    "id": 288,
	    "keep_for": 10,
	    "keep_until": null,
	    "lock_id": "6008_1",
	    "log_level": "info",
	    "name": "Move disk folder ID 23",
	    "params": {
	      "folder_id": 23,
	      "path": "/renamed-large-folder"
	    },
	    "priority": 10,
	    "result": null,
	    "status": 1,
	    "user": {
	      "allow_api": true,
	      "auth_type": 1,
	      "email": "matt@quru.com",
	      "first_name": "Matt",
	      "id": 2,
	      "last_name": "Fozard",
	      "status": 1,
	      "username": "matt"
	    },
	    "user_id": 2
	  },
	  "message": "OK task accepted",
	  "status": 202
	}

<a name="api_tasks"></a>
## system tasks
Initiates or polls the status of an ongoing system task.

### URL
* `/api/v1/admin/tasks/[function name]/` for `POST`
* `/api/v1/admin/tasks/[task id]/` for `GET`

### Supported methods
* `GET`
* `POST`

### Parameters
* None for `GET`
* Parameters for `POST` are specific to the task function:
	* Function `purge_system_stats` - physically deletes system-level statistics older than
	  a given date
		* `before_time` - Mandatory, text - Date in format 'yyyy-mm-dd' beyond which the
		  system statistics should be purged
	* Function `purge_image_stats` - physically deletes image-level statistics older than
	  a given date
		* `before_time` - Mandatory, text - Date in format 'yyyy-mm-dd' beyond which the
		  image statistics should be purged
	* Function `purge_deleted_folder_data` - physically deletes image and folder data that
	  are only marked as _deleted_ (this includes archived image audit trails)
		* `path` - Mandatory, text - The folder path in which to purge (recursively) the
		  _deleted_ database records. Specify the root folder `/` to purge everything.

### Permissions required
* Super user

### Returns
The task object, including its status.

The following task status values exist:

* `0` - New, awaiting processing
* `1` - In progress
* `2` - Complete, with the (task dependent) return value inside the `result` attribute

Once complete, a task will remain in the database so that a duplicate task cannot run again
for `keep_for` seconds (until `keep_until` time UTC is reached).
If `keep_for` is `0` (and `keep_until` is `null`), the task will be deleted within a few seconds,
after which a status `404` will be returned when that task is requested.

### Example

	$ curl -u <token>:unused 'https://images.example.com/api/v1/admin/tasks/301/'
	{
	  "data": {
	    "error_log_level": "error",
	    "funcname": "purge_deleted_folder_data",
	    "id": 301,
	    "keep_for": 0,
	    "keep_until": null,
	    "lock_id": null,
	    "log_level": "info",
	    "name": "Purge deleted data",
	    "params": {
	      "folder_id": 2
	    },
	    "priority": 20,
	    "result": null,
	    "status": 2,
	    "user": {
	      "allow_api": true,
	      "auth_type": 1,
	      "email": "matt@quru.com",
	      "first_name": "Matt",
	      "id": 2,
	      "last_name": "Fozard",
	      "status": 1,
	      "username": "matt"
	    },
	    "user_id": 2
	  },
	  "message": "OK",
	  "status": 200
	}

Then after a few seconds:

	$ curl -u <token>:unused 'https://images.example.com/api/v1/admin/tasks/301/'
	{
	  "data": null,
	  "message": "The requested item was not found (301)",
	  "status": 404
	}
