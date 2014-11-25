document.$get('connect').addEventListener('click', connect, false);
document.$get('viewraw').addEventListener('click', raw, false);
document.$get('disconnect').addEventListener('click', disconnect, false);
document.$get('filesave').addEventListener('click', filesave, false);
document.$get('filecancel').addEventListener('click', filecancel, false);
document.$get('imageclose').addEventListener('click', imageclose, false);
document.$get('reload').addEventListener('click', reload, false);
document.$get('about').addEventListener('click', about, false);
document.$get('bug').addEventListener('click', reportbug, false);

$include('scripts/display.js');
$include('scripts/ftpclient.js');

var ftp;

function connect(){
	var host = document.$get('host').value;
	var port = document.$get('port').value;
	var login = document.$get('login').value;
	var password = document.$get('password').value;
	document.$get('connection').$addClass('hidden');
	document.$get('path').innerHTML = '';
	document.$get('title').$addClass('hidden');
	document.$get('aboutpopup').$addClass('hidden');
	document.$get('data').$removeClass('hidden');
	document.$get('raw').$addClass('hidden');
	document.$get('error').$addClass('hidden');
	document.$get('header').$removeClass('hidden');
	imageclose();
	filecancel();
	var display = new Display('display', 'raw', 'path');
    display.clearAll();
	ftp = new FTPClient(display, host, port, login, password);
	ftp.connect();
}
function disconnect(){
    document.$get('login').value = '';
    document.$get('password').value = '';
    document.$get('data').$addClass('hidden');
    document.$get('header').$addClass('hidden');
    document.$get('raw').$addClass('hidden');
    document.$get('error').$addClass('hidden');
    document.$get('thanks').$addClass('hidden');
    document.$get('bug').$removeClass('hidden');
    document.$get('aboutpopup').$addClass('hidden');
    document.$get('fileopen').$addClass('hidden');
    document.$get('title').$removeClass('hidden');
    document.$get('connection').$removeClass('hidden');
    document.$get('viewraw').innerHTML = 'Raw';
    ftp.disconnect();
    ftp.reset();
}

function raw(){
    if (document.$get('raw').$hasClass('hidden')){
        document.$get('raw').$removeClass('hidden');
        document.$get('data').$addClass('hidden');
        document.$get('imageopen').$addClass('hidden');
        document.$get('fileopen').$addClass('hidden');
        document.$get('viewraw').innerHTML = 'Data';
    }else{
        document.$get('raw').$addClass('hidden');
        document.$get('data').$removeClass('hidden');
        document.$get('viewraw').innerHTML = 'Raw';
    }
    document.$get('aboutpopup').$addClass('hidden');
}
function reload(){
    ftp.reload();
}

function filecancel(){
    document.$get('fileopen').$addClass('hidden');
    document.$get('data').$removeClass('hidden');
    activebutton();
}

function imageclose(){
    document.$get('imageopen').$addClass('hidden');
    document.$get('data').$removeClass('hidden');
    activebutton();
}

function filesave(){
    ftp.saveFile();
}

function about(){
    var about = document.$get('aboutpopup');
    var buttons = document.getElementsByTagName('button');
    if (about.$hasClass('hidden')){
        about.$removeClass('hidden');
        for (var index = 0; index < buttons.length; index++){
            var button = buttons[index];
            if (button.id != 'about') button.$set('disabled', true);
        }
    }else{
        about.$addClass('hidden');
        for (var index = 0; index < buttons.length; index++){
            buttons[index].$unset('disabled');
        }
    }
}
function reportbug(){
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
function unactivebutton(){
    document.$get('viewraw').$set('disabled', true);
    document.$get('reload').$set('disabled', true);
}
function activebutton(){
    document.$get('viewraw').$unset('disabled');
    document.$get('reload').$unset('disabled');
}