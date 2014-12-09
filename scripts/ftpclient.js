
$required(IzzyObject, "IzzyObject");
$include('scripts/socket.js');
$include('scripts/file.js');

function FTPClient(display, host, port, user, password){	
	IzzyObject.call(this);
	if (!port) port = 21;		// Default port	
	this.host = host;
	this.port = port;
	this.context = {'user':user, 'password':password};
	this.display = display;
	this.commandSocket;
	this.dataSocket;
	this.dataPort;
	this.dataHost;
	this.data;
	this.dataCallback;
	this.tree = {};
	this.path;
	this.displayedFile = 0;
	this.commandQueue = [];
	this.currentCommand;
	this.currentFile;
  this.currentUploadFile;
	this.queue = true;
	this.binaryType = 'string';
	this.dataType = 'txt';
	this.message;
	this.code;
	this.homePath;
	this.display.setClient(this);
	this.display.path('');
  this.catchCallback = null;
}
FTPClient.REPLY_CODES = {
    CONNECTION: {possible:[120, 220, 421], success:[220]},
    USER: {possible:[230, 530, 500, 501, 421, 331, 332], success:[331, 230]},
    PASS: {possible:[230, 202, 530, 500, 501, 503, 421, 332], success:[230]},
    CWD: {possible: [250, 500, 501, 502, 421, 530, 550], success:[250]},
    PASV: {possible:[227, 500, 501, 502, 504, 421, 530], success:[227]},
    TYPE: {possible:[200, 500, 501, 504, 421, 530], success:[200]},
    STOR: {possible:[125, 150, 110, 226, 250, 425, 426, 451, 551, 552, 532, 450, 452, 553, 500, 501, 421, 530], success:[125, 250]},
    PWD: {possible:[257, 500, 501, 502, 421], success:[257]},
    LIST: {possible:[125, 150, 226, 250, 425, 426, 451, 450, 500, 501, 502, 421, 530], success:[125, 250]},
    RETR: {possible:[125, 150, 110, 226, 250, 425, 426, 451, 450, 550, 500, 501, 421, 530], success:[125, 250]},
    MKD: {possible:[257, 550, 500, 501, 502, 421, 530], success:[257]},
    QUIT: {possible:[221, 500], success:[221]}
};

FTPClient.NEED_DATA_CONNECTION_CODE = 150;
FTPClient.NEED_PASS = 331;
FTPClient.CLOSE_DATA_CONNECTION_CODE = 226;
FTPClient.CONNECTION = new FTPCommand('CONNECTION');
FTPClient.CRLF = "\r\n";

FTPClient.prototype = Object.create(IzzyObject.prototype);
FTPClient.prototype.constructor = FTPClient;

FTPClient.prototype.connect = function(){
	this.display.loading(0);
	this.connecting();
	this.PWD();
    this.LIST();
}
FTPClient.prototype.connecting = function(){
    try{
        var instance = this;
        this.currentCommand = FTPClient.CONNECTION;
        this.commandSocket = new Socket(this.host, this.port,
                        {userSecureTransport:false,
                         binaryType:'string',
                         received: function(data){instance._received(data);},
                         error: function(error){instance.error(error);},
                         close: function(){instance._disconnected('command');}
                    });
        this.connected();
        this.queue = false;
        if (this.path) this.CWD(this.path);
        if (this.context.user != '') this.USER();
        else this.debug('No user');
        this.queue = true;
	}catch(e){
	    this._throw(e);
	}
}
FTPClient.prototype.connected = function(){
    this.display.console('Connected to '+this.host+':'+this.port);
    this.display.connected();
}
FTPClient.prototype._received = function(data){
    try{
        this.display.input(data, 'command');
        var code = this._extractCode(data);
        this.debug('Code '+code+' received');
        if (this.currentCommand != null && this.currentCommand.command != 'CONNECTION' && this.$in(FTPClient.REPLY_CODES.CONNECTION.success, code)){
            // Some servers send several times the success code, just ignore the second time
            return;
        }
        if (this.currentCommand != null && this.currentCommand.command != 'PASS' && this.$in(FTPClient.REPLY_CODES.PASS.success, code)){
            // Some servers send several times the success code, just ignore the second time
            return;
        }
        if (code == FTPClient.NEED_PASS){
            this.queue = false;
            this.PASS(this.context.password);
            this.queue = true;
        }
        if (code == FTPClient.CLOSE_DATA_CONNECTION_CODE) {
            this.debug('Data connection close requested');
            if (this.dataSocket) this.dataSocket.close();
        }else if (this.currentCommand){
            var codes = FTPClient.REPLY_CODES[this.currentCommand.command];
            if (!codes) {
                this._throw('Unknown command '+this.currentCommand.command);
            }else{
                this._checkCode(code, codes, this.currentCommand.command);
                if (code == FTPClient.NEED_DATA_CONNECTION_CODE && this.dataSocket && !this.dataSocket.connected){
                    this.dataSocket.connect();
                }
                if (this.currentCommand.callback){
                    this.currentCommand.callback.call(this, data);
                }
            }
            this.currentCommand = null;
            this.catchCallback = null;
            this._nextCommand();
        }
	}catch(e){
        this._throw(e);
    }
}

