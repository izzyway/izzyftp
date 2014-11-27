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
Display.prototype.console = function (output, className){
	if (className) this.$log(output, 'console '+className);
	else this.$log(output, 'console');
}
Display.prototype.clear = function (msg){
	document.$get(this.id).innerHTML = msg?msg:'';
}
Display.prototype.clearAll = function (){
    this.clear();
	document.$get(this.rawId).innerHTML = '';
}
Display.prototype.add = function(file){
    if (file.type != 'FOLDER' || file.name != '.'){
        var zclass = file.getClassNames();
        var size = file.getPrettySize();
        if (size != '') size = ' ('+size+')';
        var main = $new('div').$set({'id':file.id, 'class':'filerow'});
        document.$get(this.id).$append(main);
        main.$append($new('span', file.name + size).$set({'class':zclass, 'id':'i'+file.id}));
        if (file.type == 'FILE'){
            if (zclass.indexOf('text')>=0){
                    main.$append($new('button', 'Edit').$set({'id':'b'+file.id}));
            }else if (zclass.indexOf('image')>=0){
                     main.$append($new('button', 'View').$set({'id':'b'+file.id}));
            }
        }else if (file.type == 'FOLDER' && file.name != '.'){
            if (file.name == '..') main.$append($new('button', '⏎').$set({'id':'b'+file.id}));
            else main.$append($new('button', 'Open').$set({'id':'b'+file.id}));
        }
    }
}

