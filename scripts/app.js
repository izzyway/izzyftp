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
	document.$get('title').$addClass('hidden');
	document.$get('aboutpopup').$addClass('hidden');
	document.$get('data').$removeClass('hidden');
	document.$get('raw').$addClass('hidden');
	document.$get('error').$addClass('hidden');
	document.$get('header').$removeClass('hidden');
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
    ftp.disconnect();
    ftp.reset();
}

function raw(){
    if (document.$get('raw').$hasClass('hidden')){
        document.$get('raw').$removeClass('hidden');
        document.$get('data').$addClass('hidden');
        document.$get('image').$addClass('hidden');
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
}

function imageclose(){
    document.$get('imageopen').$addClass('hidden');
    document.$get('data').$removeClass('hidden');
}

function filesave(){
    ftp.saveFile();
}

function about(){
    var about = document.$get('aboutpopup');
    if (about.$hasClass('hidden')){
        about.$removeClass('hidden');
    }else{
        about.$addClass('hidden');
    }
}
function reportbug(){
    var report = document.$get('raw').innerHTML;
    report = report.replace(/USER [^\n]+/g, 'USER ******');
    report = report.replace(/Connected to [^\n]+/g, 'Connected to ......');
    report = 'data='+report;
    $POST('http://firefox.izzyway.com/bug.php',
        {   data:report,
            headers:{'Content-Type':'application/x-www-form-urlencoded'},
            success: function(data, code){$log(data);document.$get('thanks').$removeClass('hidden').innerHTML='Thanks'; document.$get('bug').$addClass('hidden'); },
            error: function(data, code){document.$get('thanks').$removeClass('hidden').innerHTML='Error code '+code; document.$get('bug').$addClass('hidden'); }
        });
}