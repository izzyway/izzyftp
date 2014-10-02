$required(IzzyObject, "IzzyObject");

function Display(id){
	IzzyObject.call(this);
	this.id = id;
}
Display.prototype = Object.create(IzzyObject.prototype);
Display.prototype.constructor = Display;

Display.prototype.$log = function (msg, className){
	document.$get(this.id).$insert($new('div', msg).$set({'class':className}));
}
Display.prototype.input = function (input, className){
	this.$log(input, className);
}
Display.prototype.output = function (output){
	this.$log(output, 'output');
}
Display.prototype.console = function (output){
	this.$log(output, 'console');
}
Display.prototype.clear = function (){
	document.$get(this.id).innerHTML = '';
}
