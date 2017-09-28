/*!
    Document:      common_view.js
    Date started:  12 September 2017
    By:            Matt Fozard
    Purpose:       Quru Image Server viewer utilities and common routines
    Requires:
    Copyright:     Quru Ltd (www.quru.com)
    Licence:

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published
    by the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see http://www.gnu.org/licenses/
*/
/*
    Notable modifications:
    Date       By    Details
    =========  ====  ============================================================
    Sept 2017  Matt  Created for #2174 Removal of MooTools
*/

if (!window.QU) {

    // Define the QIS Utility library (QU)
    QU = {
        version: 1,
        // TL;DR - this supports IE9 and later
        supported: ([].forEach !== undefined) &&
                   ([].indexOf !== undefined) &&
                   (Object.keys !== undefined) &&
                   (window.addEventListener !== undefined) &&
                   ((function(){}).bind !== undefined) &&
                   (window.getComputedStyle !== undefined) &&
                   (window.JSON !== undefined)
    };

    // Returns an element by its ID, or null if there is no matching element.
    // Returns id unchanged if it appears to already be an element, so that you
    // can use this function in situations where you might have either an element
    // or its string ID.
    QU.id = function(id) {
        if (typeof id === 'number') {
            id = ''+id;
        }
        if (typeof id === 'string') {
            return document.getElementById(id);  // Normal
        }
        if (typeof id === 'object') {
            return id;  // Assume id is already a DOMElement
        }
        return null;
    };

    // Clears the inner content from an element
    QU.elClear = function(el) {
        el = QU.id(el);
        while (el.firstChild) {  // much faster than just setting innerHTML=''
            el.removeChild(el.firstChild);
        }
    };

    // Removes an element from the DOM and returns it.
    // The element will not be garbage collected while any references to it
    // or its children (including any event handlers) remain.
    QU.elRemove = function(el) {
        if (el.parentNode)
            el.parentNode.removeChild(el);
        return el;
    }

    // Returns the {x:n, y:n} position of an element on the page
    QU.elPosition = function(el) {
        el = QU.id(el);
        // From https://www.quirksmode.org/js/findpos.html
        var l = 0, t = 0;
        if (el.offsetParent) {
            do {
                l += el.offsetLeft;
                t += el.offsetTop;
            } while (el = el.offsetParent);
        }
        return {x: l, y: t};
    };

    // Returns the {width:n, height:n} rendered inner size of an element,
    // either including or excluding the inner padding, where n may be a float.
    // This value does not include the size of borders, margins, scroll bars,
    // or changes in size due to CSS transformations (e.g. rotation).
    QU.elInnerSize = function(el, includePadding) {
        el = QU.id(el);
        // https://developer.mozilla.org/en-US/docs/Web/API/CSS_Object_Model/Determining_the_dimensions_of_elements
        var isize = {width: el.clientWidth, height: el.clientHeight};
        if (!includePadding) {
            var cs = window.getComputedStyle(el);
            isize.width -= (parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight));
            isize.height -= (parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom));
            isize.width = Math.max(isize.width, 0);
            isize.height = Math.max(isize.height, 0);
        }
        return isize;
    };

    // Adds (when add is true) or removes (when add is false) a CSS class on an element.
    QU.elSetClass = function(el, className, add) {
        el = QU.id(el);
        if (el.classList) {
            if (add) el.classList.add(className);
            else el.classList.remove(className);
        } else {
            // IE9
            var classes = el.className.split(' '),
                idx = classes.indexOf(className);
            if (classes.length === 1 && classes[0] === '')
                classes.length = 0;
            if (add && (idx === -1))
                classes.push(className);
            else if (!add && (idx !== -1))
                classes.splice(idx, 1);
            el.className = classes.join(' ');
        }
    }

    // Creates and returns a new XMLHttpRequest (or equivalent) suitable for making
    // a cross-domain request for JSON data. Returns null if there is no XHR support
    // (though this is not expected when QU.supported is true).
    // Optional callback successFn should be function(xhr, jsonObj) where xhr is the
    // object returned by this function and jsonObj is the decoded and parsed JSON
    // payload. Optional callback errorFn should be function(xhr, msg) where msg is
    // the returned error text or message.
    // To invoke the request, call xhr.send() or xhr.send(body) on the returned object.
    QU.jsonRequest = function(url, method, successFn, errorFn) {
        var xhr = new XMLHttpRequest();
        if ('withCredentials' in xhr) {
            // Modern browsers
            xhr.open(method, url, true);
            xhr.setRequestHeader('Accept', 'application/json');
        } else if (typeof XDomainRequest !== 'undefined') {
            // IE 9
            xhr = new XDomainRequest();
            xhr._XDR = true;
            xhr.onprogress = function(){}; // Prevent IE aborting requests
            xhr.ontimeout = function(){};  // see http://perrymitchell.net/article/xdomainrequest-cors-ie9/
            xhr.open(method, url);
        } else {
            // Unsupported browser
            return null;
        }
        xhr.onload = function() {
            if (!xhr._XDR && (xhr.status < 200 || xhr.status >= 400)) {
                if (errorFn) { errorFn(xhr, xhr.responseText); }
                return;
            }
            if (successFn) {
                var jsonObj;
                try { jsonObj = JSON.parse(xhr.responseText); }
                catch (e) {
                    if (errorFn) { errorFn(xhr, 'Invalid JSON: ' + e); }
                    return;
                }
                successFn(xhr, jsonObj);
            }
        };
        xhr.onerror = function() {
            if (errorFn) {
                errorFn(xhr, xhr.responseText);
            }
        };
        return xhr;
    };
    
    // Returns the position of a mouse or touch event on the page and in the viewport
    // (ignoring scroll position) as {'page': {x:n, y:n}, 'viewport': {x:n, y:n}}
    QU.evPosition = function (event) {
        var page = {x:0, y:0}, viewport = {x:0, y:0};
        if (event.type.indexOf('touch') == 0 || event.type.indexOf('gesture') == 0) {
            if (event.touches && event.touches[0]) {
                var touch = event.touches[0];
                page.x = touch.pageX;
                page.y = touch.pageY;
                viewport.x = touch.clientX;
                viewport.y = touch.clientY;
            }
        } else {
            var doc = document.documentElement || document.body;
            page.x = (event.pageX != null) ? event.pageX : event.clientX + doc.scrollLeft;
            page.y = (event.pageY != null) ? event.pageY : event.clientY + doc.scrollTop;
            viewport.x = (event.pageX != null) ? event.pageX - window.pageXOffset : event.clientX;
            viewport.y = (event.pageY != null) ? event.pageY - window.pageYOffset : event.clientY;
        }
        return {'page': page, 'viewport': viewport};
    };

    // Converts a JavaScript object into a URI-encoded string
    // e.g. {key: 'v1', key2: 'v2$'} --> "key=v1&key2=v2%24"
    // base is an optional parent key to nest the object keys into
    QU.ObjectToQueryString = function(object, base) {
        // This implementation is based on the function in MooTools Core
        var queryString = [];
        var keys = Object.keys(object);
        keys.forEach(function(key) {
            var value = object[key], result;
            if (base) {
                key = base + '[' + key + ']';
            }
            switch (typeof value) {
                case 'object':
                    result = QU.ObjectToQueryString(value, key);
                    break;
                case 'array':
                    var qs = {};
                    value.forEach(function(val, i) {
                        qs[i] = val;
                    });
                    result = QU.ObjectToQueryString(qs, key);
                    break;
                default:
                    result = key + '=' + encodeURIComponent(value);
            }
            if (value != null) {
                queryString.push(result);
            }
        });
        return queryString.join('&');
    };

    // The reverse of ObjectToQueryString, converts a string in the form
    // "key=v1&key2=v2%24" into object {key: 'v1', key2: 'v2$'}
    // optional keepBlanks determines whether empty values are returned in the object, defaults to true
    QU.QueryStringToObject = function(str, keepBlanks) {
        if (keepBlanks === undefined) {
            keepBlanks = true;
        }
        // http://unixpapa.com/js/querystring.html
        var decodeComponent = function(str) {
            return decodeURIComponent(str.replace(/\+/g, ' '));
        };
        // This implementation is based on the function in MooTools More
        var decodeKeys = true,
            decodeValues = true;
        var vars = str.split(/[&;]/),
            object = {};

        if (!vars.length) {
            return object;            
        }
        vars.forEach(function(val) {
            var index = val.indexOf('=') + 1,
                value = index ? val.substr(index) : '',
                keys = index ? val.substr(0, index - 1).match(/([^\]\[]+|(\B)(?=\]))/g) : [val],
                obj = object;
            if (!keys) return;
            if (!keepBlanks && !value) return;
            if (decodeValues) value = decodeComponent(value);
            keys.forEach(function(key, i) {
                if (decodeKeys) key = decodeComponent(key);
                var current = obj[key];

                if (i < keys.length - 1) obj = obj[key] = current || {};
                else if (typeof current === 'array') current.push(value);
                else obj[key] = current != null ? [current, value] : value;
            });
        });
        return object;
    };

    // Executes function fn when the DOM has loaded in the web page.
    // If the DOM has already loaded, executes fn immediately.
    QU.whenReady = function(fn) {
        if (document.attachEvent ? document.readyState === "complete" : document.readyState !== "loading") {
            fn();
        } else {
            document.addEventListener('DOMContentLoaded', fn);
        }
    };

    // Deep clones a simple object, returning a copy of it.
    // Date and Function values and circular references are not handled by this method.
    // Dates will be converted to string representations in the returned clone
    // while Function values will simply be omitted.
    QU.clone = function(obj) {
        return JSON.parse(JSON.stringify(obj));
    };

    // Merges one or more (just pass more parameters) objects into the first object,
    // returning the first object with the content of the rest merged in.
    // This implementation is taken directly from MooTools Object.merge()
    // but has the same limitations as QU.clone() above.
    QU.merge = function(obj, obj2) {
        var mergeOne = function(dest, key, source) {
            switch (typeof source) {
                case 'object':
                    if (typeof dest[key] == 'object') QU.merge(dest[key], source);
                    else dest[key] = QU.clone(source);
                    break;
                case 'array':
                    dest[key] = QU.clone(source);
                    break;
                default:
                    dest[key] = source;
            }
            return dest;
        };
        // Merge obj2[, obj3, [...]] into obj
        for (var i = 1, l = arguments.length; i < l; i++) {
            var src = arguments[i];
            for (var key in src) {
                mergeOne(obj, key, src[key]);
            }
        }
        return obj;
    };
} // if (!window.QU)
