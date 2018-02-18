'use strict';

function readFiles(me) {
	var result = '';
	var files = me.files;
	var length = files.length;
	var i, file;
	for (i = 0; i < length; i++) {
		file = files[i];
		result += 'File [' + i + '] name: [' + file.name + '] type: [' + file.type + '] size: [' + file.size + '] bytes\n';
	}
	document.getElementById('result').innerText = result;
}

function consoleLog(request) {
	console.log('Response Status: %d [%s]', request.status, request.statusText);
	var type = request.responseType || 'text';
	var contentType = request.getResponseHeader('Content-Type');
	var length, head;
	switch (type) {
		case 'arraybuffer':
			length = request.response.byteLength;
			head = 'Array cells';
			break;
		case 'blob':
			length = request.response.size;
			head = 'Blob bytes';
			break;
		case 'document':
		case 'json':
			length = request.responseText.length;
			head = request.responseText.substr(0, 1536);
			break;
		default:
			length = request.response.length;
			head = request.response.substr(0, 1536);
	}
	console.log('Response Type: %s,  Content-Type: %s, Length: %d', type, contentType, length);
	console.log('Response Start: %s', head);
}

function testDelete() {
	console.log('Performing DELETE ...');
	var webDAVClient = new WebDAVClient(document.querySelector('input[name="url"]').value, document.querySelector('input[name="user"]').value, document.querySelector('input[name="password"]').value);
	webDAVClient.delete('Test/', consoleLog);
}

function testGet() {
	console.log('Performing GET ...');
	var webDAVClient = new WebDAVClient(document.querySelector('input[name="url"]').value, document.querySelector('input[name="user"]').value, document.querySelector('input[name="password"]').value);
	webDAVClient.get('Nicolas.json', consoleLog);
}

function testMkcol() {
	console.log('Performing MKCOL ...');
	var webDAVClient = new WebDAVClient(document.querySelector('input[name="url"]').value, document.querySelector('input[name="user"]').value, document.querySelector('input[name="password"]').value);
	webDAVClient.mkcol('Test/', consoleLog);
}

function testPropfind() {
	console.log('Performing PROPFIND ...');
	var webDAVClient = new WebDAVClient(document.querySelector('input[name="url"]').value, document.querySelector('input[name="user"]').value, document.querySelector('input[name="password"]').value);
	webDAVClient.propfind('', consoleLog);
}

function testPut() {
	console.log('Performing PUT ...');
	var webDAVClient = new WebDAVClient(document.querySelector('input[name="url"]').value, document.querySelector('input[name="user"]').value, document.querySelector('input[name="password"]').value);
	webDAVClient.put('Test/Test.txt', 'Test string for text file', consoleLog);
}

function testPutFiles() {
	console.log('Performing PUT of Files ...');
	var webDAVClient = new WebDAVClient(document.querySelector('input[name="url"]').value, document.querySelector('input[name="user"]').value, document.querySelector('input[name="password"]').value);
	var files = document.querySelector('input[name="files"]').files;
	var length = files.length;
	var i, file;
	for (i = 0; i < length; i++) {
		file = files[i];
		webDAVClient.put('Test/' + file.name, file, consoleLog);
	}
}
