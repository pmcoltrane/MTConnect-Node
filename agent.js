var Document = require('./document.js').Document;
var DOMParser = require("xmldom").DOMParser;
var XMLSerializer = require("xmldom").XMLSerializer;
var extend = require('xtend');
var fs = require("fs");
var http = require('http');
var url = require('url');

exports.Agent = function Agent(configuration){

	// Load configuration
	this.configuration = {
		sender: 'mtconnect-node',
		version: '1.2.0.0',
		bufferSize: 0,
		port: 8080,
		devicesFile: 'probe.xml',
		adaptersFile: 'adapters.xml'
	}	
	if(configuration!=null) extend(this.configuration, configuration);
	
	this.sender = this.configuration.sender;
	this.instanceId = this._generateInstanceId();
	this.version = this.configuration.version;
	this.bufferSize = this.configuration.bufferSize;
	
	this.port = this.configuration.port;
	
	this.document = new Document(this.sender, this.instanceId, this.version, this.bufferSize);
	
	// Data Item setup
	this.store = {};
	this.firstSequence = 0;
	this.nextSequence = 1;
	
	
	// Load devices
	var me = this;
	
	this.devices = null;
	this.loadDevices(this.configuration.devicesFile, function(error, data){
		me.devices = (error===null) ? data : null;
	});
	
	// Load adapters
	this.adapters = this.loadAdapters(this.configuration.adaptersFile, function(error, data){
		me.adapters = (error===null) ? data : null;
	});
}

/* INITIALIZATION
 * Functionality related to initialization
 */

exports.Agent.prototype.loadDevices = function loadDevices(filename, callback){
	fs.readFile(filename, 'utf8', function _load(error, data){
		if(error){
			callback(error, null);
		}
		else{
			try{
				probeText = data;
				probeXmlDocument = new DOMParser().parseFromString(data, 'text/xml');
				callback(null, probeXmlDocument);
			}
			catch(e){
				callback(e, null);
			}
		}
	});
}

exports.Agent.prototype.loadAdapters = function loadAdapters(filename){
	//TODO: load adapters
}

/* SERVER
 * Functionality related to serving HTTP requests and responses.
 */

exports.Agent.prototype.listen = function listen(){
	var me = this;
	http.createServer(function requestWorker(request, response){
		var client = me._makeClient(request, response);

		if( (client.path===null) || (client.path.length==0) ){
			console.log('PROBE');
			me.probe(client);
		}
		else{
			console.log('UNKNOWN');
			me.errors(client, ['INVALID_REQUEST']);
		}
	}).listen(this.port);
}
 
exports.Agent.prototype.probe = function probe(client){
	var doc = this.document.devicesDocument(this.devices);

	client.response.writeHead(
		200, 
		{
			'Content-Type': 'application/xml',
			'Access-Control-Allow-Origin': '*'
		}
	);
	client.response.write(doc);
	client.response.end();
}

exports.Agent.prototype.errors = function errors(client, errors){
	var doc = this.document.errorsDocument(errors);
	
	client.response.writeHead(
		200,
		{
			'Content-Type': 'application/xml',
			'Access-Control-Allow-Origin': '*'
		}
	);
	client.response.write(doc);
	client.response.end();
}


/* HELPERS
 * Convenience functionality.
 */

exports.Agent.prototype.fetchIds = function fetchIds(xpath){
	if(this.devices===null) return null;
	
	//TODO: process xpath
	var items = this.devices.getElementsByTagName('DataItem');
	var ret = [];
	for( var i=0; i<items.length; i++ ){
		var item = items[i];
		ret.push(item.getAttribute('id'));
	}
	
	return ret;
}

exports.Agent.prototype.fetchItem = function fetchItem(id){
	if(this.devices===null) return null;
	
	return this.devices.getElementById(id);
}

exports.Agent.prototype._getRandomInt = function _getRandomInt(min, max){
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

exports.Agent.prototype._generateInstanceId = function _generateInstanceId(){
	return this._getRandomInt(0, 4294967295);
}

exports.Agent.prototype._makeClient = function _makeClient(request, response){
	var parsedUrl = url.parse(request.url, true);
	var pathname = parsedUrl.pathname.substring(1);
	var query = parsedUrl.query;
	
	return {
		url: parsedUrl,
		path: pathname,
		query: query,
		request: request,
		response: response
	}
}