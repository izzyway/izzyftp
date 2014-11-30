$required(IzzyObject, "IzzyObject");

function Display(ftp){
	IzzyObject.call(this);
}
Display.prototype = Object.create(IzzyObject.prototype);
Display.prototype.constructor = Display;

Display.prototype.setClient = function (client){
    this.client = client;
}
Display.prototype.$log = function (msg, className){
	document.$get('raw').$append($new('div', msg).$set({'class':className}));
}
Display.prototype.input = function (input, className){
	this.$log(input, className);
}
Display.prototype.output = function (output){
	this.$log(output, 'output');
}
Display.prototype.path = function (path){
	document.$get('label').innerHTML = path;
}
Display.prototype.console = function (output, className){
	if (className) this.$log(output, 'console '+className);
	else this.$log(output, 'console');
}
Display.prototype.clear = function (){
	document.$get('screen').innerHTML = '';
}
Display.prototype.clearAll = function (){
    this.clear();
	document.$get('raw').innerHTML = '';
}
Display.prototype.loading = function (percent){
    document.$get('progress').value= percent;
}
Display.prototype.connected = function (){
    document.$get('icon').$addClass('connected');
    document.$get('icon').$removeClass('disconnected');
}
Display.prototype.disconnected = function (){
    document.$get('icon').$removeClass('connected');
    document.$get('icon').$addClass('disconnected');
}
Display.prototype.displayText= function (text){
    var t = $new('textarea', text).$set('id', 'filecontent');
    var content = document.$get('content');
    content.innerHTML = '';
    content.$insert(t);
    document.$get('file').$removeClass('hidden');
    document.$get('screen').$addClass('hidden');
    document.$get('fit').$addClass('hidden');
    document.$get('save').$removeClass('hidden');
}
Display.prototype.displayImage= function (data, ext){
    var content = document.$get('content');
    content.innerHTML = '';
    content.$append($new('img').$set({id:'img', src:'data:image/'+ext+';base64,'+$base64(data)}));
    document.$get('file').$removeClass('hidden');
    document.$get('screen').$addClass('hidden');
    document.$get('fit').$removeClass('hidden').innerHTML = 'Fit';
    document.$get('save').$addClass('hidden');
}
Display.prototype.error= function (code, message, exception){
    if (exception == 'ConnectionRefusedError'){
        document.$get('errormsg').innerHTML = 'Connection failed, check the host and the port';
        document.$get('errordetail').innerHTML = '';
        document.$get('report').$addClass('hidden');
        document.$get('back').$removeClass('hidden');
    }else if (code == 530){
        document.$get('errormsg').innerHTML = 'Connection failed, check the user and the password';
        document.$get('errordetail').innerHTML = message;
        document.$get('report').$addClass('hidden')
        document.$get('back').$removeClass('hidden');
    }else if (code == -1){
       document.$get('errormsg').innerHTML = 'Connection failed, host refused the connection, retry later';
       document.$get('errordetail').innerHTML = '';
       document.$get('report').$addClass('hidden')
       document.$get('back').$removeClass('hidden');
    }else{
        document.$get('errormsg').innerHTML = 'Unexpected error: '+exception;
        document.$get('errordetail').innerHTML = message;
        document.$get('report').$removeClass('hidden')
        document.$get('back').$removeClass('hidden');
    }
    document.$get('errorpopup').$removeClass('hidden');
    this.loading(100);
}
Display.prototype.add = function(file){
    if (file.type != 'FOLDER' || file.name != '.'){
        var ftp = this.client;
        var zclass = file.getClassNames();
        var size = file.getPrettySize();
        if (size != '') size = ' ('+size+')';
        var main = $new('div').$set({'class':'filerow'});
        document.$get('screen').$append(main);
        main.$append($new('span', file.name + size).$set({'class':zclass}));
        if (file.type == 'FILE'){
            if (zclass.indexOf('text')>=0){
                    main.onclick = function(){ftp.openTextFile(file)};
                    main.$addClass('clickable');
            }else if (zclass.indexOf('image')>=0){
                    main.onclick = function(){ftp.openImageFile(file)};
                    main.$addClass('clickable');
            }else{
                main.$addClass('unclickable');
            }
        }else if (file.type == 'FOLDER' && file.name != '.'){
            main.onclick = function(){ftp.openFolder(file)};
            main.$addClass('clickable');
        }else{
            main.$addClass('unclickable');
        }
    }
}

