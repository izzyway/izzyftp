$required(IzzyObject, "IzzyObject");

function File(line){
	IzzyObject.call(this);
	this._parse(line);	
}

File.prototype = Object.create(IzzyObject.prototype);
File.prototype.constructor = File;

File.prototype._parse = function(line){
	var matches = line.match(/([dsl-]{1})([rwx-]{9})[\t ]+([0-9]+)[\t ]+([^\t ]+)[\t ]+([^\t ]+)[\t ]+([0-9]+)[\t ]+(.+)[\t ]+(.+)/);
	if (matches && matches.length == 9) {
		switch(matches[1]){
			case 'l': this.type = 'LINK'; break;
			case 'd': this.type = 'DIRECTORY'; break;
			case 's': this.type = 'SOCKET'; break;
			default : this.type = 'FILE';
		}
		this.permissions = matches[2];
		this.nbLinks = matches[3];
		this.owner = matches[4];
		this.group = matches[5];
		this.size = matches[6];
		this.lastModified = matches[7];
		this.name = matches[8];
		this.debug('Name: '+this.name+' size: '+this.size);
	}else throw 'Malformed file information line: '+line;
}

