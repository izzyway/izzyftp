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
	$get('raw').append($new('div', msg).set({'class':className}));
}
Display.prototype.input = function (input, className){
	this.$log(input, className);
}
Display.prototype.output = function (output){
	this.$log(output, 'output');
}
Display.prototype.path = function (path){
	$get('label').innerHTML = path;
}
Display.prototype.console = function (output, className){
	if (className) this.$log(output, 'console '+className);
	else this.$log(output, 'console');
}
Display.prototype.clear = function (){
	$get('screen').innerHTML = '';
}
Display.prototype.clearAll = function (){
  this.clear();
	$get('raw').innerHTML = '';
}
Display.prototype.loading = function (percent){
    $get('progress').value= percent;
}
Display.prototype.connected = function (){
    $get('icon').addClass('connected');
    $get('icon').removeClass('disconnected');
}
Display.prototype.disconnected = function (){
    $get('icon').removeClass('connected');
    $get('icon').addClass('disconnected');
}
Display.prototype.displayText= function (text){
    var t = $new('textarea', text).set('id', 'filecontent');
    var content = $get('content');
    content.innerHTML = '';
    content.insert(t);
    $get('file').removeClass('hidden');
    $get('screen').addClass('hidden');
    $get('fit').addClass('hidden');
    $get('save').removeClass('hidden');
}
Display.prototype.displayImage= function (data, ext){
    var content = $get('content');
    content.innerHTML = '';
    content.append($new('img').set({id:'img', src:'data:image/'+ext+';base64,'+$base64(data)}));
    $get('file').removeClass('hidden');
    $get('screen').addClass('hidden');
    $get('fit').removeClass('hidden').innerHTML = 'Fit';
    $get('save').addClass('hidden');
}
Display.prototype.error= function (code, message, exception){
    modal(true);
    if (exception == 'ConnectionRefusedError'){
        $get('errormsg').innerHTML = 'Connection failed, check the host and the port';
        $get('errordetail').innerHTML = '';
        $get('report').addClass('hidden');
        $get('back').removeClass('hidden');
    }else if (code == 530){
        $get('errormsg').innerHTML = 'Connection failed, check the user and the password';
        $get('errordetail').innerHTML = message;
        $get('report').addClass('hidden')
        $get('back').removeClass('hidden');
    }else if (code == -1){
       $get('errormsg').innerHTML = 'Connection failed, host refused the connection, retry later';
       $get('errordetail').innerHTML = '';
       $get('report').addClass('hidden')
       $get('back').removeClass('hidden');
    }else{
        $get('errormsg').innerHTML = 'Unexpected error: '+exception;
        $get('errordetail').innerHTML = message;
        $get('report').removeClass('hidden')
        $get('back').removeClass('hidden');
        this.console(code);
        this.console(exception);
        this.console(message);        
    }
    $get('errorpopup').removeClass('hidden');
    this.loading(100);
}
Display.prototype.openFilePopup = function(file){
    modal(true);
    setFile(file);
    $get('filepopup').removeClass('hidden');
    var instance = this;
    var input = $get('filename'); 
    input.value = file.name;
    var classes = file.getClassNames();
    this.debug('Open file '+file.name+' ('+classes+')');
    if (file.type == 'FOLDER'){
        $get('fileopen').set('disabled', 'disabled');
        $get('filedelete').set('disabled', 'disabled');
        $get('filedownload').set('disabled', 'disabled');
    }else{
        $get('fileopen').unset('disabled');
        $get('filedelete').unset('disabled');
        $get('filedownload').unset('disabled');
    }
    if (classes.indexOf('image') >= 0 || classes.indexOf('audio') >= 0 || classes.indexOf('video') >= 0){
        $get('filedownload').unset('disabled');
    }else{
        $get('filedownload').set('disabled', 'disabled');
    }
    if (classes.indexOf('text') >= 0 || classes.indexOf('image') >= 0){
        $get('fileopen').unset('disabled');
    }else{
        $get('fileopen').set('disabled', 'disabled');
    }
}
Display.prototype.add = function(file){
    if (file.type != 'FOLDER' || file.name != '.'){
        var instance = this;
        var zclass = file.getClassNames();
        var main = $new('div').set({'class':'filerow'});
        $get('screen').append(main);
        main.append($new('span', file.getPrettyName()).set({'class':zclass}));
        if (file.type == 'FOLDER'){
            main.onclick = function(){
                ftp.openFolder(file);
                window.clearTimeout(instance.timer);
            };
        }
        if (file.type != 'FOLDER' || file.name != '..'){
            main.addEventListener('touchstart', function(evt){
                instance.timer = window.setTimeout(function(){
                    evt.stopPropagation();
                    instance.openFilePopup(file);
                }, Display.LONG_CLICK_TIME);
            }, false);

            main.addEventListener('touchend', function(evt){
                window.clearTimeout(instance.timer);
            }, false);
        }
    }
}

