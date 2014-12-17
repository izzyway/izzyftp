$required(IzzyObject, "IzzyObject");

function File(line){
	IzzyObject.call(this);
	if (line) this._parse(line);
}

File.prototype = Object.create(IzzyObject.prototype);
File.prototype.constructor = File;
File.UNITS = ['', 'K', 'M', 'G', 'T'];
File.BACK = new File(); File.BACK.name='..'; File.BACK.type='FOLDER';

File.TEXT_TYPE = ['html', 'htm', 'xml', 'txt', 'css', 'conf', 'properties', 'property', 'prop', 'js', 'xls', 'py', 'log', 'java', 'sql', 'htaccess', 'md', 'php', 'php3', 'php4', 'php5'];
File.AUDIO_TYPE = ['oga', 'spx', 'wav', 'mp3', 'midi', 'mid', 'flac', 'axa'];
File.VIDEO_TYPE = ['ogg', 'ogv', 'wmv', 'mov', 'flv', 'mp4', 'mpg', 'mpeg', 'avi', 'axv', 'qt', 'mng', 'mkv', 'yuv', 'drc', 'asf', 'm4v', 'mpv', 'mp2'];
File.IMAGE_TYPE = ['png', 'gif', 'jpg', 'bmp', 'jpeg', 'svg', 'bpg', 'tiff', 'rif', ', webp'];        
File.APPLICATION_TYPE = ['ogx', 'exe', 'com'];
File.COMPRESS_TYPE = ['zip', 'war', 'rar', 'tar', 'bz2', 'gz', 's7z'];
      


File.prototype._parse = function(line){
    var matches = line.match(/([dsl-]{1})([a-zA-Z-]{9})[\t ]+([0-9]+)[\t ]+([^\t ]+)[\t ]+([^\t ]+)[\t ]+([0-9]+)[\t ]+(.+)/);
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
    var dateMatches = matches[7].match(/([A-Za-z]{3}[ ]{1,2}[0-9]{1,2}[ ]{1,2}[0-9:]{4,5})[ \t]+.*/);
    if (dateMatches && dateMatches.length>1) this.lastModified = dateMatches[1].trim();
    else throw 'Malformed file information line: '+line+' impossible to extract the name from '+matches[7]; 
    this.name = matches[7].substring(this.lastModified.length).trim();    
		var index = this.name.lastIndexOf('.')
        if (this.type == 'FILE' && index >= 0 && index < this.name.length) this.ext = this.name.substring(index + 1).toLowerCase();
        else this.ext = '';
		this.debug(this.type+(this.ext!=''?' ('+this.ext+')':'')+': "'+this.name+'" size: '+this.size);
	}else this.info('Malformed file information line: '+line);
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
        if ($in(File.TEXT_TYPE, this.ext)) className += ' text';
        else if ($in(File.AUDIO_TYPE, this.ext)) className += ' audio';
        else if ($in(File.VIDEO_TYPE, this.ext)) className += ' video';
        else if ($in(File.IMAGE_TYPE, this.ext)) className += ' image'; 
        else if ($in(File.APPLICATION_TYPE, this.ext)) className += ' application';
        else if ($in(File.COMPRESS_TYPE, this.ext)) className += ' compress';
        
        if ($in(['html', 'htm'], this.ext)) className += ' xml, html';
        else if (this.ext == 'xml') className += ' xml';
        else if (this.ext == 'xml') className += ' css';
        else if (this.ext == 'xls') className += ' excel';
        else if (this.ext == 'py') className += ' python';
        else if (this.ext == 'js') className += ' javascript';
        else if (this.ext == 'key') className += ' key';
        
        return className;
    }else if (this.type == 'FOLDER') return 'folder';
    else if (this.type == 'SOCKET') return 'socket';
    else if (this.type == 'LINK') return 'link';
    return '';
}


