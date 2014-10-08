$required(IzzyObject, "IzzyObject");

function Socket(host, port, options){
	IzzyObject.call(this);

	var DEFAULT_OPTIONS = {userSecureTransport:false, binaryType:'string'};

	this.host = host;
	this.port = port;
	this.options = (typeof options === undefined)?DEFAULT_OPTIONS:options;
    this.connect();
	this._onreceived = options.received;
	this._onerror = options.error;
	this._onclose = options.close;

	this.buffer = '';

}

Socket.prototype = Object.create(IzzyObject.prototype);
Socket.prototype.constructor = Socket;

Socket.prototype.connect = function(){
    this.debug('Connecting to '+this.host+':'+this.port);
    this.socket = this._initSocket(navigator.mozTCPSocket.open(this.host, this.port, this.options));
    this.info('Connected to '+this.host+':'+this.port);
    this.connected = true;
}
Socket.prototype._initSocket = function(socket){
	var instance = this;
	this.socket = socket;
	this.socket.ondata = function(evt){instance._received(evt);}
	this.socket.ondrain = function(){instance._send();}
	this.socket.onerror = function(evt){instance._error(evt);}
	this.socket.onclose = function(evt){instance._close(evt);}
	return this.socket;
}
Socket.prototype._received = function(evt){
	var data = evt.data;
	this.debug('<< '+data);
	if (this._onreceived) this._onreceived.call(this, data);
}
Socket.prototype._error = function(evt){
	var data = evt.data;
	this.debug('Error ('+evt.type+') '+this.host+':'+this.port+' - '+$stringify(data));
	if (this._onerror) this._onerror.call(this, data);
}
Socket.prototype._close = function(evt){
	this.debug('Close '+this.host+':'+this.port);
	this.connected = false;
	if (this._onclose) this._onclose.call(this);
}
Socket.prototype._send = function(){
	while (this.buffer.length > 0){
		var char = this.buffer.slice(0, 1);
		this.buffer = this.buffer.slice(1);
		if (!this.connected || !this.socket.send(char)) break;
	}
}
Socket.prototype.send = function(data){
	this.debug('Send data to '+this.host+':'+this.port);
	this.buffer += data;
	this._send();
}
Socket.prototype.onreceived = function(fct){
	this._onreceived = fct;
}
Socket.prototype.onerror = function(fct){
	this._onerror = fct;
}
Socket.prototype.onclose = function(fct){
	this._onclose = fct;
}
Socket.prototype.close = function(){
    try{
	    if (this.socket) this.socket.close();
	 }catch(e){
	    this.debug('Error ('+e+') during the close of the socket '+this.host+':'+this.port);
	 }
	this.connected = false;
	this.socket = null;
}

