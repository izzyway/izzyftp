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
/** return true is the input obj is a date */
function $isDate(d){
	return d.getTime;
}	
/** Set an attribute to an Element */
Element.prototype.$set = function(name, value, ns){
	if ($isJSONObject(name)){
		for (var key in name) {
			if (value !== undefined) this.setAttributeNS(value, key, name[key]);
			else this.setAttribute(key, name[key]);
		}
	}else{		
		if (ns !== undefined) this.setAttributeNS(ns, name, value);
		else this.setAttribute(name, value);
	}	
	return this;
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
		if (str != '') str += ' ';
		str += key+':'+o[key];
	}	
	return str;
}
