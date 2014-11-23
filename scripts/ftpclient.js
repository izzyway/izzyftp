
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
	this.queue = true;
	this.binaryType = 'string';
}
FTPClient.REPLY_CODES = {
    CONNECTION: {possible:[120, 220, 421], success:220},
    USER: {possible:[230, 530, 500, 501, 421, 331, 332], success:331},
    PASS: {possible:[230, 202, 530, 500, 501, 503, 421, 332], success:230},
    CWD: {possible: [250, 500, 501, 502, 421, 530, 550], success:250},
    PASV: {possible:[227, 500, 501, 502, 504, 421, 530], success:227},
    TYPE: {possible:[200, 500, 501, 504, 421, 530], success:200},
    STOR: {possible:[125, 150, 110, 226, 250, 425, 426, 451, 551, 552, 532, 450, 452, 553, 500, 501, 421, 530], success:250},
    PWD: {possible:[257, 500, 501, 502, 421], success:257},
    LIST: {possible:[125, 150, 226, 250, 425, 426, 451, 450, 500, 501, 502, 421, 530], success:250},
    RETR: {possible:[125, 150, 110, 226, 250, 425, 426, 451, 450, 550, 500, 501, 421, 530], success:250},
    QUIT: {possible:[221, 500], success:221}
};

FTPClient.NEED_DATA_CONNECTION_CODE = 150;
FTPClient.CLOSE_DATA_CONNECTION_CODE = 226;
FTPClient.CONNECTION = new FTPCommand('CONNECTION');
FTPClient.CRLF = "\r\n";

FTPClient.prototype = Object.create(IzzyObject.prototype);
FTPClient.prototype.constructor = FTPClient;

FTPClient.prototype.connect = function(){
	this.display.clear('Loading...');
	this.connecting();
	this.PWD();
    this.LIST();
}
FTPClient.prototype.connecting = function(){
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
	if (this.context.password != '') this.PASS();
	else this.debug('No password');
	if (this.context.user != '') this.USER();
	else this.debug('No user');
	this.queue = true;
}
FTPClient.prototype.connected = function(){
    this.display.console('Connected to '+this.host+':'+this.port);
    document.$get('connected').$set({'src': 'app-icons/connect.png'})
}
FTPClient.prototype._received = function(data){
	this.display.input(data, 'command');
	var code = this._extractCode(data);
	this.debug('Code '+code+' received');
	if (code == FTPClient.CLOSE_DATA_CONNECTION_CODE) {
	    this.debug('Data connection close requested');
	    if (this.dataSocket) this.dataSocket.close();
	}else{
	    try{
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
            if (this.currentCommand.dataCallback) this.dataCallback = this.currentCommand.dataCallback;
            this.currentCommand = null;
            this._nextCommand();
        }catch(e){
            this._throw(e);
        }
	}
}

