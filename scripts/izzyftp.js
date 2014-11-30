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

$include('scripts/display.js');
$include('scripts/ftpclient.js');

var ftp;

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
    var host = document.$get('host').value;
    var port = document.$get('port').value;
    var login = document.$get('login').value;
    var password = document.$get('password').value;
	var display = new Display();
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
    ftp.saveFile(document.$get('filecontent').value);
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
