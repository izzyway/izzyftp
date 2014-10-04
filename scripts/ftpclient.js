
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
	this.passiveMode = false;
	this.commandSocket = null;
	this.dataSocket = null;
	this.raw = false;
	this.connected = false;
	this.dataPort;
	this.dataHost;
	this.dataBuffer = '';
	this.tree = {'/':[]};
	this.path = '/';
	this.scheduledCommand = false;
	this.displayedFile = 0;
	this.commandQueue = [];
	this.currentCommand;
	this.timeoutId;
	this.rescheduled = 0;
}
FTPClient.REPLY_CODES = {
    CONNECTION: {possible:[120, 220, 421], success:220},
    USER: {possible:[230, 530, 500, 501, 421, 331, 332], success:331},
    PASS: {possible:[230, 202, 530, 500, 501, 503, 421, 332], success:230},
    CWD: {possible: [250, 500, 501, 502, 421, 530, 550], success:250},
    PASV: {possible:[227, 500, 501, 502, 504, 421, 530], success:227},
    TYPE: {possible:[200, 500, 501, 504, 421, 530], success:200},
    STOR: {possible:[125, 150, 110, 226, 250, 425, 426, 451, 551, 552, 532, 450, 452, 553, 500, 501, 421, 530], success:250},
    LIST: {possible:[125, 150, 226, 250, 425, 426, 451, 450, 500, 501, 502, 421, 530], success:250}
};

FTPClient.NEED_DATA_CONNECTION_CODE = 150;
FTPClient.CLOSE_DATA_CONNECTION_CODE = 226;
FTPClient.COMMAND_INTERVAL = 1000;
FTPClient.CRLF = "\r\n";

FTPClient.prototype = Object.create(IzzyObject.prototype);
FTPClient.prototype.constructor = FTPClient;

