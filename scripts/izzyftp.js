document.$get('menu').addEventListener('click', menu, false);
document.$get('connect').addEventListener('click', connect, false);
document.$get('about').addEventListener('click', about, false);
document.$get('viewraw').addEventListener('click', raw, false);
document.$get('disconnect').addEventListener('click', disconnect, false);
document.$get('reload').addEventListener('click', reload, false);
document.$get('save').addEventListener('click', save, false);
document.$get('close').addEventListener('click', close, false);
document.$get('fit').addEventListener('click', fit, false);
document.$get('back').addEventListener('click', back, false);
document.$get('report').addEventListener('click', report, false);
document.$get('upload').addEventListener('click', upload, false);
document.$get('uploadclose').addEventListener('click', uploadClose, false);
document.$get('uploadaction').addEventListener('click', uploadFile, false);
document.$get('new').addEventListener('click', newFile, false);
document.$get('newfilecancel').addEventListener('click', newFileCancel, false);
document.$get('newfolder').addEventListener('click', newFolder, false);
document.$get('newtextfile').addEventListener('click', newTextFile, false);
document.$get('fileclose').addEventListener('click', closeFilePopup, false);
document.$get('filerename').addEventListener('click', renameFile, false);
document.$get('fileopen').addEventListener('click', openFile, false);
document.$get('filedelete').addEventListener('click', deleteFile, false);
document.$get('filedownload').addEventListener('click', downloadFile, false);
document.$get('aysno').addEventListener('click', areYouSureClose, false);
document.$get('aysyes').addEventListener('click', areYouSureYes, false);

$include('scripts/display.js');
$include('scripts/ftpclient.js');

var ftp;
var display;
var file;

