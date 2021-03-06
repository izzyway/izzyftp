$required(IzzyObject, "IzzyObject");

function Socket(host, port, options){
	IzzyObject.call(this);

	var DEFAULT_OPTIONS = {useSecureTransport:false, binaryType:'string'};

	this.host = host;
	this.port = port;
	this.options = (typeof options === undefined)?DEFAULT_OPTIONS:options;
  this.connect();
	this._onreceived = options.received;
	this._onerror = options.error;
	this._onclose = options.close;
	this.scope = {};

}

Socket.prototype = Object.create(IzzyObject.prototype);
Socket.prototype.constructor = Socket;

Socket.prototype.connect = function(){
    this.debug('Connecting to '+this.host+':'+this.port);
    this.socket = this._initSocket(navigator.mozTCPSocket.open(this.host, this.port, this.options));
	this.info('Connected to '+this.host+':'+this.port +" (secured: "+this.options.useSecureTransport+")");
    this.connected = true;
}
Socket.prototype._initSocket = function(socket){
	var instance = this;
	this.socket = socket;
	this.socket.ondata = function(evt){instance._received(evt);}
	this.socket.ondrain = function(){instance._drain();}
	this.socket.onerror = function(evt){instance._error(evt);}
	this.socket.onclose = function(evt){instance._close(evt);}
	return this.socket;
}
Socket.prototype._received = function(evt){
	var data = evt.data;
	this.debug('<< '+data);
	if (typeof data === 'object' && data.byteLength){
	    var length = data.byteLength;
	    this.debug('Array of '+length+' bytes');
	    data = new Uint8Array(data);
	}
	if (this._onreceived) this._onreceived.call(this, data);
}
Socket.prototype._error = function(evt){
	var data = evt.data;
	this.debug('Error ('+evt.type+') '+this.host+':'+this.port+' - '+$stringify(data.name));
	if (this._onerror) this._onerror.call(this, data);
}
Socket.prototype._close = function(evt){
	this.debug('Close '+this.host+':'+this.port);
	this.connected = false;
	if (this._onclose) this._onclose.call(this);
}
Socket.prototype._drain = function(){
	this._send();
}
Socket.prototype._send = function(){
	var data = this.scope.data;
	if (data){
		var length = this._length(this.scope.data);
		var watcher = this.scope.watcher;
		if (length > 0){
			while (this.scope.index < this.scope.length){
				var full = !this.socket.send(this.scope.data, this.scope.index);
				this.scope.index += this.socket.bufferedAmount;
				if (!this.connected || full){								
					break
				} 
			}
			length = this._length(data) - this.scope.index;
		  if (this.scope.length > 0) watcher.sending.call(watcher, Math.round(100 * (this.scope.length-length)/this.scope.length));
		}else watcher.sending.call(watcher, 100);		
	}else this.debug('Try to send no data');
}
Socket.prototype.send = function(data, watcher){
	var length = this._length(data);
	this.debug('Send data to '+this.host+':'+this.port+' ('+length+')');
	this.scope.watcher = watcher;
	this.scope.length = length;
	this.scope.data = data;
	this.scope.index = 0;
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
Socket.prototype._length = function(data){
	return (typeof data.length !== 'undefined')?data.length:data.byteLength;
}
