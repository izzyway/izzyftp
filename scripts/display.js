$required(IzzyObject, "IzzyObject");

function Display(ftp){
	IzzyObject.call(this);
  this.timer = null;
}
Display.prototype = Object.create(IzzyObject.prototype);
Display.prototype.constructor = Display;

Display.LONG_CLICK_TIME = 1000;

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
Display.prototype.openFilePopup = function(file){
    modal(true);
    setFile(file);
    document.$get('filepopup').$removeClass('hidden');
    var instance = this;
    var input = document.$get('filename'); 
    input.value = file.name;
    var classes = file.getClassNames();
    this.debug('Open file '+file.name+' ('+classes+')');
    if (file.type == 'FOLDER'){
        document.$get('fileopen').$set('disabled', 'disabled');
        document.$get('filedelete').$set('disabled', 'disabled');
        document.$get('filedownload').$set('disabled', 'disabled');
    }else{
        document.$get('fileopen').$unset('disabled');
        document.$get('filedelete').$unset('disabled');
        document.$get('filedownload').$unset('disabled');
    }
    
    if (classes.indexOf('text') >= 0 || classes.indexOf('image') >= 0){
        document.$get('fileopen').$unset('disabled');
    }else{
        document.$get('fileopen').$set('disabled', 'disabled');
    }
}
Display.prototype.add = function(file){
    if (file.type != 'FOLDER' || file.name != '.'){
        var instance = this;
        var zclass = file.getClassNames();
        var main = $new('div').$set({'class':'filerow'});
        document.$get('screen').$append(main);
        main.$append($new('span', file.getPrettyName()).$set({'class':zclass}));
        if (file.type == 'FOLDER'){
            main.onclick = function(){
                ftp.openFolder(file);
                window.clearTimeout(instance.timer);
            };
        }
        if (file.type != 'FOLDER' || file.name != '..'){
            main.addEventListener('touchstart', function(){
                instance.timer = window.setTimeout(function(){
                    instance.openFilePopup(file);
                }, Display.LONG_CLICK_TIME);
            }, false);

            main.addEventListener('touchend', function(){
                window.clearTimeout(instance.timer);
            }, false);
        }
    }
}

