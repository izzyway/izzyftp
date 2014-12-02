function IzzyObject(){
}
IzzyObject.prototype.toString = function(){
	return this.constructor.name;
}

IzzyObject.prototype.debug = function(msg){
	$log(this.toString() + ': '+msg);
}

IzzyObject.prototype.info = function(msg){
	$log(this.toString() + ': '+msg);
}

IzzyObject.prototype.warning = function(msg){
	$log(this.toString() + ': '+msg);
}

IzzyObject.prototype.severe = function(msg){
	$log(this.toString() + ': '+msg);
}
