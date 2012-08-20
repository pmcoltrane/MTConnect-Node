var http = require('http');
var url = require('url');
var probe = require('./probe.js');
var store = require('./store.js');

var sender = 'mtconnect-node';
var instanceId = 0;
var version = '1.2.0.0';
var bufferSize = 0;

instanceId = generateInstanceId();
probe.loadDevices('probe.xml', function(err, data){
	store.load(data);
	//TODO: populate store based on data (XmlDocument).
});

http.createServer(onRequest).listen(8080);


var handlers = {
	probe: function(request, response, query){
		console.log('probe');
		devicesDocument(null, response, probe.getProbeString());
	},
	sample: function(request, response, query){
		console.log('sample');
		var dataItems = probe.getDataItems();
		streamsDocument(null, response, store.getSample(dataItems));
	},
	current: function(request, response, query){
		console.log('current');
		var dataItems = probe.getDataItems();
		streamsDocument(null, response, store.getCurrent(dataItems));
	},
	asset: function(request, response, query){
		console.log('asset');
		errorsDocument(null, response,  ['UNSUPPORTED']);
	},
	store: function(request, response, query){
		console.log('store');
		store.storeSample(query.id, query.value, query.timestamp, query.condition);
		response.writeHead(200, {"Content-Type":"application/xml", "Access-Control-Allow-Origin":"*"});
		response.write('<Debug>Ok.</Debug>');
		response.end();
	},
	default: function(request, response, query){
		console.log('default');
		errorsDocument(null, response, ['UNSUPPORTED']);
	}
}

var ErrorCodes = {
	Default: {description: 'An unknown error has occurred.'},
	UNAUTHORIZED: {description: 'The request did not have sufficient permissions to perform the request.'},
	NO_DEVICE: {description: 'The device specified in the URI could not be found.'},
	OUT_OF_RANGE: {description: 'The sequence number was beyond the end of the buffer.'},
	TOO_MANY: {description: 'The count given is too large.'},
	INVALID_URI: {description: 'The URI provided was incorrect.'},
	INVALID_REQUEST: {description: 'The request was not one of the three specified requests.'},
	INTERNAL_ERROR: {description: 'Contact the software provider, the Agent did not behave correctly.'},
	INVALID_XPATH: {description: 'The XPath could not be parsed. Invalid syntax or XPath did not match any valid elements in the document.'},
	UNSUPPORTED: {description: 'A valid request was provided, but the Agent does not support the feature or request type.'},
	ASSET_NOT_FOUND: {description: 'An asset ID cannot be located.'}
}


function onRequest(request, response){
	var parsedUrl = url.parse(request.url, true);
	var pathname = parsedUrl.pathname.substring(1);
	var query = parsedUrl.query;
	
	if((pathname===null)||(pathname.length==0)){
		handlers.probe(request, response, query);
	}
	else if(handlers[pathname]){
		handlers[pathname](request, response, query);
	}
	else{
		handlers.default(request, response, query);
	}
}

function devicesDocument(err, response, xml){
	if(err){
		errorsDocument(null, err);
		return;
	}
	
	// No error, so write a probe.
	response.writeHead(200, {"Content-Type":"application/xml", "Access-Control-Allow-Origin":"*"});
	var header = createHeader();
	
	response.write('<MTConnectDevices>');	//TODO: include xmlns attributes
	response.write(header);
	//TODO: write AssetCounts
	response.write(xml);
	response.write('</MTConnectDevices>');
	response.end();
}

function streamsDocument(err, response, data){
	if(err){
		errorsDocument(null, err);
		return;
	}
	
	response.writeHead(200, {"Content-Type":"application/xml", "Access-Control-Allow-Origin":"*"});
	var header = createHeader({firstSequence: data.firstSequence, lastSequence: data.lastSequence, nextSequence: data.lastSequence+1});
	response.write('<MTConnectStreams>');	//TODO: include xmlns attributes
	response.write(header);
	response.write('<debug>' + JSON.stringify(data) + '</debug>');
	response.write('</MTConnectStreams>');
	response.end();
}

function errorsDocument(err, response, data){
	response.writeHead(200, {"Content-Type":"application/xml", "Access-Control-Allow-Origin":"*"});
	
	// Write Header
	var header = createHeader();
	
	// Write XML
	// TODO: build using DOM builder.
	var ret = '<Errors>';
	if( !(data instanceof Array) ){
		ret += '<Error errorCode="' + 'INTERNAL_ERROR' + '">' + JSON.stringify(data) + '</Error>';
	}
	else{
		for(i=0; i<data.length; i++){
			var errorCode = data[i];
			var errorDescription = ErrorCodes.hasOwnProperty(errorCode) ? ErrorCodes[errorCode].description : ErrorCodes.Default.description;
			ret += '<Error errorCode="' + errorCode + '">' + errorDescription + '</Error>';
		}
	}
	ret += '</Errors>';
	response.write('<MTConnectError>');	// TODO: include xmlns attributes
	response.write(header);
	response.write(ret);
	response.write('</MTConnectError>');
	response.end();
}

function createHeader(attributes){
	if( (attributes===undefined)||(attributes===null) ){
		attributes = {};
		attributes.sender = sender;
		attributes.instanceId = instanceId;
		attributes.version = version;
		attributes.bufferSize = bufferSize;
	}

	var ret = '<Header creationTime="' + new Date().toISOString() + '" ';
	for(var item in attributes){
		ret += item + '="' + attributes[item] + '" ';
	}
	ret += '/>';
	return ret;
}

function getRandomInt (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateInstanceId(){
	return getRandomInt(0, 4294967295);
}