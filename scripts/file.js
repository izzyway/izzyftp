$required(IzzyObject, "IzzyObject");

function File(line){
	IzzyObject.call(this);
	if (line) this._parse(line);
}

File.prototype = Object.create(IzzyObject.prototype);
File.prototype.constructor = File;
File.UNITS = ['', 'K', 'M', 'G', 'T'];
File.BACK = new File(); File.BACK.name='..'; File.BACK.type='FOLDER';
File.nameIndex = 45;

File.prototype._parse = function(line){
    var i = File.nameIndex;
    if (line.length > i && (line[i]==' ' || line[i] == '\t')){
        this.name = line.substring(i + 1).trim();
    } else {
        if (i + 2 < line.length) i = line.indexOf(' ', i);
        else i = line.lastIndexOf(' ');
        this.name = line.substring(i).trim();
    }
    line = line.substring(0, i);
	var matches = line.match(/([dsl-]{1})([a-zA-Z-]{9})[\t ]+([0-9]+)[\t ]+([^\t ]+)[\t ]+([^\t ]+)[\t ]+([0-9]+)[\t ]+(.+)[\t ]*/);
	if (matches && matches.length == 8) {
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
		var index = this.name.lastIndexOf('.')
        if (this.type == 'FILE' && index >= 0 && index < this.name.length) this.ext = this.name.substring(index + 1).toLowerCase();
        else this.ext = '';
		this.debug(this.type+(this.ext!=''?' ('+this.ext+')':'')+': "'+this.name+'" size: '+this.size);
	}else throw 'Malformed file information line: '+line;
}
File.prototype.getPrettySize = function(){
    if (this.size && this.type == 'FILE'){
        return File.formatSize(this.size);
    }
    return '';
}
File.formatSize = function(size){
    if (size == '0') return '0';
    var index = 0;
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
    return trunc + dec + File.UNITS[index];
}
File.prototype.getPrettyName = function(){
      var size = this.getPrettySize();
      if (size != '') size = ' ('+size+')';
      return this.name + size;
}
File.prototype.getClassNames = function(){
    if (this.type == 'FILE'){
        var className = 'file';
        if (this.ext == 'html' || this.ext == 'htm') className = 'file text xml html';
        else if (this.ext == 'xml') className = 'file text xml';
        else if (this.ext == 'txt') className = 'file text';
        else if (this.ext == 'css') className = 'file text css';
        else if (this.ext == 'conf') className = 'file text configuration';
        else if (this.ext == 'properties' || this.ext == 'property' || this.ext == 'prop') className = 'file text configuration';
        else if (this.ext == 'js') className = 'file text javascript';
        else if (this.ext == 'xls') className = 'file excel';
        else if (this.ext == 'py') className = 'file text python';
        else if (this.ext == 'log') className = 'file text log';
        else if (this.ext == 'sh') className = 'file text shell';
        else if (this.ext == 'pdf') className = 'file pdf';
		else if (this.ext == 'java') className = 'file text java';
        else if (this.ext == 'sql') className = 'file text sql';
        else if (this.ext == 'htaccess') className = 'file text htaccess';
        else if (this.ext == 'md') className = 'file text markdown';
        else if (this.ext == 'doc' || this.ext == 'docx') className = 'file word';
        else if (this.ext == 'ppt') className = 'file powerpoint';
        else if (this.ext == 'zip' || this.ext == 'war' || this.ext =='rar' || this.ext =='tar'|| this.ext =='bz2') className = 'file compressed';
        else if (this.ext == 'png' || this.ext == 'gif' || this.ext =='jpg' || this.ext =='bmp' || this.ext == 'jpeg') className = 'file image';
        else if (this.ext == 'wav' || this.ext == 'mp3' || this.ext =='midi') className = 'file music';
        else if (this.ext == 'key') className = 'file key';
        else if (this.ext == 'php' || this.ext == 'php3' || this.ext == 'php4' || this.ext == 'php5') className = 'file text php';
        return className;
    }else if (this.type == 'FOLDER') return 'folder';
    else if (this.type == 'SOCKET') return 'socket';
    else if (this.type == 'LINK') return 'link';
    return '';
}


