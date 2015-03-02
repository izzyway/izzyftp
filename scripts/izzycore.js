$IZZY_VERSION = '0.5b';

/** Create an Element */
function $new(qName, content, ns){
	var e = ns !== undefined?document.createElementNS(ns, qName):document.createElement(qName);
	if (content != null && content !== undefined && content != ''){
		var c = document.createTextNode(content);
		e.appendChild(c);
	}	
	return e;
}
/** return true if the input obj is a JSON array */
function $isJSONArray(obj){
	return obj && obj.length && /\[.*\]/.test(JSON.stringify(obj));
}
/** return true if the input obj is a JSON Object */
function $isJSONObject(obj){
	return obj && /{.*}/.test(JSON.stringify(obj));
}
/** return true if the input obj is a Number */
function $isNumber(n){
	return typeof(n) == 'number';
}	
/** return true if the input obj is a string */
function $isString(s){
	return typeof(s) == 'string';
}
/** return true if the input obj is a function */
function $isFunction(f){
    return typeof(f) == 'function';
}
/** return true is the input obj is a date */
function $isDate(d){
	return d.getTime;
}	
/** Set an attribute to an Element */
Element.prototype.$set = function(name, value, ns){
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
/** Unset an attribute to an Element */
Element.prototype.$unset = function(name){
	this.removeAttribute(name);
	return this;
}
Element.prototype.$has = function(name){
	return this.hasAttribute(name);
}
/** Append an Element to the Element */
Element.prototype.$append = function(element){
	if (!element) throw 'Cannot append NULL element';
	this.appendChild(element);
	return this;
}
/** Insert an Element inside the Element */
Element.prototype.$insert = function(element){
	if (!element) throw 'Cannot insert NULL element';
	if (this.firstChild) this.insertBefore(element, this.firstChild);
	else {
		this.innerHTML = " ";
		this.replaceChild(element, this.firstChild);
	}
	return this;
}
/** Return true if the element has the given class */
Element.prototype.$hasClass = function(name){
    if (!name || !this.className || name.length > this.className.length) return false;
    return name == this.className ||
        this.className.indexOf(name + ' ') == 0 ||
        this.className.indexOf(' ' + name + ' ') > 0 ||
        (this.className.indexOf(' '+name) != -1 && this.className.indexOf(' '+name) + name.length + 1 == this.className.length);
}
/** Add a class to the Element */
Element.prototype.$addClass = function(name){
    if (!this.$hasClass(name)){
        if (!this.className || this.className.length == 0) this.className = name;
        else this.className += ' '+name;
    }
    return this;
}
/** Remove a class from the Element */
Element.prototype.$removeClass = function(name){
    if (this.$hasClass(name)){
        if (this.className == name) this.className = '';
        else if (this.className.indexOf(name+' ') == 0) this.className = this.className.substring(name.length + 1);
        else if (this.className.indexOf(' '+name) != -1 && this.className.indexOf(' '+name) + name.length + 1 == this.className.length){
            var index = this.className.lastIndexOf(' ');
            this.className = this.className.substring(0, index);
        }else this.className = this.className.replace(' '+name, '');
    }
    return this;
}
Element.prototype.$value = function(){
  if (this.selectedIndex) return this.options[this.selectedIndex].value;
	else if (typeof this.checked !== 'undefined') return this.checked;
	else return this.value;
}
/** Get an Element with the attribute id set to the given id */
Document.prototype.$get = function(id){
	return this.getElementById(id);
}
/** Append an Element to the Element identified by the id */
Document.prototype.$append = function(id, element){
	var elt = this.$get(id);
	if (elt){
		return elt.$append(element);
	}else{
		throw 'Cannot find element with id "'+id+'"';
	}
}
/** Insert an Element to the Element with the attribute id set to the given id */ 
Document.prototype.$insert = function(id, element){
	var elt = this.$get(id);
	if (elt){
		return elt.$insert(element);
	}else{
		throw 'Cannot find element with id "'+id+'"';
	}
}
/** Throw an Exception if the Object required is not in the context */
function $required(zclass, className){
	if (typeof zclass !== 'object' && typeof zclass !== 'function'){
		var msg = className + ' is required, add the js file in the main html file';
		$log(msg);
		throw msg;
	}
}
/** Include the javascript file to the current document and call the callback funciton given */
function $include(src, cb){
	var script = $new('script').$set({'type':'text/javascript', 'src':src});
	var head = document.getElementsByTagName('head');
	if (head) {
		$log('Include script "'+src+'"');
		var loaded = false;
		script.onload = function(){
			$log('Script "'+src+'" loaded');
			if (typeof cb === 'function') cb.call();
		}		
		head[0].$insert(script);
	}
}
/** Pad an number with zero [0] */
function $pad(n, nb) {
	var str = new String(n);
	return '00000000000'.substring(0, nb).substring(str.length) + str;
}
/** Log into the console */
function $log(msg) {
	if (typeof console !== 'undefined'){
		var now = new Date();
		var str = $pad(now.getHours(), 2)+':'+
			  $pad(now.getMinutes(), 2)+':'+
			  $pad(now.getSeconds(), 2)+','+
			  $pad(now.getMilliseconds(), 3);
 		console.log(str + ' ' + msg);
	}
}
/** Stringify on Object */
function $stringify(o){
	if (o === null) return 'null';
	if (typeof o === 'undefined') return 'undefined';
	if ($isJSONArray(o)) return JSON.stringify(o);
	if ($isString(o) || $isNumber(o) || $isDate(o)) return o;
	var str = '';
	for (var key in o){
	    if (typeof key !== 'undefined' && o.hasOwnProperty(key)){
	    	if (str != '') str += ' ';
		    str += key+':'+o[key];
		}
	}	
	return str;
}
function $inline(i){
    var str = $stringify(i);
    str = str.replace(/\n/g, '\\n');
    str = str.replace(/\r/g, '\\r');
    str = str.replace(/\t/g, '\\t');
    return str;
}
String.prototype.$hash = function() {
  var hash = 0, i, chr, len;
  if (this.length == 0) return hash;
  for (i = 0, len = this.length; i < len; i++) {
    chr   = this.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return 'X' + hash;
};
function $base64(input) {
    var keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    var output = "";
    var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
    var i = 0;

    while (i < input.length) {
        chr1 = input[i++];
        chr2 = i < input.length ? input[i++] : Number.NaN; // Not sure if the index
        chr3 = i < input.length ? input[i++] : Number.NaN; // checks are needed here

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
function $GET(url, options){
    $http('GET', url, options);
}
function $POST(url, options){
    $http('POST', url, options);
}
function $PUT(url, options){
    $http('PUT', url, options);
}
function $DELETE(url, options){
    $http('DELETE', url, options);
}
function $in(array, element){
		if (array && array.length){
    	for (var index = 0; index < array.length; index++){
        if (array[index] == element) return true;
    	}
		}	
    return false;
}

var CHAR_BIT_NUMBER = 64;
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

function $encode(data){
	function r(a, index){
		for (var i = 0; i<10; i++) a[index-i]=!a[index-i];
	}
	var a = _string2BitArray(data);
	for (var i=0; i<a.length; i++){
		if ((i+1)%CHAR_BIT_NUMBER==0) r(a, i);
	}
	return '001-'+_bitArray2String(a);
}
function $decode(data){
	return $encode(data.substring(4)).substring(4);
}