FTPClient.prototype._dataReceived = function(data){
    if (this.dataCallback) this.dataCallback.call(this, data);
}
FTPClient.prototype._list = function(data){
    this.data += data;
    this.display.clear();
    var index;
    this.tree[this.path] = [];
    var temp = this.data;
    while ((index = temp.indexOf('\n')) > 0){
        var line = temp.substring(0, index);
        var file = new File(line);
        temp = temp.substring(index+1);
        this.display.add(file);
        this.tree[this.path].push(file);
        this.hookFile(file);
    }
}
FTPClient.prototype._retr = function(data){
    try{
        if (this.currentFile.getClassNames().indexOf('text')>=0){
            this.data += data;
            document.$get('filecontent').value = this.data;
            document.$get('data').$addClass('hidden');
            document.$get('fileopen').$removeClass('hidden');
        }else{
            var temp = this.data;
            this.data =  new Uint8Array(temp.length + data.length);
            for (var index = 0; index < temp.length; index++) this.data[index] = temp[index];
            for (var index = 0; index < data.length; index++) this.data[index + temp.length] = data[index];
            this.debug('Image length '+this.data.length);
            document.$get('image').innerHTML = '';
            document.$get('image').$append($new('img').$set({src:'data:image/'+this.currentFile.ext+';base64,'+$base64(this.data)}));
            document.$get('data').$addClass('hidden');
            document.$get('imageopen').$removeClass('hidden');
        }
    }catch(e){
        this._throw(e);
    }
}
FTPClient.prototype.hookFile = function(file){
    var instance = this;
    if (file.type == 'FOLDER' && file.name != '.'){
        document.$get('b'+file.id).onclick = function(){instance.openFolder(file);};
    }else if (file.type == 'FILE'){
        if (file.getClassNames().indexOf('text') >=0){
            document.$get('b'+file.id).onclick = function(){instance.openTextFile(file);};
        }else if (file.getClassNames().indexOf('image') >=0){
            document.$get('b'+file.id).onclick = function(){instance.openImageFile(file);};
        }
    }
}
FTPClient.prototype.openTextFile=function(file){
    this.data = '';
    this.currentFile = file;
    this.TYPE('A');
    this.RETR(file.name);
    document.$get('filename').innerHTML = file.name;
    document.$get('fileinfo').innerHTML = '';
}
FTPClient.prototype.openImageFile=function(file){
    this.data =  new Uint8Array(0);
    this.currentFile = file;
    this.TYPE('I');
    this.RETR(file.name);
    document.$get('imagename').innerHTML = file.name;
}
FTPClient.prototype.saveFile = function(){
    document.$get('fileinfo').innerHTML = 'Saving...';
    this.PASV();
    this.STOR(this.currentFile.name);
}
FTPClient.prototype._sendTextData = function(){
    var data = document.$get('filecontent').value;
    this.debug('>> '+data);
    this.display.output(data);
    this.dataSocket.send(data);
    this.dataSocket.close();
    this.currentFile.size = data.length;
    var size = this.currentFile.getPrettySize();
    if (size != '') size = ' ('+size+')';
    document.$get('i'+this.currentFile.id).innerHTML = this.currentFile.name + size;
    document.$get('fileinfo').innerHTML = 'Saved';
}
FTPClient.prototype.openFolder=function(file){
    this.debug('Open folder '+file.name);
    this.TYPE('A');
    this.CWD(file.name);
    this.display.clear('Loading...');
    this._changePath(file.name);
    var files = this.tree[this.path];
    if (files){
        this.display.clear();
        for (var index = 0; index < files.length; index++){
            var file = files[index];
            this.display.add(file);
            this.hookFile(file);
        }
    }else{
        this.LIST();
    }
}
FTPClient.prototype.reload = function(){
    this.LIST();
}
FTPClient.prototype._changePath = function(folder){
    if (folder != '.'){
        if (folder == '..') {
            var index = this.path.lastIndexOf('/', this.path.length);
            this.path = this.path.substring(0, index);
        }else{
            if (this.path.substring(this.path - 1) == '/') this.path += folder;
            else this.path += '/' + folder;
        }
        this.display.path(this.path);
    }
}
FTPClient.prototype._extractCode = function(data){
	var code = 0;
	var matches = data.match(/^([0-9]{3}).*/);
	if (matches && matches.length > 1) code = matches[1];
	return code;
}
FTPClient.prototype._checkCode = function(code, codes, command){
	var possible = codes.possible;
	var possibleCode = false;
	for (var index = 0; index < possible.length; index++){
		possibleCode = possibleCode || possible[index] == code;		
	}	
	if (!possibleCode) throw 'Wrong returned code ('+code+') for command '+command;
	else{
		if (code != codes.success && code != FTPClient.NEED_DATA_CONNECTION_CODE && code != FTPClient.CLOSE_DATA_CONNECTION_CODE) {
			throw command+' failed, returned code: '+code;
		}
	}
	this.info(command+' successful ('+code+')');
}
FTPClient.prototype._parsePWDReply = function(reply){
    var matches = reply.match(/^257 [\'\"]?([^ \'\"]+).*/);
    if (matches && matches.length > 1){
        this.path = matches[1];
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
	this.display.console(error.name+(error.message?': '+error.message:''));
	this.close();
}
FTPClient.prototype.close = function(){
	if (this.commandSocket) this.commandSocket.close();
	if (this.dataSocket) this.dataSocket.close();
	this.closed();
}
FTPClient.prototype.closed = function(){
	document.$get('connected').$set({'src': 'app-icons/disconnect.png'})
}
FTPClient.prototype._disconnected = function(socketName){
    if (socketName == 'data') this.display.console('Disconnected from data socket');
    else this.display.console('Disconnected from FTP server');
    this.closed();
}
FTPClient.prototype.disconnect = function(socketName){
    this.QUIT();
}
FTPClient.prototype._throw = function(msg){
    this.display.console(msg);
	this.debug(msg);
	this.close();
	document.$get('data').$addClass('hidden');
	document.$get('raw').$addClass('hidden');
    document.$get('error').$removeClass('hidden');
    document.$get('message').innerHTML = msg;
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
            this.debug('>> '+this.currentCommand.pretty);
            this.commandSocket.send(this.currentCommand.command + this.currentCommand.parameter + FTPClient.CRLF);
        }
    }
}
FTPClient.prototype.command = function(command){
	if (command.dataCallback && (!this.dataSocket || !this.dataSocket.connected)) this.PASV();
	if (this.queue) this.commandQueue.push(command);
	else this.commandQueue.unshift(command);
	this._nextCommand();
}
FTPClient.prototype.LIST = function(){
    var instance = this;
    this.data = '';
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
	this.command(new FTPCommand('PASV', null, null, function(reply){instance._parsePassiveModeReply(reply);}));
}
FTPClient.prototype.CWD = function(name){
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
 	this.command(new FTPCommand('RETR', name, null, null, function(data){instance._retr(data);}));
}
FTPClient.prototype.STOR = function(name){
    var instance = this;
 	this.command(new FTPCommand('STOR', name, null, function(reply){instance._sendTextData(reply);}));
}
FTPClient.prototype.TYPE = function(type){
    switch (type){
        case 'A': this.binaryType = 'string'; break;
        default: this.binaryType = 'arraybuffer';
    }
 	this.command(new FTPCommand('TYPE', type));
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