$required(IzzyObject, "IzzyObject");

function Display(id, rawId, pathId){
	IzzyObject.call(this);
	this.id = id;
	this.rawId = rawId;
	this.pathId = pathId;
}
Display.prototype = Object.create(IzzyObject.prototype);
Display.prototype.constructor = Display;

Display.prototype.$log = function (msg, className){
	document.$get(this.rawId).$append($new('div', msg).$set({'class':className}));
}
Display.prototype.input = function (input, className){
	this.$log(input, className);
}
Display.prototype.output = function (output){
	this.$log(output, 'output');
}
Display.prototype.path = function (path){
	document.$get(this.pathId).innerHTML = path;
}
Display.prototype.console = function (output){
	this.$log(output, 'console');
}
Display.prototype.clear = function (msg){
	document.$get(this.id).innerHTML = msg?msg:'';
}
Display.prototype.clearAll = function (){
    this.clear();
	document.$get(this.rawId).innerHTML = '';
}
Display.prototype.add = function(file){
    var zclass = file.getClassNames();
    var size = file.getPrettySize();
    if (size != '') size = ' ('+size+')';
    document.$get(this.id).$append($new('div', file.name + size).$set({'class':zclass, 'id':file.id}));
    if (file.type == 'FILE'){
        if (zclass.indexOf('text')>=0){
                document.$get(file.id).$append($new('button', 'Edit').$set({'id':'b'+file.id}));
        }
    }else if (file.type == 'FOLDER' && file.name != '.'){
        if (file.name == '..') document.$get(file.id).$append($new('button', '⏎').$set({'id':'b'+file.id}));
        else document.$get(file.id).$append($new('button', 'Open').$set({'id':'b'+file.id}));
    }
}

