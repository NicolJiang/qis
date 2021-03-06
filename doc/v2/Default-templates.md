QIS v2 Replace default image settings with default templates, add image security
================================================================================

Current status: phase 1 complete, phases 2 and 3 deferred

This change follows the move of image templates from being flat text files to
being entities in the database. It starts with a simple observation:

* We should replace these individual system settings: `IMAGE_FORMAT_DEFAULT,
  IMAGE_QUALITY_DEFAULT, IMAGE_COLORSPACE_DEFAULT, IMAGE_DPI_DEFAULT,
  IMAGE_STRIP_DEFAULT, IMAGE_EXPIRY_TIME_DEFAULT` with a single "system default"
  image template instead.
* This simplifies the system settings, allows any of the image parameters to have
  a default value (instead of just those few), and allows the defaults to be changed
  within the admin interface and without requiring a system re-start.

This is a neat improvement to the system architecture, but delivers little new
functionality. Enter perhaps the biggest problem remaining from QIS v1, that any
user can change an image URL to serve the image at any size, change or remove an
overlay, etc. With a default template as described above, we can introduce a new
image security feature by adding new flags to the template that specify whether
each parameter is allowed to be overridden.

So change the template JSON from:

	{
	  "width": 500,
	  "overlay": "/path/to/logo.jpg"
	}

to:

	{
	  "width": {
		"value": 500,
		"override": "lte",
		"override_limit": 1000
	  },
	  "overlay": {
	    "value": "/path/to/logo.jpg",
	    "override": "no"
	  }
	}

And in the future we will be able to add further enhancements such as:

	{
	  "width": {
		"value": 500,
		"override": "lte",
		"override_limit": 1000,
		"user_notes": "All thumbnails are < 1000, don't serve anything larger"
	  },
	  "overlay": {
	    "value": "/path/to/logo.jpg",
	    "override": "no",
		"user_notes": "Force the logo as a watermark",
		"some_future_feature": true
	  }
	}

The `override` flag can have values: `yes | no | lte | gte`. The latter values
mean "less than or equal" and "greater than or equal", to be used for numerical
fields alongside an override limit.

Image security is not required on all fields, but is relevant to these:

* `width` and `height` - to prevent the serving of full size images
* `page` - for e.g. PDF or multi-page TIFF files, allow access only to the cover page
* `overlay` (all) - to prevent tampering when the overlay is used as a watermark
* `strip` - to prevent the removal of EXIF data (which might contain a copyright notice, etc)

The cropping fields have also been considered, but excluded from this change, because:

* Cropping is usually applied per-image rather than in bulk with a template
* Cropping occurs after `flip` and `rotate`, meaning these parameters would also
  have to be secured for a locked-down cropping area to make any sense
* Cropping is intended to be used for art direction, not redaction
* Different sizes of the same image often have different cropping requirements

However, having the ability to restrict the width and height of an image using a
default template means we can delete 2 further system settings:

* `PUBLIC_MAX_IMAGE_WIDTH, PUBLIC_MAX_IMAGE_HEIGHT`
* These had a very narrow use-case, and the functionality is duplicated and
  better replaced by the more generic mechanism being described here

User-defined (named) templates
==============================
So far this document has described the addition of a system default template,
together with new flags to define what is allowed to be changed. For existing
user-defined templates we should also add these new override controls. This
will be required to support a common scenario:

* `/image?src=myimage.jpg` - no template specified - system uses the new
  default template, which adds a watermark along with override flag `no`
* `/image?src=myimage.jpg&overlay=` - blocked - this request attempts to
  change or remove the watermark, which will not be allowed

* `/image?src=myimage.jpg&tmp=thumbnail` - returns a small copy of the image,
  without a watermark, but with override flags `no` for width and height
* `/image?src=myimage.jpg&tmp=thumbnail&width=5000` - blocked - this request
  attempts to return a large copy of the image without a watermarked, which
  will not be allowed

For this to work, the override rules in the user-defined template `thumbnail` must
**replace** those in the default template, otherwise it would not be possible to
produce the thumbnail image without a watermark.

Having a named template replace the default template has the further advantage
that it is easier to understand and administer, avoiding the scenario that would
otherwise occur of having to merge together multiple levels of parameters and
override rules.

Changes to system behaviour
===========================
As a consequence of these changes, templates will become much more prominent in
QIS v2 than they were in v1. In v1, templates were entirely optional. In v2, an
image request will always "pass through" a template - if not a named template
then the default template.

There will also be a change in the behaviour of how final image parameters are
calculated. In QIS v1 there were up to 3 levels that determined the final value
of a parameter such as `dpi`:

1) From an image URL parameter (`...&dpi=300`)  
2) From a named template (`...&tmp=print`)  
3) From a `DEFAULT` system setting (`IMAGE_DPI_DEFAULT = 300`)  

