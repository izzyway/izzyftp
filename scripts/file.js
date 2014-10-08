$required(IzzyObject, "IzzyObject");

var __FILE_ID_GENERATOR = 0;

function File(line){
	IzzyObject.call(this);
	this.id = 'f'+__FILE_ID_GENERATOR++;
	this._parse(line);	
}

File.prototype = Object.create(IzzyObject.prototype);
File.prototype.constructor = File;
File.UNITS = ['B', 'KB', 'MB', 'GB', 'TB'];

File.prototype._parse = function(line){
	var matches = line.match(/([dsl-]{1})([a-zA-Z-]{9})[\t ]+([0-9]+)[\t ]+([^\t ]+)[\t ]+([^\t ]+)[\t ]+([0-9]+)[\t ]+(.+)[\t ]+(.+)/);
	if (matches && matches.length == 9) {
		switch(matches[1]){
			case 'l': this.type = 'LINK'; break;
			case 'd': this.type = 'FOLDER'; break;
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
File.prototype.getPrettySize = function(){
    if (this.size && this.type == 'FILE'){
        var index = 0;
        var size = this.size;
        while (size > 1024 && index < File.UNITS.length) {
            size /= 1024;
            index++;
        }
        var str = new String(Math.round(size * 100));
        var trunc = str.substring(0, str.length-2);
        var dec = str.substring(str.length-2);
        if (dec == '00') dec = '';
        else if (dec[1] == '0') dec = '.' + dec[0];
        else dec = '.'+dec;
        return ' ('+trunc + dec + File.UNITS[index] + ')';
    }
    return '';
}
File.prototype.getClassNames = function(){
    if (this.type == 'FILE'){
        var className = 'file';
        var index = this.name.lastIndexOf('.')
        if (index > 0 && index < this.name.length) {
            var ext = this.name.substring(index + 1).toLowerCase();
            if (ext == 'html' || ext == 'htm') className = 'file text xml html';
            else if (ext == 'xml') className = 'file text xml';
            else if (ext == 'txt') className = 'file text';
            else if (ext == 'css') className = 'file text css';
            else if (ext == 'conf') className = 'file text configuration';
            else if (ext == 'properties' || ext == 'property' || ext == 'prop') className = 'file text configuration';
            else if (ext == 'js') className = 'file text javascript';
            else if (ext == 'xls') className = 'file excel';
            else if (ext == 'py') className = 'file text python';
            else if (ext == 'log') className = 'file text log';
            else if (ext == 'sh') className = 'file text shell';
            else if (ext == 'pdf') className = 'file pdf';
            else if (ext == 'sql') className = 'file text sql';
            else if (ext == 'md') className = 'file text markdown';
            else if (ext == 'doc' || ext == 'docx') className = 'file word';
            else if (ext == 'ppt') className = 'file powerpoint';
            else if (ext == 'zip' || ext == 'war' || ext =='rar' || ext =='tar'|| ext =='bz2') className = 'file compressed';
            else if (ext == 'png' || ext == 'gif' || ext =='jpg' || ext =='bmp' || ext == 'jpeg') className = 'file image';
            else if (ext == 'wav' || ext == 'mp3' || ext =='midi') className = 'file music';
            else if (ext == 'key') className = 'file key';
            else if (ext == 'php' || ext == 'php3' || ext == 'php4' || ext == 'php5') className = 'file text php';
        }
        return className;
    }else if (this.type == 'FOLDER') return 'folder';
    else if (this.type == 'SOCKET') return 'socket';
    else if (this.type == 'LINK') return 'link';
    return '';
}