FTPClient.prototype.connect = function(){
	this.display.clear();
	this._connect();
	this.LIST();
}
FTPClient.prototype._connect = function(){
	var instance = this;	
	this.currentCommand = 'CONNECTION';
	this.debug('Connecting to '+this.host+':'+this.port);
	this.commandSocket = new Socket(this.host, this.port, 
					{userSecureTransport:false, 
					 binaryType:'string',
					 received: function(data){instance._received(data);},
					 error: function(error){instance.error(error);},
					 close: function(){instance.disconnected('command');}
				});
	this.info('Connected to '+this.host+':'+this.port);
	if (this.raw) this.display.console('Connected to '+this.host+':'+this.port);	
	this.USER();
	this.PASS();
	this.PASV();
}
FTPClient.prototype._received = function(data){
	if (this.raw) this.display.input(data, 'command');
	if (this.passiveMode){
		this._parsePassiveModeReply(data);
		this.passiveMode = false;
	}
	var code = this._extractCode(data);
	this.debug('Code '+code+' received');
	if (code == FTPClient.CLOSE_DATA_CONNECTION_CODE) {
	    if (this.dataSocket) this.dataSocket.close();
	    this.debug('Data connection closed');
	}else{
        var command = this._extractCommand(this.currentCommand);
        this.currentCommand = null;
        var codes = FTPClient.REPLY_CODES[command];
        if (!codes) {
            this._throw('Unknown command '+command);
        }else{
            this._checkCode(code, codes);
            this.debug(command+' successful ('+code+')');
            this.connected = command == 'CONNECTION' || this.connected;
            if (code == FTPClient.NEED_DATA_CONNECTION_CODE) this._data();
            this._nextCommand();
        }
	}
}
FTPClient.prototype._dataReceived = function(data){
	if (this.raw) this.display.input(data, 'data');
	else{
		this.dataBuffer += data;
		var index;
		while ((index = this.dataBuffer.indexOf('\n')) > 0){
			var line = this.dataBuffer.substring(0, index);
			var file = new File(line);
			this.dataBuffer = this.dataBuffer.substring(index+1);
			this.display.add(file.name, file.getClassNames());
			this.tree[this.path].unshift(file);
		}
	}
}
FTPClient.prototype._extractCode = function(data){
	var code = 0;
	var matches = data.match(/^([0-9]{3}) .*/);
	if (matches && matches.length > 1) code = matches[1];
	return code;
}
FTPClient.prototype._checkCode = function(code, codes){
	var possible = codes.possible;
	var possibleCode = false;
	for (var index = 0; index < possible.length; index++){
		possibleCode = possibleCode || possible[index] == code;		
	}	
	if (!possibleCode) this._throw('Wrong returned code ('+code+') for command '+this.currentCommand);
	else{
		if (code != codes.success && code != FTPClient.NEED_DATA_CONNECTION_CODE) {
			this._throw(this.currentCommand+' failed, returned code: '+code);
		}
	} 
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
		this.debug('Data socket: ' + host + ':' + port);
		this._data();
	}else{
		this._throw('Cannot parse the passive mode reply: '+reply);
	}	
}
FTPClient.prototype._data = function(){
    this.debug('Connecting to data socket '+this.dataHost+':'+this.dataPort);
    var instance = this;
	this.dataSocket = new Socket(this.dataHost, this.dataPort, 
				{userSecureTransport:false, 
				 binaryType:'string',
				 received: function(data){instance._dataReceived(data);},
				 error: function(error){instance._null(error);},
				 close: function(){instance._null('data');}
			});
	if (this.raw) this.display.console('Connected to data port '+port);
	this.debug('Connected to data socket '+this.dataHost+':'+this.dataPort);
}
FTPClient.prototype._null = function(){
}
FTPClient.prototype.error = function(error){
	if (this.raw) this.display.console(error.name+(error.message?': '+error.message:''));
	this.close();
}
FTPClient.prototype.close = function(){
	if (this.commandSocket) this.commandSocket.close();
	if (this.dataSocket) this.dataSocket.close();
	this.connected = false;
	this._clear();
}
FTPClient.prototype._clear = function(){
	try{
		window.clearTimeout(this.timeoutId);
	}catch(e){ }
}
FTPClient.prototype.disconnected = function(socketName){
	if (this.raw) {
		if (socketName == 'data') this.display.console('Disconnected from data socket');
		else this.display.console('Disconnected from FTP server');
	}
}
FTPClient.prototype._throw = function(msg){
	this.debug(msg);
	this.close();
	throw msg;
}
FTPClient.prototype._nextCommand = function(){
	var instance = this;
	if (!this.scheduledCommand){
		this.scheduledCommand = true;
		this.timeoutId = window.setTimeout(function(){instance._sendCommand();}, FTPClient.COMMAND_INTERVAL);
	}else{
		this.scheduled++;
	}
}
FTPClient.prototype._sendCommand = function(){
	if (this.scheduled > 0){
		this.timeoutId = window.setTimeout(function(){this._sendCommand();}, FTPClient.COMMAND_INTERVAL);
		this.scheduled--;
	}else{
	    this._clear();
	    this.scheduledCommand = false;
		this.currentCommand = this.commandQueue.shift();
		if (this.currentCommand){
            var command = this._extractCommand(this.currentCommand);
            this.passiveMode = command == 'PASV';
            var message = command == 'PASS'?'PASS *********':this.currentCommand;
            if (this.raw) this.display.output(message);
            this.debug(message);
            this.commandSocket.send(this.currentCommand + FTPClient.CRLF);
		}
	}
}
FTPClient.prototype._extractCommand = function(command){
	var cmd = '###';
	var matches = command.match(/^([A-Z]{2,}).*/);
	if (matches && matches.length > 1) cmd = matches[1];
	return cmd;
}
FTPClient.prototype.command = function(command){
	this.commandQueue.push(command);
}
FTPClient.prototype.LIST = function(){
	this.command('LIST');
}
FTPClient.prototype.USER = function(){
	this.command('USER '+this.context.user);
}
FTPClient.prototype.PASS = function(){
	this.command('PASS '+this.context.password);
}
FTPClient.prototype.PASV = function(){
	this.command('PASV');
}