In QIS v2 there will only be 2 levels:

1) From an image URL parameter  
2) From a named template or - if none is specified - from the default template  

And level (1) may be disallowed, depending on the override flags in the template.

When a URL parameter is disallowed, QIS will return an HTTP error 400 "bad
parameter" response along with an error message describing which parameter was
rejected and by which template. The alternative approach of silently ignoring the
disallowed parameter would result in a public API that is not consistent in its
responses, and could therefore lead to undetected problems.

This change to reject URL parameters for width, height and strip (depending on
templates) has the potential to cause runtime errors in these public-facing
utilities:

* Image zoomer - strips and requests full width and height
* Gallery - creates thumbnails with strip
* Slideshow - requests variable width and height
* Benchmark script - requests variable width and height

and these areas of the QIS admin interface:

* Image previews - upload complete, details page, folder list
* Image publisher - preview image, also the potential to generate broken URLs

Users of the public-facing utilities will have to ensure either that their default
template allows the full range of parameters required, or that they create a
named template to exempt the function from the default rules. For example adding
`...&tmp=zoomable` to images that can be zoomed, where the `zoomable` template
might allow any width and height but also add a watermark to a corner of the image.

We can prevent the public-facing default template rules from affecting the admin
interface by having 2 default templates initially - one for public requests and
one for logged-in requests. The default template for logged-in requests can then
be configured separately to be less restrictive.

Phase 1
=======
Replace the system settings for `IMAGE_*_DEFAULT` with a single global default
template. When first created, this will have the same initial values as the old
settings it replaces. There will be no field override controls in phase 1.

Adjust the image generation logic to look at the 2 levels of "URL else template"
instead of the previous 3. Add default template administration to the admin UI.
Update the user guide to show default template values instead of the old system
setting values, and to reflect the changes in image generation logic.

This fulfils the basic original brief discussed at the top of this document.

Code changes - Phase 1

* v1 to v2 template import routine - change to new JSON format
* Initial template data - change to new JSON format,
  add 1 new pre-defined template to act as the system default
* Template admin API - change to new JSON format
* Delete the old system settings and migrate all occurrences
  (in the documentation too)
* Add an admin function to choose the default template
  * Any named template can be chosen as the default, they don't need to be fixed
* Do not allow deletion of templates that are in use as a default template
* Template manager - add new method to return the default template from cache
* Image manager - change the image generation logic to pull in the default
  template when required, and no longer use the old system settings
* Image manager - ensure that the image caching still works correctly after a
  default template has been changed (i.e. the image caching must still work
  independently of templates and template content)
* Image publisher - auto-select the system default template if no other template
  is selected, replace "system default value" helper text with the values from the
  default/selected template
* Image API help page - list the defaults from the default templates instead of the
  old system settings, describe new behaviour of getting either the specified template
  or the default template, describe new behaviour of how the final image parameters
  are determined.
* Benchmark (running) - ensure performance has remained the same or better
* Upgrade all affected unit tests

Phase 2
=======
Extend the above to have 2 global default templates:

* Public default template
* Logged-in default template

And implement the field-level override rules as discussed above. Remove the
`PUBLIC_MAX_x` settings. This now allows public images to be "locked down" by
default while registered users can (if the logged-in default template allows)
have more freedom of access.

In phase 2 all user-defined templates will remain accessible to all users.
This will not be ideal in some situations. For example, one use case may call for
a template that allows large images to be downloaded without a watermark. It would
be preferable then if this template is only available to certain users, such as
only to system administrators. This would require new access controls around the
template list, additional work that will be covered in phase 3.

Code changes - Phase 2

* Initial template data - add a new pre-defined template for the logged-in
  default template
* Template admin API - get and set the override flags, add override flags into API
  unit tests, update the API documentation
* TemplateAttrs - add a piggy-back dict to hold per-field extras
  (just the override rules for now)
  * TODO consider other options, this doesn't feel very neat
* ImageAttrs / TemplateAttrs - apply the named or default template based on new
  rules and override flags. Raise an error if an ImageAttrs field has been
  overridden in violation of the template override rules.
* Delete the 2x weird functions that used to enforce the `PUBLIC_MAX` settings
* Adjust the admin UI for having 2 default templates
* Template admin page - add the override controls to the fields that offer security
* Template manager - adjust the default template getter to return the appropriate
  one (public or logged in) for the current request
* Image publisher - indicate which fields cannot be overridden
* Image API help page - remove or clarify the section about public limits,
  document the logged-in default template, document the new field override limits
* TODO Possibly - upgrade the public JS utilities to detect / handle their
  own added URL parameters breaking the override rules
* Benchmark - upgrade as necessary, or perhaps disable the override flag checking
  when `BENCHMARKING` is true
