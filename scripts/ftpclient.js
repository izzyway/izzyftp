
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
	this.commandSocket = null;
	this.dataSocket = null;
	this.dataPort;
	this.dataHost;
	this.dataBuffer = '';
	this.tree = {};
	this.path;
    this.wait4Data = false;
	this.displayedFile = 0;
	this.commandQueue = [];
	this.currentCommand = null;
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
    RETR: {possible:[125, 150, 110, 226, 250, 425, 426, 451, 450, 550, 500, 5001, 421, 530], success:250}
};

FTPClient.NEED_DATA_CONNECTION_CODE = 150;
FTPClient.CLOSE_DATA_CONNECTION_CODE = 226;
FTPClient.CONNECTION = new FTPCommand('CONNECTION');
FTPClient.CRLF = "\r\n";

FTPClient.prototype = Object.create(IzzyObject.prototype);
FTPClient.prototype.constructor = FTPClient;

FTPClient.prototype.connect = function(){
	this.display.clear('Loading...');
	var instance = this;
	this.currentCommand = FTPClient.CONNECTION;
	this.commandSocket = new Socket(this.host, this.port,
					{userSecureTransport:false,
					 binaryType:'string',
					 received: function(data){instance._received(data);},
					 error: function(error){instance.error(error);},
					 close: function(){instance.disconnected('command');}
				});
	this.display.console('Connected to '+this.host+':'+this.port);
	this.USER();
	this.PASS();
	this.PWD();
	this.LIST();
}
FTPClient.prototype._received = function(data){
	this.display.input(data, 'command');
	var code = this._extractCode(data);
	this.debug('Code '+code+' received');
	if (code == FTPClient.CLOSE_DATA_CONNECTION_CODE) {
	    if (this.dataSocket) this.dataSocket.close();
	    this.debug('Data connection closed');
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
            this.currentCommand = null;
            this._nextCommand();
        }catch(e){
            this._throw(e);
        }
	}
}

FTPClient.prototype._dataReceived = function(data){
    try{
        this.display.input(data, 'data');
        if (this.wait4Data){
            this.display.clear();
            this.wait4Data = false;
        }
        this.dataBuffer += data;
        var index;
        while ((index = this.dataBuffer.indexOf('\n')) > 0){
            var line = this.dataBuffer.substring(0, index);
            var file = new File(line);
            this.dataBuffer = this.dataBuffer.substring(index+1);
            this.display.add(file);
            if (!this.tree[this.path]) this.tree[this.path] = [];
            this.tree[this.path].push(file);
            this.hookFile(file);
        }
    }catch(e){
        this._throw(e);
    }
}
FTPClient.prototype.hookFile = function(file){
    var instance = this;
    if (file.type == 'FOLDER'){
        document.$get('b'+file.id).onclick = function(){instance.openFolder(file);};
    }else if (file.type == 'FILE'){
        if (file.getClassNames().indexOf('text') >=0){
            document.$get('b'+file.id).onclick = function(){instance.openFile(file);};
        }
    }
}
FTPClient.prototype.openFolder=function(file){
    this.debug('Open folder '+file.name);
    this.CWD(file.name);
    this.display.clear('Loading...');
    this._changePath(file.name);
    var files = this.tree[this.path];
    if (files){
        this.display.clear();
        this.wait4Data = false;
        for (var index = 0; index < files.length; index++){
            var file = files[index];
            this.display.add(file);
            this.hookFile(file);
        }
    }else{
        this.LIST();
    }
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
	var matches = data.match(/^([0-9]{3}) .*/);
	if (matches && matches.length > 1) code = matches[1];
	return code;
}
FTPClient.prototype._checkCode = function(code, codes, command){
	var possible = codes.possible;
	var possibleCode = false;
	for (var index = 0; index < possible.length; index++){
		possibleCode = possibleCode || possible[index] == code;		
	}	
	if (!possibleCode) this._throw('Wrong returned code ('+code+') for command '+command);
	else{
		if (code != codes.success && code != FTPClient.NEED_DATA_CONNECTION_CODE && code != FTPClient.CLOSE_DATA_CONNECTION_CODE) {
			this._throw(command+' failed, returned code: '+code);
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
                     binaryType:'string',
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
	this.connected = false;
}

FTPClient.prototype.disconnected = function(socketName){
    if (socketName == 'data') this.display.console('Disconnected from data socket');
    else this.display.console('Disconnected from FTP server');
}
FTPClient.prototype._throw = function(msg){
    this.display.console(msg);
	this.debug(msg);
	this.close();
	throw msg;
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
            this.currentCommand = FTPClient.CONNECTION;
            this.commandSocket.connect();
            this.display.console('Connected to '+this.host+':'+this.port);
        }else{
            this.currentCommand = this.commandQueue.shift();
            this.display.output(this.currentCommand.pretty);
            this.debug('>> '+this.currentCommand.pretty);
            this.commandSocket.send(this.currentCommand.command + this.currentCommand.parameter + FTPClient.CRLF);
        }
    }
}
FTPClient.prototype.command = function(command){
	if (command.needData && (!this.dataSocket || !this.dataSocket.connected)) this.PASV();
	this.wait4Data = command.needData;
	this.commandQueue.push(command);
	this._nextCommand();
}
FTPClient.prototype.LIST = function(){
	this.command(new FTPCommand('LIST', null, null, true));
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
	this.command(new FTPCommand('PASV', null, null, false, function(reply){instance._parsePassiveModeReply(reply);}));
}
FTPClient.prototype.CWD = function(name){
	this.command(new FTPCommand('CWD', name));
}
FTPClient.prototype.PWD = function(){
    var instance = this;
 	this.command(new FTPCommand('PWD', null, null, false, function(reply){instance._parsePWDReply(reply);}));
}
FTPClient.prototype.RETR = function(){
    var instance = this;
 	this.command(new FTPCommand('RETR', null, null, false, function(reply){instance._parsePWDReply(reply);}));
}
FTPClient.prototype.TYPE = function(type){
 	this.command(new FTPCommand('TYPE', type));
}

function FTPCommand(command, parameter, pretty, needData, callback){
    this.command = command;
    this.parameter = parameter?' '+parameter:'';
    this.pretty = pretty?pretty:this.command + this.parameter;
    this.needData = needData;
    this.callback = callback;
}