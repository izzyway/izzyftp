/**
Izzy JavaScript Library v0.2
http://izzyjs.izzyway.com/

Copyright 2006, izzyway.com and other contributors
Released under the Apache version 2.0 license
http://izzyjs.izzyway.com/license

Date: 2015-05-26

*/
/**
Element of DOM
 
@see http://www.w3.org/TR/DOM-Level-2-Core/core.html#ID-745549614
@name Element
@class Element of DOM
*/

/**
Document of DOM
 
@see http://www.w3.org/TR/DOM-Level-2-Core/core.html#i-Document
@name Document
@class Document of DOM
*/

/**
String
 
@name String
@class String
*/

/** 
Version of the framework
@constant 
@type {String}
@default 0.2
*/
const $IZZYJS_VERSION = '0.2';

/** 
Create an Element 
@param {String} qName - element name
@param {String} [content] - content of the element
@param {String} [ns] - namespace URI
@return {Element} - New Element
*/
Document.prototype.new = function(qName, content, ns){
	var e = ns !== undefined?this.createElementNS(ns, qName):this.createElement(qName);
	if (content != null && content !== undefined && content != ''){
		var c = this.createTextNode(content);
		e.appendChild(c);
	}	
	return e;
}

/** 
Create an Element (shortcut for document.new)
@param {String} qName - element name
@param {String} [content] - content of the element
@param {String} [ns] - namespace URI
@see document.new
@return {Element} - New Element
*/
function $new(qName, content, ns){
	return window.document.new(qName, content, ns);
}
/** 
Get an Element with the attribute id set to the given id 
@param {String} id id of the Element
@return {Element} - The Element identified by the given id
*/
Document.prototype.get = function(id){
	return this.getElementById(id);
}
/** 
Get an Element (shortcut for document.get)
@param {String} id - id of the Element
@see document.get
@return {Element} - The Element identified by the given id
*/
function $get(id){
	return window.document.get(id);
}
/** 
Append an Element to the last child of the Element identified by the given id 
@param {String} id - id of the Element parent
@param {Element} element - Element to append to the parent
@return {Element} - Parent Element
@throw Error if parent does not exist
@see Element.append
*/
Document.prototype.append = function(id, element){
	var elt = this.get(id);
	if (elt){
		return elt.append(element);
	}else{
		throw 'Cannot find element with id "'+id+'"';
	}
}
/** 
Append an Element to the last child of the Element identified by the given id (shortcut for document.append)
@param {String} id - id of the Element parent
@param {Element} element - Element to append to the parent
@return {Element} - Parent Element
@throw Error if parent does not exist
@see Element.append
@see Document.append
*/
function $append(id, element){
	return window.document.append(id, element);
}

/** 
Insert an Element before the first child of the Element identified by the given id 
@param {String} id - id of the Element parent
@param {Element} element - Element to be inserted
@return {Element} - Parent Element
@throw Error if parent does not exist
@see Element.insert
*/
Document.prototype.insert = function(id, element){
	var elt = this.get(id);
	if (elt){
		return elt.insert(element);
	}else{
		throw 'Cannot find element with id "'+id+'"';
	}
}
/** 
Insert an Element before the first child of the Element identified by the given id (shortcut for document.insert)
@param {String} id - id of the Element parent
@param {Element} element - Element to be inserted
@return {Element} - Parent Element
@throw Error if parent does not exist
@see Element.insert
@see document.insert
*/
function $insert(id, element){
	return window.document.insert(id, element);
}

/** 
Set an attribute to the Element 
@param {string/JSONObject} name - Name of the attribute or Set of Attribute (key:value)
@param {String} [value] - Value of the attribute (only if name is a string)
@param {String} [ns] - Namespace
@return {Element} - The Element
*/
Element.prototype.set = function(name, value, ns){
	if ($isJSONObject(name)){
		for (var key in name) {
			if (ns !== undefined) this.setAttributeNS(ns, key, name[key]);
			else this.setAttribute(key, name[key]);
		}
	}else{		
		if (ns !== undefined) this.setAttributeNS(ns, name, value);
		else this.setAttribute(name, value);
	}	
	return this;
}
/** 
Unset (remove) an attribute to the Element 
@param {String} name - name of the attribute to be removed
@return {Element} - The Element
*/
Element.prototype.unset = function(name){
	this.removeAttribute(name);
	return this;
}
/** 
Return true if the Element has the attribute
@param {String} name - name of the attribute 
@return {Boolean} - true if the Element has the attribute
*/
Element.prototype.has = function(name){
	return this.hasAttribute(name);
}