* Benchmark (running) - ensure performance has remained the same or better
* Upgrade all affected unit tests
* Add new tests to validate the correctness of the override controls


Phase 3
=======
So far so good then. But phases 1-2 do not deliver a great deal of flexibility;
you probably want to protect some images differently from others. Even for the
same image it is reasonable to want the ability to serve a plain small thumbnail
while enforcing a watermark on large versions of it.

TODO all the rest below is still open for discussion / subject to change

TODO Main topics:  
- Having default templates at different folder levels (instead of root)  
- Having different default templates for different groups (and different folders?)  
- Restricting access to all templates  

QIS already has a mechanism for defining access rules by user group and
folder - the folder permissions. Since this is where we define whether a user
(in reality a group) can view an image, it seems reasonable to define the image
field security in the same place. Then when the folder permissions say that `view`
access to an image is permitted, the new field security can extend that to say how
it can be viewed. Yes you can view the image but only a small version, or yes
you can view the image in its entirety, for example. To achieve this we need only
add one new field to the `FolderPermissions` table, so that it becomes:

* `id`
* `folder_id` - Mandatory link to folder
* `group_id` - Mandatory link to group
* `access` - Mandatory access level
* New field `default_template_id` - Optional link to default image template

This provides the ability to assign a default image template to a group and
folder combination. The new field will be optional, and blank by default.

QIS will ship with a default template for the `public` group and `root` folder,
to act as the global "system default" template. Installations that do not require
fine-grained view control will not need to define anything new beyond the standard
folder permissions.


More thoughts

	[14/10/2015 10:16:56] Matt Fozard: Our proposal from yesterday really screws up the image publisher.  The person logged in might not be allowed to set some of the image parameters.  Then if they can, the published image might look totally different to the public and/or different groups.  You need the preview image to be a "view as [select group]" function.
	[14/10/2015 10:19:58] Matt Fozard: Perhaps it comes down to having a "Publish for [select group || public]" bit at the top.
	That would establish the correct default template.
	[14/10/2015 10:20:29] Matt Fozard: Then the publisher just allows access to everything, and if the template doesn't allow override then it just has no effect.
	[14/10/2015 10:22:16] Roland Whitehead: OK, I like the "publish for" menu on the top of the publish screen. It should default to "Public"
	[14/10/2015 10:23:17] Roland Whitehead: But chosing the group should then add in a line : "This group's access to this image is limited by template <templatename>" with a link to that template (assuming that they can actually edit the templates...)
	[14/10/2015 10:28:01] Matt Fozard: That would be OK. At the moment anyone with an admin function can view the templates, but only super user can edit them.
	[14/10/2015 10:34:49] Matt Fozard: Next question. If you have "download original" permission to an image, do you think we should ignore the override flags on the default template? There doesn't seem much point restricting access to things when you can get the full image anyway.
	[14/10/2015 10:35:52] Matt Fozard: This would also solve the problem of permissions in the publisher.  You need download permission to use the publisher.  If you had it, you would then be able to preview the effect of all the parameters without you yourself being blocked.
	[14/10/2015 10:36:49] Roland Whitehead: If you have download permission then the /original or /details commands ignore any templates... However, /image should still stick to the template rules...
	[14/10/2015 10:37:13] Roland Whitehead: Sounds sensible that you need the download permission to use the publisher.
	[14/10/2015 10:37:42] Roland Whitehead: If you have upload permission, do you also automatically have the download permission? Could we have a situation where someone can upload an image but not download it?
	[14/10/2015 10:39:21] Matt Fozard: Currently, upload permission includes download permission. So if you can upload you would always be able to download.
	[14/10/2015 10:41:59] Roland Whitehead: So yes, the publish option should only be available for people with download...

Terminology

To avoid ambiguity and confusion, the system requires the use of some standard
terminology to describe these new concepts. Proposed are:

* TODO
* Default template?  Image field security?  

Code changes - Phase 3

* TODO Move default template getter from template manager into permissions manager?
  This would (possibly) make sense if it is also based on folder + group
* TODO permissions manager - alter the default template function to take
  into account folder and group
  * TODO This isn't nice for users with multiple groups
    * Roland suggested ranking the groups and taking just the highest ranking group
      for the current folder (or nearest parent with a default folder defined)
    * Group ranking would need a new db field and admin UI
    * Should group ranking then be used for folder permissions?
      Currently we use the most permissive of all the groups.
      This would be a breaking change.
    * --> Not keen on group ranking

Documentation

* Write a new guide to setting up the permissions - folder permissions,
  default templates, and template field override flags
  * Scenario - all images public by default, require login to download or more
  * Scenario - all images private by default, selective view, selective downloads
  * Scenario - watermark all the images in a folder
  * Scenario - watermark images > 1000px, max size < 2000px
  * How to define rules that work with the zoomer / carousel / etc