function menu(){
    var menu = document.$get('menupopup');
    if (menu.$hasClass('hidden')) menu.$removeClass('hidden');
    else menu.$addClass('hidden');
}
function connect(){
    document.$get('menupopup').$addClass('hidden');
    document.$get('connection').$addClass('hidden');
    document.$get('aboutpopup').$addClass('hidden');
    document.$get('errorpopup').$addClass('hidden');
    document.$get('screen').$removeClass('hidden');
    document.$get('file').$addClass('hidden');
    document.$get('display').$removeClass('hidden');
    document.$get('viewraw').innerHTML = 'View raw';
    document.$get('raw').$addClass('hidden');
    document.$get('uploadpopup').$addClass('hidden');
    document.$get('newfilepopup').$addClass('hidden');
    document.$get('filepopup').$addClass('hidden');
    document.$get('ayspopup').$addClass('hidden');
    document.$get('modal').$addClass('hidden');
    var host = document.$get('host').value;
    var port = document.$get('port').value;
    var login = document.$get('login').value;
    var password = document.$get('password').value;
	display = new Display();
    display.clearAll();
	ftp = new FTPClient(display, host, port, login, password);
	ftp.connect();
}
function about(){
    var about = document.$get('aboutpopup');
    if (about.$hasClass('hidden')) about.$removeClass('hidden');
    else about.$addClass('hidden');
}
function raw(){
    var raw = document.$get('raw');
    var screen = document.$get('screen');
    var button = document.$get('viewraw');
    if (raw.$hasClass('hidden')){
        screen.$addClass('hidden');
        button.innerHTML = 'View data';
        raw.$removeClass('hidden');
        document.$get('file').$addClass('hidden');
    }else{
        raw.$addClass('hidden');
        button.innerHTML = 'View raw';
        screen.$removeClass('hidden');
    }
    menu();
}
function disconnect(){
    document.$get('login').value = '';
    document.$get('password').value = '';
    document.$get('viewraw').innerHTML = 'Raw';
    back();
    ftp.disconnect();
    ftp.reset();
}
function back(){
    document.$get('display').$addClass('hidden');
    document.$get('connection').$removeClass('hidden');
}
function reload(){
    ftp.reload();
    menu();
}
function save(){
    ftp.saveTextFile(document.$get('filecontent').value);
}
function close(){
    document.$get('file').$addClass('hidden');
    document.$get('screen').$removeClass('hidden');
    ftp.setPath();
}
function fit(){
    var img = document.$get('img');
    if (img.$hasClass('fitted')){
        img.$removeClass('fitted');
        document.$get('fit').innerHTML = 'Fit';
    }else{
        img.$addClass('fitted')
        document.$get('fit').innerHTML = 'Unfit';
    }
}
function report(){
    var report = document.$get('raw').innerHTML;
    report = report.replace(/USER [^<]+/g, 'USER ******');
    report = report.replace(/Connected to [^<]+/g, 'Connected to ......');
    report = report.replace(/User [^<]+ log/g, 'User ****** log');
    report = report.replace(/Password required for [^<]+/g, 'Password required for *******.');
    report = 'data='+report;
    $POST('http://izzyway.free.fr/firefox/bug.php',
        {   data:report,
            headers:{'Content-Type':'application/x-www-form-urlencoded'},
            success: function(data, code){$log(data);document.$get('thanks').$removeClass('hidden').innerHTML='Thanks'; document.$get('bug').$addClass('hidden'); },
            error: function(data, code){document.$get('thanks').$removeClass('hidden').innerHTML='Error code '+code; document.$get('bug').$addClass('hidden'); }
        });
}
function upload(){
    file = null;
    var pickImageActivity = new MozActivity({name: "pick", data: {type: ["image/*"]}});
    pickImageActivity.onsuccess = function() {
        file = this.result.blob;
        $log("Pick the file "+file.name);
        document.$get('uploadfile').value = file.name + ' (' +File.formatSize(file.size) + ')';
        var name = file.name;
        var index = name.lastIndexOf('/');
        if (index > 0) name = name.substring(index + 1);
        document.$get('uploadname').value = name;
        document.$get('uploaddirectory').value = ftp.path;
        document.$get('menupopup').$addClass('hidden');
        document.$get('uploadpopup').$removeClass('hidden');
    };
    pickImageActivity.onerror = function() {
        $log(this.result);
    };
}
function uploadClose(){
    document.$get('uploadpopup').$addClass('hidden');
}
function uploadFile(){
    if (file && ftp){
        var fileDirectory = document.$get('uploaddirectory').value;
        var fileName = document.$get('uploadname').value;
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
    document.$get('uploadpopup').$addClass('hidden');
    document.$get('menupopup').$addClass('hidden');
    document.$get('aboutpopup').$addClass('hidden');
    document.$get('errorpopup').$addClass('hidden');
    document.$get('newfilepopup').$removeClass('hidden');
}
function newFileCancel(){
    document.$get('newfilepopup').$addClass('hidden');
}
function newFolder(){
    var name = document.$get('newfilename').value.trim();
    if (name != ''){
       ftp.createFolder(name);
    } 
    document.$get('newfilepopup').$addClass('hidden');
}
function newTextFile(){
    var name = document.$get('newfilename').value.trim();
    if (name != ''){
       ftp.createTextFile(name);
    }
    document.$get('newfilepopup').$addClass('hidden');
}
function setFile(f){
    file = f;
}
function closeFilePopup(){
    modal(false);
    document.$get('filepopup').$addClass('hidden');
}
function openFile(){
    ftp.openFile(file);
    closeFilePopup();
}
function deleteFile(){
    document.$get('ayspopup').$removeClass('hidden');
    closeFilePopup();
    modal(true);
    document.$get('aysfilename').innerHTML = file.name;
    document.$get('aysfiletype').innerHTML = file.type.toLowerCase();
}
function renameFile(){
    var newName = document.$get('filename').value;
    if (newName != file.name){
        ftp.rename(file, newName);
    }
}
function areYouSureClose(){
    document.$get('ayspopup').$addClass('hidden');
    modal(false);
}
function areYouSureYes(){
    areYouSureClose();
    ftp.deleteFile(file);
}
function modal(b){
    if (!b) document.$get('modal').$addClass('hidden');
    else document.$get('modal').$removeClass('hidden');
}
function downloadFile(){
    
}