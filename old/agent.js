var Document = require('./document.js').Document;
var DOMParser = require("xmldom").DOMParser;
var XMLSerializer = require("xmldom").XMLSerializer;
var async = require('async');
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
		if(error) console.log(error);
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
	var me = this;
	fs.readFile(filename, 'utf8', function _load(error, data){
		if(error){
			callback(error, null);
		}
		else{
			try{
				probeText = data;
				probeXmlDocument = new DOMParser().parseFromString(data, 'text/xml');
				me._parseDevices(probeXmlDocument);
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
		else if(client.path==='current'){
			me.current(client);
		}
		else if(client.path==='sample'){
			me.sample(client);
		}
		else if(client.path==='asset'){
			me.errors(client, ['UNSUPPORTED']);
		}
		else if(client.path==='store'){
			me.save(client);
		}
		else{
			console.log('UNKNOWN: ' + client.path + '.');
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

exports.Agent.prototype.current = function current(client){
	var me = this;
	
	this._fetchCurrent(this.fetchIds(), client.query.at, function(error, data){
		if(error){
			console.log(error);
			return;	//TODO: error doc
		}
		var doc = me.document.streamsDocument(data);
		
		client.response.writeHead(
			200, 
			{
				'Content-Type': 'application/xml',
				'Access-Control-Allow-Origin': '*'
			}
		);
		client.response.write(doc);
		client.response.end();	//FIXME: streaming
	});
	
}

exports.Agent.prototype.sample = function sample(client){
	var me = this;
	this._fetchSample(this.fetchIds(), client.query.from, client.query.count, function(error, data){
		if(error){
			console.log(error);
			return;	//TODO: error doc
		}
		var doc = me.document.streamsDocument(data);
		
		client.response.writeHead(
			200,
			{
				'Content-Type': 'application/xml',
				'Access-Control-Allow-Origin': '*'
			}
		);
		client.response.write(doc);
		client.response.end();	//FIXME: streaming
	});
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

exports.Agent.prototype.save = function save(client){
	var me = this;
	this._storeSamples(client.query, function(error){
		if(error){
			console.log(error);
			return;	//TODO: error doc
		}
		var doc = me.document.storeDocument();
		client.response.writeHead(
			200,
			{
				'Content-Type': 'application/xml',
				'Access-Control-Allow-Origin': '*'
			}
		);
		client.response.write(doc);
		client.response.end();
	});
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

exports.Agent.prototype._fetchCurrent = function _fetchCurrent(ids, at, callback){
	try{
		var atInvalid = (at !== undefined) && (isNaN(at));	//at-parameter invalid if specified but not a number
		var atOutOfRange = (!atInvalid) && (at !== undefined) && ( (at<this.firstSequence) || (at>= this.nextSequence) );	//at-parameter out of range if valid, specified, but not between [firstSequence, nextSequence)
		
		if(atInvalid) callback(['INVALID_REQUEST'], null);
		if(atOutOfRange) callback(['OUT_OF_RANGE'], null);

		var ret = {samples: [], firstSequence: this.firstSequence, lastSequence: this.nextSequence-1, nextSequence: null};
		var me = this;
		async.forEach(
			ids,
			function(id, callback){
				var item = me.store[id];
			
				var index = item.samples.length-1;
				if(index<0){
					callback();	// No samples, skip to next.
					return;
				}
				
				// If at-parameter exists, find appropriate sample index
				if( at !== undefined ){
					if(item.samples[0].sequence > at) callback();	// No samples less than at-parameter, skip to next.
					
					for(var j=0; j<item.samples.length; j++){
						if(item.samples[j].sequence > at){
							index = j-1;
							break;
						}
					}
				}

				var sample = me._flattenItem(item, item.samples[index])
				if( sample !== null ){
					ret.samples.push(sample);
					if( (ret.nextSequence===null) || (ret.nextSequence <= sample.sequence) ){
						ret.nextSequence = sample.sequence+1;
					}
				}
				
				callback();
			},
			function(err){
				callback(err, ret);
			}
		);
	}
	catch(e){
		console.log('Error in current: ' + e);
		throw(e);
		callback(['INTERNAL_ERROR'], null);
	}
}

exports.Agent.prototype._fetchSample = function _fetchSample(ids, from, count, callback){
	try{
		var fromInvalid = (from !== undefined) && (isNaN(from));	// from-parameter invalid if specified but not a number
		var fromOutOfRange = (!fromInvalid) && (from !== undefined) && ( (from<0) || (from>=this.nextSequence) );	// from-parameter out of range if valid, specified, but not between [firstSequence, nextSequence)
		
		if(fromInvalid) callback(['INVALID_REQUEST'], null);
		if(fromOutOfRange) callback(['OUT_OF_RANGE'], null);
		
		var countInvalid = (count !== undefined) && (isNaN(count));
		var countTooMany = (count > 500);	//TODO: do not hardcode max count
		
		if(countInvalid) callback(['INVALID_REQUEST'], null);
		if(countTooMany) callback(['TOO_MANY'], null);
		
		var ret = {samples: [], firstSequence: this.firstSequence, lastSequence: this.nextSequence-1, nextSequence: null};
		var me = this;
		async.forEach(
			ids,
			function(id, callback){
				var item = me.store[id];
				for(var j=0; j<item.samples.length; j++){
					// Filter by from-parameter if necessary
					if(from!==undefined){
						if( item.samples[j].sequence < from ) continue;
					}
				
					var sample = me._flattenItem(item, item.samples[j])
					if( sample !== null){
						ret.samples.push(sample);
					}
				}
				callback();
			},
			function(err){
				if( count===undefined ){
					count=10;
				}
				ret.samples.sort(function(a, b){
					if(a.sequence > b.sequence) return 1;
					if(a.sequence < b.sequence) return -1;
					return 0;
				});
				ret.samples.length = Math.min(count, ret.samples.length);
				if(ret.samples.length>0) ret.nextSequence = ret.samples[ret.samples.length-1].sequence + 1;
				callback(null, ret);
			}
		);
	}
	catch(e){
		console.log('Error in sample: ' + e);
		callback(['INTERNAL_ERROR'], null);	
	}
}

exports.Agent.prototype._flattenItem = function _flattenItem(item, sample){
	return {
		id: item.id, 
		category: item.category, 
		name: item.name, 
		type: item.type, 
		subType: item.subType, 
		componentId: item.componentId, 
		componentType: item.componentType, 
		componentName: item.componentName, 
		deviceId: item.deviceId,
		deviceName: item.deviceName,
		deviceUuid: item.deviceUuid,
		sequence: sample.sequence, 
		timestamp: sample.timestamp, 
		value: sample.value, 
		condition: sample.condition
	}
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

exports.Agent.prototype._parseDevices = function _parseDevices(doc){
	var devices = doc.getElementsByTagName('Device');
	
	for(var i=0; i<devices.length; i++){
		var device = devices[i];
		var deviceId = device.getAttribute('id');
		var deviceName = device.getAttribute('name');
		var deviceUuid = device.getAttribute('uuid');
		
		var items = device.getElementsByTagName('DataItem');
		
		for(var j=0; j<items.length; j++){
			var item = items[j];
			
			var id = item.getAttribute('id');
			var category = item.getAttribute('category');
			var name = item.getAttribute('name');
			var type = item.getAttribute('type');
			var subType = item.getAttribute('subType');
			
			var component = item.parentNode.parentNode;
			var componentId = component.getAttribute('id');
			var componentType = component.tagName;
			var componentName = component.getAttribute('name');
					
			this.store[id] = {
				id: id, 
				category: category, 
				name: name, 
				type: type, 
				subType: subType, 
				componentId: componentId, 
				componentType: componentType, 
				componentName: componentName, 
				deviceId: deviceId,
				deviceName: deviceName,
				deviceUuid: deviceUuid,
				samples: []
			};
			//console.log('Parsed item ' + id);
		}
		
	}
}

exports.Agent.prototype._storeSample = function _storeSample(id, value, timestamp, condition){
	if( !this.store.hasOwnProperty(id) ){
		console.log('No data item with id ' + id + '.');
		//console.log(this.store);

		return;
		//return;//throw new Exception('No data item with id ' + id + '.');
	}
	
	// Do not store adjacent identical values.
	if( this.store[id].samples.length > 0 ){
		var current = this.store[id].samples[this.store[id].samples.length-1];
		if( current.value == value ) return;
	}
	
	// Validate condition
	if( this.store[id].category === 'CONDITION' ){
		if( ['UNAVAILABLE', 'NORMAL', 'WARNING', 'FAULT'].indexOf(condition) == -1 ) return;
	}
	
	// Convert given timestamp to ISO string
	var ts = new Date(timestamp).toISOString();
	
	var sequence = this.nextSequence++;
	
	this.store[id].samples.push({
		sequence: sequence,
		timestamp: ts,
		value: value,
		condition: condition
	});
}

exports.Agent.prototype._storeSamples = function _storeSamples(query, callback){
	var data = [];
	data.push(
		{
			id: query.id,
			value: query.value,
			timestamp: query.timestamp,
			condition: query.condition
		}
	);
	
	var i=1;
	while(query.hasOwnProperty('id'+i)){
		data.push(
			{
				id: query['id'+i], 
				value: query['value'+i], 
				timestamp: query['timestamp'+i],
				condition: query['condition'+i]
			}
		);
	
		i++;
	}
	
	var me = this;
	async.forEach(
		data,
		function(item, callback){
			try{
				me._storeSample(item.id, item.value, item.timestamp, item.condition);
				callback();
			}
			catch(e){
				callback(['UNABLE_TO_STORE']);
			}
		},
		function(error){
			callback(error);
		}
	)
}