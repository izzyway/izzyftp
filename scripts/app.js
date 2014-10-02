
document.getElementById('connect').addEventListener('click', connect, false);

$include('scripts/display.js');
$include('scripts/ftpclient.js');

function connect(){
	var host = document.getElementById('host').value;
	var port = document.getElementById('port').value;
	var login = document.getElementById('login').value;
	var password = document.getElementById('password').value;
	
	var display = new Display('display');

	var ftp = new FTPClient(display, host, port, login, password);
	ftp.connect();
}