/**
Append a child Element to the Element 
@param {Element} element - Child Element to be appended
@throw Exception if the child Element is NULL
@return {Element} - Parent Element
*/
Element.prototype.append = function(element){
	if (!element) throw 'Cannot append NULL element';
	this.appendChild(element);
	return this;
}
/** 
Insert a child Element to the Element 
@param {Element} element - Child Element to be inserted
@throw Exception if the child Element is NULL
@return {Element} - Parent Element
*/
Element.prototype.insert = function(element){
	if (!element) throw 'Cannot insert NULL element';
	if (this.firstChild) this.insertBefore(element, this.firstChild);
	else {
		this.innerHTML = " ";
		this.replaceChild(element, this.firstChild);
	}
	return this;
}
/** 
Return true if the element has the given class 
@param {String} name - Name of the class to be checked
@return {Boolean} - True if the class is present
*/
Element.prototype.hasClass = function(name){
    if (!name || !this.className || name.length > this.className.length) return false;
    return name == this.className ||
        this.className.indexOf(name + ' ') == 0 ||
        this.className.indexOf(' ' + name + ' ') > 0 ||
        (this.className.indexOf(' '+name) != -1 && this.className.indexOf(' '+name) + name.length + 1 == this.className.length);
}
/** 
Add a class to the Element 
@param {String} name - Name of the class to be added
@return {Element} - The Element
*/
Element.prototype.addClass = function(name){
    if (!this.hasClass(name)){
        if (!this.className || this.className.length == 0) this.className = name;
        else this.className += ' '+name;
    }
    return this;
}
/** 
Remove a class from the Element 
@param {String} name - Name of the class to be added
@return {Element} - The Element
*/
Element.prototype.removeClass = function(name){
    if (this.hasClass(name)){
        if (this.className == name) this.className = '';
        else if (this.className.indexOf(name+' ') == 0) this.className = this.className.substring(name.length + 1);
        else if (this.className.indexOf(' '+name) != -1 && this.className.indexOf(' '+name) + name.length + 1 == this.className.length){
            var index = this.className.lastIndexOf(' ');
            this.className = this.className.substring(0, index);
        }else this.className = this.className.replace(' '+name, '');
    }
    return this;
}
/**
Get the value of the Element
@return {Object} - The value of the Element
*/
Element.prototype.getValue = function(){
  if (this.selectedIndex && this.options) return this.options[this.selectedIndex].value;
  else if (this.type == 'checkbox') return this.checked;
  else return this.value;
}
/**
Set the value of the Element
@param {Object} value - The new value
@return {Element} - The Element
*/
Element.prototype.setValue = function(value){
  if (this.selectedIndex && this.options){
	for (var index=0; index<this.options.length; index++){
		if (value == this.options[index]){
			this.selectedIndex = index;		
		}
	}
  }
  else if (this.type == 'checkbox' || this.type == 'radio') this.checked = value;
  else this.value = value;
  return this;
}
/**
Get the width of the Element
@return {Number} - The width of the Element
*/
Element.prototype.getWidth = function(){
  return this.offsetWidth;
}
/**
Get the height of the Element
@return {Number} - The height of the Element
*/
Element.prototype.getHeight = function(){
  return this.offsetHeight;
}
/** 
Return true if the input obj is a JSON array 
@param {Object} obj - Input object
@return {Boolean} - True is the input object is a JSONArray
*/
function $isJSONArray(obj){
	return obj && obj.toString && typeof obj.length != 'undefined' && obj.constructor === [].constructor;
}
/** 
Return true if the input obj is a JSON Object 
@param {Object} obj - Input object
@return {Boolean} - True is the input object is a JSONObject
*/
function $isJSONObject(obj){
	return obj && obj.toString && obj.constructor === {}.constructor;
}
/** 
Return true if the input obj is a Number 
@param {Object} obj - Input object
@return {Boolean} - True is the input object is a number
*/
function $isNumber(obj){
	return typeof(obj) == 'number';
}	
/** 
Return true if the input obj is a string 
@param {Object} obj - Input object
@return {Boolean} - True is the input object is a string
*/
function $isString(obj){
	return typeof(obj) == 'string';
}
/** 
Return true if the input obj is a function 
@param {Object} obj - Input object
@return {Boolean} - True is the input object is a function
*/
function $isFunction(obj){
    return typeof(obj) == 'function';
}
/** 
Return true is the input obj is a date 
@param {Object} obj - Input object
@return {Boolean} - True is the input object is a date
*/
function $isDate(obj){
	return obj.getTime;
}	

