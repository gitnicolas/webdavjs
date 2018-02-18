'use strict';

function WebDAVClient(url, user, password) {
	this.url = url;
	this.user = user;
	this.password = password;

	this.request = function (method, url, user, password, headers, data, callback) {
		var methods = ['DELETE', 'GET', 'MKCOL', 'PATCH', 'PROPFIND', 'PUT'];

		var request = new XMLHttpRequest();
		if (methods.indexOf(method) === -1) throw new Error('unknown method name');
		if (callback && typeof callback === 'function') request.onreadystatechange = (function (request, callback) {
			return function () {
				if (request.readyState === XMLHttpRequest.DONE) {
					if (request.status >= 200 && request.status < 300) callback(request);
					else throw new Error('response with error status: ' + request.status);
				}
			};
		})(request, callback);
		request.open(method, url, true, user, password);
		if (headers && typeof headers === 'object') {
			var keys = Object.keys(headers);
			for (var i = 0, length = keys.length; i < length; i++) request.setRequestHeader(keys[i], headers[keys[i]]);
		}
		request.send(data);
	};

	this.delete = function (uri, callback) {
		return this.request('DELETE', this.url + uri, this.user, this.password, null, null, callback);
	};

	this.get = function (uri, callback) {
		return this.request('GET', this.url + uri, this.user, this.password, null, null, callback);
	};

	this.mkcol = function (uri, callback) {
		return this.request('MKCOL', this.url + uri, this.user, this.password, null, null, callback);
	};

	this.propfind = function (uri, callback) {
		return this.request('PROPFIND', this.url + uri, this.user, this.password, {Depth: '1'}, null, callback);
	};

	this.put = function (uri, data, callback) {
		return this.request('PUT', this.url + uri, this.user, this.password, null, data, callback);
	};
}