FTPClient.prototype._dataReceived = function(data){
    switch (this.dataType){
     case 'txt': this.display.console('Text data ('+data.length+' bytes)', 'dataType');break;
     case 'bin': this.display.console('Binary data ('+data.length+' bytes)', 'dataType'); break;
     default: this.display.console(data);
    }
    if (this.dataCallback) this.dataCallback.call(this, data);
}
FTPClient.prototype._list = function(data){
    try{
        this.data += data;
        var index;
        this.tree[this.path] = [];
        var temp = this.data;
        while ((index = temp.indexOf('\n')) > 0){
            var line = temp.substring(0, index);
            var file = new File(line);
            temp = temp.substring(index+1);
            this.tree[this.path].push(file);
        }
        this._displayFolder(this.tree[this.path]);
    }catch(e){
        this._throw(e);
    }
}
FTPClient.prototype._retr = function(data){
    try{
        if (this.currentFile.getClassNames().indexOf('text')>=0){
            this.data += data;
            this.display.displayText(this.data);
        }else{
            var temp = this.data;
            this.data =  new Uint8Array(temp.length + data.length);
            for (var index = 0; index < temp.length; index++) this.data[index] = temp[index];
            for (var index = 0; index < data.length; index++) this.data[index + temp.length] = data[index];
            this.debug('Image length '+this.data.length);
            this.display.displayImage(this.data, this.currentFile.ext);
        }
        var length = this.currentFile.length;
        if (length>0) this.display.loading(Math.round(100 - 100*(length - this.data.length)/length));
        else this.display.loading(100);
    }catch(e){
        this._throw(e);
    }
}
FTPClient.prototype.openTextFile=function(file){
    this.data = '';
    this.currentFile = file;
    this.dataType = 'txt';
    this.TYPE('A');
    this.RETR(this.abs());
    this.display.path(file.name);
    this.display.loading(0);
}
FTPClient.prototype.openImageFile=function(file){
    this.data =  new Uint8Array(0);
    this.currentFile = file;
    this.dataType = 'bin';
    this.TYPE('I');
    this.RETR(this.abs());
    this.display.path(file.name);
    this.display.loading(0);
}
FTPClient.prototype.setPath=function(){
    this.display.path(this.path);
}
FTPClient.prototype.abs=function(){
    if (this.path[this.path.length - 1] == '/') return this.path + this.currentFile.name;
    else return this.path + '/' + this.currentFile.name;
}
FTPClient.prototype.saveTextFile = function(data){
    this.data = data;
    this.display.loading(0);
    this.dataType = 'txt';
    this.STOR(this.abs());
}
FTPClient.prototype.uploadFile = function(name, file){
    this.dataType = 'bin';
    this.currentUploadFile = file;
    this.display.loading(0);
    this.TYPE('I');
    this.STOR(name);
}
FTPClient.prototype._sendData = function(){
    try{
        switch (this.dataType){
            case 'txt':
                this.debug('>> '+this.data);
                this.display.console('Text data ('+this.data.length+')', 'dataType');
                this.currentFile.size = this.data.length;
                this.dataSocket.send(this.data, this);
                break;
            case 'bin':            
                if (this.currentUploadFile){
                    var length = this.currentUploadFile.size;
                    this.display.console('Bin data ('+length+')', 'dataType');
                    var reader = new FileReader();
                    var instance = this;
                    reader.onload = function(e) {
                         instance.dataSocket.send(this.result, instance)
                    }
                    reader.onerror = function(e) {
                         instance._throw(e);            
                    }
                    reader.onloadend = function(e) {
                         instance.LIST();            
                    }
                    reader.readAsArrayBuffer(this.currentUploadFile);
                }    
                break;
        }
    }catch(e){
        this._throw(e);
    }
}
FTPClient.prototype.sending=function(number){
    this.display.loading(number);
}
FTPClient.prototype.openFolder=function(file){
    this.debug('Open folder '+file.name);
    this.display.loading(0);
    this._changePath(file.name);
    var files = this.tree[this.path];
    if (files){
        this._displayFolder(files);
    }else{
        this._displayFolder([]);
        this.TYPE('A');
        this.CWD(this.path);
        this.LIST();
    }
}
FTPClient.prototype._displayFolder=function(files){
    this.display.clear();
    var hasBack = false;
    for (var index = 0; index < files.length; index++){
        var file = files[index];
        if (file.type == 'FOLDER' && file.name == '..') {
            hasBack = true;
            break;
        }
    }
    if (!hasBack && this.path != this.homePath){
        this.display.add(File.BACK);
    }
    for (var index = 0; index < files.length; index++){
        var file = files[index];
        if (file.name != '..' || file.type != 'FOLDER' || this.path != this.homePath){
            this.display.add(file);
        }
    }
    this.display.loading(100);
}
FTPClient.prototype.reload = function(){
    this.LIST();
}
FTPClient.prototype._changePath = function(folder){
    if (folder != '.'){
        if (folder == '..') {
            if (this.path != this.homePath){
                var index = this.path.lastIndexOf('/', this.path.length);
                this.path = this.path.substring(0, index);
            }
        }else{
            if (this.path.substring(this.path - 1) == '/') this.path += folder;
            else this.path += '/' + folder;
        }
        if (this.path == '') this.path = '/';
        this.display.path(this.path);
    }
}
FTPClient.prototype._extractCode = function(data){
	var code = 0;
	var matches = data.match(/^([0-9]{3}).*/);
	if (matches && matches.length > 1) code = matches[1];
	this.message = data;
	this.code = code;
	return code;
}
FTPClient.prototype._checkCode = function(code, codes, command){
	if (!this.$in(codes.possible, code)) throw 'Wrong returned code ('+code+') for command '+command;
	else{
		if (!this.$in(codes.success, code) && code != FTPClient.NEED_DATA_CONNECTION_CODE && code != FTPClient.CLOSE_DATA_CONNECTION_CODE) {
			throw command+' failed, returned code: '+code;
		}
	}
	this.info(command+' successful ('+code+')');
}
FTPClient.prototype._parsePWDReply = function(reply){
    var matches = reply.match(/^257 [\'\"]?([^ \'\"]+).*/);
    if (matches && matches.length > 1){
        this.path = matches[1];
        if (!this.homePath) this.homePath = this.path;
        this.debug('Path = '+this.path);
        this.display.path(this.path);
    }else this._throw('Cannot parse path '+reply);

}
FTPClient.prototype._parsePassiveModeReply = function(reply){
	var code = this._extractCode(reply, 227);
	function toHex(n){
		var h = new Number(n).toString(16);
		instance.debug('toHex('+n+')='+h);
		return h;
	}
	function toDec(h){
		var d = parseInt(h, 16);
		instance.debug('toDec('+h+')='+d);
		return d;
	}
	function pad2(s){
		var p = $pad(s, 2);
		instance.debug('pad2('+s+')='+p);
		return p;
	}
	var instance = this;
	var matches = reply.match(/[^(]*\(([0-9]+),([0-9]+),([0-9]+),([0-9]+),([0-9]+),([0-9]+)\)[^)]*/);
	if (matches && matches.length == 7){
		this.dataHost = matches[1]+'.'+matches[2]+'.'+matches[3]+'.'+matches[4];
		this.dataPort = toDec(pad2(toHex(matches[5]))+pad2(toHex(matches[6])));
        this.dataSocket = new Socket(this.dataHost, this.dataPort,
                    {userSecureTransport:false,
                     binaryType: this.binaryType,
                     received: function(data){instance._dataReceived(data);},
                     error: function(error){instance._null(error);},
                     close: function(){instance._null('data');}
                });
        this.display.console('Connected to data port '+this.dataPort);
	}else{
		this._throw('Cannot parse the passive mode reply: '+reply);
	}
}
FTPClient.prototype._null = function(){
}
FTPClient.prototype.error = function(error){
    var str = error.name+(error.message?': '+error.message:'');
	this.display.console(str);
	this._throw(str);
}
FTPClient.prototype.close = function(){
	if (this.commandSocket) this.commandSocket.close();
	if (this.dataSocket) this.dataSocket.close();
	this.closed();
}
FTPClient.prototype.closed = function(){
    this.display.console('Disconnected');
    this.display.disconnected();
}
FTPClient.prototype._disconnected = function(socketName){
    if (socketName == 'data') this.display.console('Disconnected from data socket');
    else this.display.console('Disconnected from FTP server');
    if (this.currentCommand === FTPClient.CONNECTION) this.display.error(-1)
    this.closed();
}
FTPClient.prototype.disconnect = function(socketName){
    this.QUIT();
}
FTPClient.prototype._throw = function(msg){
  this.display.console(msg);
	this.debug(msg);
  if (this.catchCallback){
    this.currentCommand = null;
	  this.queue = false;
    this.catchCallback.call(this);    
    this.catchCallback = null;
	  this.queue = true;
  }else{
    this.close();
    this.display.error(this.code, this.message, msg);
  }
}
FTPClient.prototype.catch = function(method, callback){
    this.catchCallback = callback;
    try{
        method.call(this);
    }catch(e){
        this._throw(e);
    }
}
FTPClient.prototype._nextCommand = function(){
	if (this.currentCommand == null){
		this._sendCommand();
	}
}
FTPClient.prototype._sendCommand = function(){
    if (this.commandQueue.length > 0){
        if (!this.commandSocket.connected){
            this.display.output('Reconnect to the FTP server');
            this.connecting();
        }else{
            this.currentCommand = this.commandQueue.shift();
            this.display.output(this.currentCommand.pretty);
            if (this.currentCommand.dataCallback) this.dataCallback = this.currentCommand.dataCallback;
            this.debug('>> '+this.currentCommand.pretty);
            this.commandSocket.send(this.currentCommand.command + this.currentCommand.parameter + FTPClient.CRLF, this);
        }
    }
}
FTPClient.prototype.$in = function(array, element){
    for (var index = 0; index < array.length; index++){
        if (array[index] == element) return true;
    }
    return false;
}
FTPClient.prototype.command = function(command){
	if (this.queue) this.commandQueue.push(command);
	else this.commandQueue.unshift(command);
	this._nextCommand();
}
FTPClient.prototype.LIST = function(){
    var instance = this;
    this.data = '';
    this.dataType = 'list';
    this.TYPE('A');
    this.PASV();
	this.command(new FTPCommand('LIST', null, null, null, function(data){instance._list(data);}));
}
FTPClient.prototype.USER = function(){
	this.command(new FTPCommand('USER', this.context.user));
}
FTPClient.prototype.PASS = function(){
    var pass = '********************************************************************'.substring(0, this.context.password.length);
	this.command(new FTPCommand('PASS', this.context.password, 'PASS '+pass));
}
FTPClient.prototype.PASV = function(){
    var instance = this;
    if (this.dataSocket) this.dataSocket.close();
	this.command(new FTPCommand('PASV', null, null, function(reply){instance._parsePassiveModeReply(reply);}));
}
FTPClient.prototype.CWD = function(name){
  this.display.path(name);
  this.path = name;
	this.command(new FTPCommand('CWD', name));
}
FTPClient.prototype.QUIT = function(){
    var instance = this;
	this.command(new FTPCommand('QUIT', null, null, function(reply){instance._disconnected(reply);}));
}
FTPClient.prototype.PWD = function(){
    var instance = this;
 	this.command(new FTPCommand('PWD', null, null, function(reply){instance._parsePWDReply(reply);}));
}
FTPClient.prototype.RETR = function(name){
    var instance = this;
    this.PASV();
 	this.command(new FTPCommand('RETR', name, null, null, function(data){instance._retr(data);}));
}
FTPClient.prototype.STOR = function(name){
  var instance = this;
  this.PASV();
 	this.command(new FTPCommand('STOR', name, null, function(){instance._sendData();}));
}
FTPClient.prototype.TYPE = function(type){
    switch (type){
        case 'A': this.binaryType = 'string'; break;
        default: this.binaryType = 'arraybuffer';
    }
 	this.command(new FTPCommand('TYPE', type));
}
FTPClient.prototype.MKD = function(name){
  var instance = this;
 	this.command(new FTPCommand('MKD', name, null, function(){instance.queue=false;instance.CWD(name);instance.queue=true;}));
}
FTPClient.prototype.reset = function(){
    this.context = null;
    this.tree = {};
    this.commandQueue = [];
}

function FTPCommand(command, parameter, pretty, callback, dataCallback){
    this.command = command;
    this.parameter = parameter?' '+parameter:'';
    this.pretty = pretty?pretty:this.command + this.parameter;
    this.callback = callback;
    this.dataCallback = dataCallback;
}
