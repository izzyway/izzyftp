String.prototype.hash = function() {
  var hash = 0, i, chr, len;
  if (this.length == 0) return hash;
  for (i = 0, len = this.length; i < len; i++) {
    chr   = this.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return 'X' + hash;
}


$get('menu').addEventListener('click', menu, false);
$get('connect').addEventListener('click', connect, false);
$get('about').addEventListener('click', about, false);
$get('viewraw').addEventListener('click', raw, false);
$get('disconnect').addEventListener('click', disconnect, false);
$get('reload').addEventListener('click', reload, false);
$get('save').addEventListener('click', save, false);
$get('close').addEventListener('click', close, false);
$get('fit').addEventListener('click', fit, false);
$get('back').addEventListener('click', back, false);
$get('report').addEventListener('click', report, false);
$get('upload').addEventListener('click', upload, false);
$get('uploadclose').addEventListener('click', uploadClose, false);
$get('uploadaction').addEventListener('click', uploadFile, false);
$get('new').addEventListener('click', newFile, false);
$get('newfilecancel').addEventListener('click', newFileCancel, false);
$get('newfolder').addEventListener('click', newFolder, false);
$get('newtextfile').addEventListener('click', newTextFile, false);
$get('fileclose').addEventListener('click', closeFilePopup, false);
$get('filerename').addEventListener('click', renameFile, false);
$get('fileopen').addEventListener('click', openFile, false);
$get('filedelete').addEventListener('click', deleteFile, false);
$get('filedownload').addEventListener('click', downloadFile, false);
$get('aysno').addEventListener('click', areYouSureClose, false);
$get('aysyes').addEventListener('click', areYouSureYes, false);
$get('closereport').addEventListener('click', closeErrorReport, false);
$get('initkey').addEventListener('click', initEntry, false);
$get('aboutpopup').addEventListener('click', about, false);
window.addEventListener('scroll', scroll, false);

$include('scripts/display.js');
$include('scripts/ftpclient.js');

var ftp;
var display;
var file;
var keychain = {};

function menu(){
    var menu = $get('menupopup');
    if (menu.hasClass('hidden')) menu.removeClass('hidden');
    else menu.addClass('hidden');
}
function connect(){
    var host = $get('host').value;
    var port = $get('port').value;
    var login = $get('login').value;
    var password = $get('password').value;
    
    $get('menupopup').addClass('hidden');
    $get('connection').addClass('hidden');
    $get('aboutpopup').addClass('hidden');
    $get('errorpopup').addClass('hidden');
    $get('screen').removeClass('hidden');
    $get('file').addClass('hidden');
    $get('display').removeClass('hidden');
    $get('viewraw').innerHTML = 'View raw';
    $get('raw').addClass('hidden');
    $get('uploadpopup').addClass('hidden');
    $get('newfilepopup').addClass('hidden');
    $get('filepopup').addClass('hidden');
    $get('ayspopup').addClass('hidden');
    $get('modal').addClass('hidden');
    
	  display = new Display();
    display.clearAll();
	  ftp = new FTPClient(display, host, port, login, password);
	  ftp.connect();
    if ($get('savekeychain').getValue()){
        addEntry(host, port, login, password, false);
    }
}
function about(){
    var about = $get('aboutpopup');
    if (about.hasClass('hidden')) about.removeClass('hidden');
    else about.addClass('hidden');
}
function raw(){
    var raw = $get('raw');
    var screen = $get('screen');
    var button = $get('viewraw');
    if (raw.hasClass('hidden')){
        screen.addClass('hidden');
        button.innerHTML = 'View data';
        raw.removeClass('hidden');
        $get('file').addClass('hidden');
    }else{
        raw.addClass('hidden');
        button.innerHTML = 'View raw';
        screen.removeClass('hidden');
    }
    menu();
}
function disconnect(){
    $get('login').value = '';
    $get('password').value = '';
    $get('viewraw').innerHTML = 'Raw';
    back();
    ftp.disconnect();
    ftp.reset();
}
function back(){
    $get('display').addClass('hidden');
    $get('connection').removeClass('hidden');
}
function reload(){
    ftp.reload();
    menu();
}
function save(){
    ftp.saveTextFile($get('filecontent').value);
}
function close(){
    $get('file').addClass('hidden');
    $get('screen').removeClass('hidden');
    ftp.setPath();
}
function fit(){
    var img = $get('img');
    if (img.hasClass('fitted')){
        img.removeClass('fitted');
        $get('fit').innerHTML = 'Fit';
    }else{
        img.addClass('fitted')
        $get('fit').innerHTML = 'Unfit';
    }
}
function report(){
    var report = $get('raw').innerHTML;
    report = report.replace(/USER [^<]+/g, 'USER ******');
    report = report.replace(/Connected to [^<]+/g, 'Connected to ......');
    report = report.replace(/User [^<]+ log/g, 'User ****** log');
    report = report.replace(/Password required for [^<]+/g, 'Password required for *******.');
    report = 'data='+report;
    $POST('http://izzyway.free.fr/firefox/bug.php',
        {   data:report,
            headers:{'Content-Type':'application/x-www-form-urlencoded'},
            success: function(data, code){$log(data);$get('thanks').removeClass('hidden').innerHTML='Thanks'; $get('report').addClass('hidden'); },
            error: function(data, code){$get('thanks').removeClass('hidden').innerHTML='Error code '+code; $get('report').addClass('hidden'); }
        });
}
function upload(){
    file = null;
    var pickImageActivity = new MozActivity({name: "pick", data: {type: ["image/*"]}});
    pickImageActivity.onsuccess = function() {
        file = this.result.blob;
        $log("Pick the file "+file.name);
        $get('uploadfile').value = file.name + ' (' +File.formatSize(file.size) + ')';
        var name = file.name;
        var index = name.lastIndexOf('/');
        if (index > 0) name = name.substring(index + 1);
        $get('uploadname').value = name;
        $get('uploaddirectory').value = ftp.path;
        $get('menupopup').addClass('hidden');
        $get('uploadpopup').removeClass('hidden');
    };
    pickImageActivity.onerror = function() {
        $log(this.result);
    };
}
function uploadClose(){
    $get('uploadpopup').addClass('hidden');
}
function uploadFile(){
    if (file && ftp){
        var fileDirectory = $get('uploaddirectory').value;
        var fileName = $get('uploadname').value;
        if (fileDirectory != ftp.path){
            ftp.catch(
                function(){
                    ftp.CWD(fileDirectory);
                },
                function(){
                    ftp.debug('Directory doesn\'t exists?');
                    ftp.MKD(fileDirectory);  
                });
                ftp.uploadFile(fileName, file);
        }else{
           ftp.uploadFile(fileName, file);
        }
    }
    uploadClose();
}
function newFile(){
    modal(true);
    $get('uploadpopup').addClass('hidden');
    $get('menupopup').addClass('hidden');
    $get('aboutpopup').addClass('hidden');
    $get('errorpopup').addClass('hidden');
    $get('newfilepopup').removeClass('hidden');
}
function newFileCancel(){
    modal(false);
    $get('newfilepopup').addClass('hidden');
}
function newFolder(){
    modal(false);
    var name = $get('newfilename').value.trim();
    if (name != ''){
       ftp.createFolder(name);
    } 
    $get('newfilepopup').addClass('hidden');
}
function newTextFile(){
    modal(false);
    var name = $get('newfilename').value.trim();
    if (name != ''){
       ftp.createTextFile(name);
    }
    $get('newfilepopup').addClass('hidden');
}
function setFile(f){
    file = f;
}
function closeFilePopup(){
    modal(false);
    $get('filepopup').addClass('hidden');
}
function openFile(){
    ftp.openFile(file);
    closeFilePopup();
}
function deleteFile(){
    $get('ayspopup').removeClass('hidden');
    closeFilePopup();
    modal(true);
    $get('aysfilename').innerHTML = file.name;
    $get('aysfiletype').innerHTML = file.type.toLowerCase();
}
function renameFile(){
    var newName = $get('filename').value;
    if (newName != file.name){
        ftp.rename(file, newName);
    }
}
function areYouSureClose(){
    $get('ayspopup').addClass('hidden');
    modal(false);
}
function areYouSureYes(){
    areYouSureClose();
    ftp.deleteFile(file);
}
function modal(b){
    if (!b) $get('modal').addClass('hidden');
    else $get('modal').removeClass('hidden');
}
function downloadFile(){
    var classes = file.getClassNames();
    var storageName;
    var mimeType;
    if (classes.indexOf('image')>=0){
       storageName = 'pictures';
       mimeType = 'image/'+file.ext; 
    }else if (classes.indexOf('audio')>=0){
       storageName = 'music';
       mimeType = 'audio/'+file.ext; 
    }else if (classes.indexOf('video')>=0){
       storageName = 'videos';
       mimeType = 'video/'+file.ext; 
    }    
    closeFilePopup();
    if (storageName && mimeType){
        ftp.downloadFile(file, function(data){
            try{
                var storage = navigator.getDeviceStorage(storageName);
                var blob = new Blob([data], {type: mimeType}); 
                var request = storage.addNamed(blob, file.name);
                request.onsuccess = function () {
                   var name = this.result;
                   $log('File "' + name + '" successfully wrote on the '+storageName+' storage area');
               }

               request.onerror = function () {
                 display.error(-2, this.error.name, 'Unable to write the file in '+storageName);
               }
            }catch(e){
                display.error(-3, e, 'Unable to write the file in '+storageName);
            }
        });
    }else display.error(-4, 'Cannot find appropriate storage' , 'Unable to download file');
}
function closeErrorReport(){
    $get('errorpopup').addClass('hidden');
    modal(false);
}
function initEntry(){
    var value = $get('key').getValue();
    if (value == 'clear'){
        localStorage.setItem('keys', '');
        resetEntry();
    }else{
        var entry = keychain[value];
        if ($isJSONObject(entry)){
            $get('login').value = entry.login;
            $get('password').value = entry.password;
            $get('port').value = entry.port;
            $get('host').value = entry.host;
        }
    }
}
function addEntry(host, port, login, password, load){
    if ($get('key').has('disabled')) promptEntry();
    var label = login + '@' + host + ':' + port;
    var key = label.hash();
    var exists = $isJSONObject(keychain[key]);
    keychain[key] = {'host':host, 'login':login, 'password':password, 'port':port};
    if (!load) {
        var keys = localStorage.getItem('keys');
        var entries = JSON.parse(!keys | keys == ''?'[]':keys.decode());
        entries.push(keychain[key]);
        localStorage.setItem('keys', JSON.stringify(entries).encode());
    }
    if (!exists){
       var option = $new('option', label);
       option.value = key;
       $get('key').insertBefore(option, $get('clearentry'));
    }
}
function scroll(){
    if (display) window.clearTimeout(display.timer);
}

var CLEAR_OPTION = '<option id = "clearentry" value = "clear">Clear all</option>';
function resetEntry(){
    $get('key').set('disabled', 'disabled').innerHTML = '<option>No entry</option>' + CLEAR_OPTION;
}
function promptEntry(){
    $get('key').unset('disabled').innerHTML = '<option>Select an entry</option>' + CLEAR_OPTION;
}

var keys = localStorage.getItem('keys');
if (!keys || keys ==''){
     resetEntry();
}else{
    promptEntry();
    var decoded = keys.decode();
    var entries = JSON.parse(decoded);  
    for (var index = 0; index < entries.length; index++){
        var entry = entries[index];
        addEntry(entry.host, entry.port, entry.login, entry.password, true);        
    }
}