/** 
Throw an Exception if the Object required is not in the context 
@param {Object} zclass - Object or Function required 
@param {String} className - Name of the class, it will only be used in case of error
@throw Exception if the Object is not in the context
*/
function $required(zclass, className){
	if (typeof zclass !== 'object' && typeof zclass !== 'function'){
		var msg = className + ' is required';
		$log(msg);
		throw msg;
	}
}
/** 
Include the javascript file to the current document and call the callback function given 
@param {String} src - Source of the script to include
@param {Function} callback - Callback method, called when the script is loaded
*/
function $include(src, callback){
	var script = $new('script').set({'type':'text/javascript', 'src':src});
	var head = window.document.getElementsByTagName('head');
	if (head && head.length && head.length>0) {
		$log('Include script "'+src+'"');
		var loaded = false;
		script.onload = function(){
			$log('Script "'+src+'" loaded');
			if ($isFunction(callback)) callback.call(this);
		}		
		head[0].insert(script);
	}
}
/** 
Pad an number with zero [0] 
@param {Number} number - Input number
@param {Number} length - Min length of the padded result
@return {String} - Padded number as string
*/
function $pad(number, length) {
	var str = new String(number);
	return '000000000000000000000000000000'.substring(0, length).substring(str.length) + str;
}
/** 
Log into the console with a readable timestamp (allows chrono)
@param {Object} msg - The message or object to be logged
*/
function $log(msg) {
	if (typeof console !== 'undefined'){
		var now = new Date();
		var str = $pad(now.getHours(), 2)+':'+
			  $pad(now.getMinutes(), 2)+':'+
			  $pad(now.getSeconds(), 2)+','+
			  $pad(now.getMilliseconds(), 3);
 		console.log(str + ' ' + $stringify(msg));
	}
}
/**  
Stringify on Object 
@param {Object} object - Input object to transform to string
@return {String} - String repsentation of the object
*/
function $stringify(object){
	if (object === null) return 'null';
	if (typeof object === 'undefined') return 'undefined';
	if ($isJSONArray(object) || $isJSONObject(object)) return JSON.stringify(object);
	if (object.toString) return object.toString();
	if ($isString(object) || $isNumber(object) || $isDate(object)) return object;
	var str = '';
	for (var key in object){
	    if (typeof key !== 'undefined' && object.hasOwnProperty(key)){
	    	if (str != '') str += ' ';
		    str += key+':'+object[key];
		}
	}	
	return str;
}
/**
Stringify and inline the object
@param {Object} object - Input object to be inlined
@return {String} - String representation inlined
*/
function $inline(object){
    var str = $stringify(object);
    str = str.replace(/\n/g, '\\n');
    str = str.replace(/\r/g, '\\r');
    str = str.replace(/\t/g, '\\t');
    return str;
}
/**
Encode in base64 the string
@return {String} - The base64 representation of the string
@see String.unbase64
*/
String.prototype.base64 = function() {
	return $base64(this);
}
/**
Encode a string in base64
@return {String} - The encoded string
@param {String} input - A string
*/
function $base64(input) {
    var keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    var output = "";
    var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
    var i = 0;

    while (i < input.length) {
        chr1 = input.charCodeAt?input.charCodeAt(i++):input[i++];
        chr2 = i < input.length ? input.charCodeAt?input.charCodeAt(i++):input[i++] : Number.NaN;
        chr3 = i < input.length ? input.charCodeAt?input.charCodeAt(i++):input[i++] : Number.NaN; 

        enc1 = chr1 >> 2;
        enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
        enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
        enc4 = chr3 & 63;

        if (isNaN(chr2)) {
            enc3 = enc4 = 64;
        } else if (isNaN(chr3)) {
            enc4 = 64;
        }
        output += keyStr.charAt(enc1) + keyStr.charAt(enc2) +
                  keyStr.charAt(enc3) + keyStr.charAt(enc4);
    }
    return output;
}
/**
Decode a base64 string
@return {String} - The decoded representation of the string
@see String.base64
*/
String.prototype.unbase64 = function() {
	return $unbase64(this);
}
/**
Decode a base64 string
@return {String} - The decoded representation of the input string
@param {String} input - A base64 string
*/
function $unbase64(input){
    const keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    var output = "";
       var chr1, chr2, chr3;
        var enc1, enc2, enc3, enc4;
        var i = 0;
        input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
        while (i < input.length) {
            enc1 = keyStr.indexOf(input.charAt(i++));
            enc2 = keyStr.indexOf(input.charAt(i++));
            enc3 = keyStr.indexOf(input.charAt(i++));
            enc4 = keyStr.indexOf(input.charAt(i++));

            chr1 = (enc1 << 2) | (enc2 >> 4);
            chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
            chr3 = ((enc3 & 3) << 6) | enc4;

            output = output + String.fromCharCode(chr1);

            if (enc3 != 64) {
                output = output + String.fromCharCode(chr2);
            }
            if (enc4 != 64) {
                output = output + String.fromCharCode(chr3);
            }

        }
       var string = "";
        i = 0;
        var c = c1 = c2 = 0;

        while (i < output.length) {
            c = output.charCodeAt(i);
            if (c < 128) {
                string += String.fromCharCode(c);
                i++;
            }else if ((c > 191) && (c < 224)) {
                c2 = output.charCodeAt(i + 1);
                string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                i += 2;
            }else {
                c2 = output.charCodeAt(i + 1);
                c3 = output.charCodeAt(i + 2);
                string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                i += 3;
            }
        }
        return string;
}
    
