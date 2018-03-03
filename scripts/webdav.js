'use strict';

function WebDAVClient(url, user, password) {
	this.url = url;
	this.user = user;
	this.password = password;

	this.request = function (method, url, user, password, headers, data, callback) {
		var methods = ['COPY', 'DELETE', 'GET', 'MKCOL', 'MOVE', 'PROPFIND', 'PUT'];

		var request = new XMLHttpRequest();
		if (methods.indexOf(method) === -1) throw new Error('unknown method name');
		if (typeof callback === 'function') request.onreadystatechange = (function (request, callback) {
			return function () {
				if (request.readyState === XMLHttpRequest.DONE) {
					if (request.status >= 200 && request.status < 300) callback(request);
					else throw new Error('response with error status: ' + request.status + ' (' + request.statusText + ')');
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

	this.copy = function (uri, callback, destination, overwrite, depth) {
		if (!destination || typeof destination !== 'string') throw new Error('copy destination missing');
		var headers = {Destination: destination};
		if (overwrite === 'T' || overwrite === 'F') headers['Overwrite'] = overwrite;
		if (depth === 'infinity' || depth === 0) headers['Depth'] = depth;
		this.request('COPY', this.url + uri, this.user, this.password, headers, undefined, callback);
	};

	this.delete = function (uri, callback) {
		this.request('DELETE', this.url + uri, this.user, this.password, undefined, undefined, callback);
	};

	this.get = function (uri, callback) {
		this.request('GET', this.url + uri, this.user, this.password, undefined, undefined, callback);
	};

	this.mkcol = function (uri, callback) {
		this.request('MKCOL', this.url + uri, this.user, this.password, undefined, undefined, callback);
	};

	this.move = function (uri, callback, destination, overwrite, depth) {
		if (!destination || typeof destination !== 'string') throw new Error('copy destination missing');
		var headers = {Destination: destination};
		if (overwrite === 'T' || overwrite === 'F') headers['Overwrite'] = overwrite;
		if (depth === 'infinity') headers['Depth'] = depth;
		this.request('MOVE', this.url + uri, this.user, this.password, headers, undefined, callback);
	};

	this.propfind = function (uri, callback, depth) {
		var headers = (depth === 'infinity' || depth === 1 || depth === 0) ? {Depth: depth} : undefined;
		this.request('PROPFIND', this.url + uri, this.user, this.password, headers, undefined, callback);
	};

	this.patch = function (uri, callback, blob, start) {
		if (typeof start !== 'number' || start < 0) start = 0;
		var headers = {'Content-Range': 'bytes ' + start + '-' + (start + blob.size - 1) + '/*'};
		this.request('PUT', this.url + uri, this.user, this.password, headers, blob, callback);
	};

	this.put = function (uri, callback, blob) {
		this.request('PUT', this.url + uri, this.user, this.password, undefined, blob, callback);
	};

	this.burst = function (uri, callback, blob, start, length) {
		var size = blob.size;
		if (typeof start !== 'number') start = 0;
		if (start >= size) return;
		if (start < 0) start = Math.max(size + start, 0);
		var end = (typeof length === 'number' && length > 0) ? Math.min(start + length, size) : size;
		var headers = {'Content-Range': 'bytes ' + start + '-' + (end - 1) + '/' + size};
		var chunk = blob.slice(start, end, blob.type);
		var next = (function (me, uri, callback, blob, start, length) {
			return function (request) {
				callback(request);
				me.burst(uri, callback, blob, start, length);
			};
		})(this, uri, callback, blob, end, length);
		this.request('PUT', this.url + uri, this.user, this.password, headers, chunk, next);
	};

	this.list = function (uri, callback) {
		var listCallback = (function (callback) {
			return function (request) {
				var contentType = request.getResponseHeader('Content-Type');
				if (contentType.indexOf('text/xml') === -1 && contentType.indexOf('application/xml') === -1) throw new Error('PROPFIND did not return an XML document, but:' + contentType);
				var entries = request.responseXML.documentElement.children;
				var length = entries.length;
				var prefix = entries[0].getElementsByTagName('D:href')[0].firstChild.nodeValue.length;
				var i, entry, properties, item, attributes, creation, modification, size, type;
				var items = [];
				for (i = 1; i < length; i++) {
					entry = entries[i];
					properties = entry.getElementsByTagName('D:prop')[0];
					item = {};
					if ((attributes = properties.getElementsByTagName('lp2:executable')).length) item.attributes = (attributes[0].firstChild.nodeValue === 'T') ? 'X' : '-';
					if ((creation = properties.getElementsByTagName('lp1:creationdate')).length) item.creation = (new Date(creation[0].firstChild.nodeValue)).toJSON();
					item.directory = (properties.getElementsByTagName('D:collection').length > 0);
					if ((modification = properties.getElementsByTagName('lp1:getlastmodified')).length) item.modification = (new Date(modification[0].firstChild.nodeValue)).toJSON();
					item.name = entry.getElementsByTagName('D:href')[0].firstChild.nodeValue.substr(prefix);
					if (item.directory) item.name = item.name.replace(/\/$/, '');
					else item.extension = item.name.replace(/^.*\.(.*)$/, '$1');
					if ((size = properties.getElementsByTagName('lp1:getcontentlength')).length) item.size = size[0].firstChild.nodeValue;
					if ((type = properties.getElementsByTagName('D:getcontenttype')).length) item.type = type[0].firstChild.nodeValue;
					items.push(item);
				}
				callback(items);
			};
		})(callback);
		this.propfind(uri, listCallback, 1);
	};
}
