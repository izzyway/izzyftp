
document.$get('connect').addEventListener('click', connect, false);
document.$get('viewraw').addEventListener('click', raw, false);
document.$get('disconnect').addEventListener('click', disconnect, false);

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
	document.$get('data').$removeClass('hidden');
	document.$get('header').$removeClass('hidden');
	var display = new Display('display', 'raw', 'path');
    display.clearAll();
	ftp = new FTPClient(display, host, port, login, password);
	ftp.connect();
}
function disconnect(){
	document.$get('data').$addClass('hidden');
    document.$get('header').$addClass('hidden');
    document.$get('raw').$addClass('hidden');
    document.$get('title').$removeClass('hidden');
    document.$get('connection').$removeClass('hidden');
    ftp.disconnect();
}

function raw(){
    if (document.$get('raw').$hasClass('hidden')){
        document.$get('raw').$removeClass('hidden');
        document.$get('data').$addClass('hidden');
        document.$get('viewraw').innerHTML = 'View data';
    }else{
        document.$get('raw').$addClass('hidden');
        document.$get('data').$removeClass('hidden');
        document.$get('viewraw').innerHTML = 'View raw';
    }
}
