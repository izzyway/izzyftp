
document.$get('connect').addEventListener('click', connect, false);
document.$get('viewraw').addEventListener('click', raw, false);

$include('scripts/display.js');
$include('scripts/ftpclient.js');

function connect(){
	var host = document.$get('host').value;
	var port = document.$get('port').value;
	var login = document.$get('login').value;
	var password = document.$get('password').value;
	
	var display = new Display('display', 'raw', 'path');
    display.clearAll();
	var ftp = new FTPClient(display, host, port, login, password);
	ftp.connect();
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
