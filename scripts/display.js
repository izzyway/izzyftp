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
Display.prototype.add = function(file){
    document.$get(this.id).$append($new('div', file.name).$set({'class':file.getClassNames(), 'id':file.id}));
    if (file.type == 'FILE'){
        document.$get(file.id).$append($new('div', file.size).$set({'class':'size'}));
    }
}