/**
Send a http request
@param {String} method - The http method (GET, PUT, POST, DELETE...)
@param {String} url - The url of the request
@param {JSONObject} [options] - The callback methods (<code>options.success</code> and <code>options.error</code>) and the additional headers (<code>options.headers</code>)
@example $http('GET', 'http://izzyway.com/', {'X-Agent':'izzy'});
*/
function $http(method, url, options){
    var http = window.XMLHttpRequest?new window.XMLHttpRequest({mozSystem: true}):new window.ActiveXObject( "Microsoft.XMLHTTP" );
    if (http){
        var data = options?options.data:null;
        $log(method + ' ' + url);
        http.open(method, url, true);
        if (options && $isJSONObject(options.headers)){
            for (var key in options.headers){
                if (typeof key !== 'undefined' && options.headers.hasOwnProperty(key)){
                    var value = options.headers[key];
                    http.setRequestHeader(key, value);
                }
            }
        }
        if (options) http.onreadystatechange = function() {
          if (http.readyState == 4){
            var response = http.responseText;
            if (http.status == 200){
                $log(method + ' ' + url  + ': successful '+($isFunction(options.success)?'(calling function)':''));
                if ($isFunction(options.success)) options.success.call(this, response, http.status);
            }else{
                $log(method + ' ' + url + ': error '+http.status+($isFunction(options.error)?' (calling function)':''));
                if ($isFunction(options.error)) options.error.call(this, response, http.status);
            }
          }
        }
        http.send(data);
    }else $log('Unable to create HttpRequest Object');
}

/**
GET an url 
@param {String} url - The url
@param {JSONObject} [options] - The callback methods (<code>options.success</code> and <code>options.error</code>) and the additional headers (<code>options.headers</code>)
@see $http
*/
function $GET(url, options){
    $http('GET', url, options);
}

/**
POST an url 
@param {String} url - The url
@param {JSONObject} [options] - The callback methods (<code>options.success</code> and <code>options.error</code>) and the additional headers (<code>options.headers</code>)
@see $http
*/
function $POST(url, options){
    $http('POST', url, options);
}

/**
PUT an url 
@param {String} url - The url
@param {JSONObject} [options] - The callback methods (<code>options.success</code> and <code>options.error</code>) and the additional headers (<code>options.headers</code>)
@see $http
*/
function $PUT(url, options){
    $http('PUT', url, options);
}

/**
DELETE an url 
@param {String} url - The url
@param {JSONObject} [options] - The callback methods (<code>options.success</code> and <code>options.error</code>) and the additional headers (<code>options.headers</code>)
@see $http
*/
function $DELETE(url, options){
    $http('DELETE', url, options);
}
/**
Return true if the element is in the array
@param {Array} array - input array
@param {Object} element - element to search
@return {Boolean} - True if the element is present in the array
*/
function $in(array, element){
	if (array && array.length){
  	  	for (var index = 0; index < array.length; index++){
  	      if (array[index] == element) return true;
    	}
     }	
    return false;
}

/** 
@private
*/
const CHAR_BIT_NUMBER = 64;

/**
Encode the string in a none human readable string
@return The encoded string
@see String.encode
*/
String.prototype.encode = function(){
	/**
	@private
	*/
	function _string2BitArray(s) {
			var a = [];
			function bit(d) {
				for (var i = 0; i < CHAR_BIT_NUMBER; i++) {
					a.unshift(d % 2 == 1);
					d = Math.floor(d / 2);
				}
			}
	    for (var i = s.length - 1; i >= 0; i--) {
		bit(s.charCodeAt(i));
	    }
	    return a;
	}
	/**
	@private
	*/
	function _bitArray2String(a){
		var s = '';
		var c = 0;
		var b = CHAR_BIT_NUMBER;
		for (var i = 0; i < a.length; i++){
		c += (a[i]?1:0) * Math.pow(2, --b);
			if (b == 0){
				s+= String.fromCharCode(c);
				c = 0; 
				b = CHAR_BIT_NUMBER;
			} 
	 	}
		 return s;
	}
	function r(a, index){
		for (var i = 0; i<10; i++) a[index-i]=!a[index-i];
	}
	var a = _string2BitArray(this);
	for (var i=0; i<a.length; i++){
		if ((i+1)%CHAR_BIT_NUMBER==0) r(a, i);
	}
	return _bitArray2String(a);
}
/**
Decode the string 
@return The decoded string
@see String.decode
*/
String.prototype.decode = function(){
	return this.encode();
}
   





