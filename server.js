var http = require('http');
var url = require('url');
var probe = require('./probe.js');
var store = require('./store.js');
var DOMParser = require('xmldom').DOMParser;
var XMLSerializer = require('xmldom').XMLSerializer;
var async = require('async');

var sender = 'mtconnect-node';
var instanceId = 0;
var version = '1.2.0.0';
var bufferSize = 0;
var port = 8080;
var devicesFile = 'probe.xml';

processArgs(process.argv.splice(2));

instanceId = generateInstanceId();
probe.loadDevices('probe.xml', function(err, data){
	store.load(data);
});

http.createServer(onRequest).listen(port);


var handlers = {
	probe: function(request, response, query){
		console.log('Received probe request.');
		probe.getProbeAsync(null, response, devicesDocument);
	},
	sample: function(request, response, query){
		console.log('Received sample request.');
		var dataItems = probe.getDataItems();
		store.getSampleAsync(response, dataItems, query.from, query.count, streamsDocument);
	},
	current: function(request, response, query){
		console.log('Received current request.');
		var dataItems = probe.getDataItems();
		store.getCurrentAsync(response, dataItems, query.at, streamsDocument);
	},
	asset: function(request, response, query){
		console.log('Received asset request.');
		errorsDocument(null, response,  ['UNSUPPORTED']);
	},
	store: function(request, response, query){
		console.log('Received store request.');
		store.storeSamples(
			response,
			query,
			storeDocument
		);
	},
	default: function(request, response, query){
		console.log('Received unknown request.');
		errorsDocument(null, response, ['UNSUPPORTED']);
	}
}

var ErrorCodes = {
	Default: {description: 'An unknown error has occurred.'},
	
	/* MTConnect errors */
	UNAUTHORIZED: {description: 'The request did not have sufficient permissions to perform the request.'},
	NO_DEVICE: {description: 'The device specified in the URI could not be found.'},
	OUT_OF_RANGE: {description: 'The sequence number was beyond the end of the buffer.'},
	TOO_MANY: {description: 'The count given is too large.'},
	INVALID_URI: {description: 'The URI provided was incorrect.'},
	INVALID_REQUEST: {description: 'The request was not one of the three specified requests.'},
	INTERNAL_ERROR: {description: 'Contact the software provider, the Agent did not behave correctly.'},
	INVALID_XPATH: {description: 'The XPath could not be parsed. Invalid syntax or XPath did not match any valid elements in the document.'},
	UNSUPPORTED: {description: 'A valid request was provided, but the Agent does not support the feature or request type.'},
	ASSET_NOT_FOUND: {description: 'An asset ID cannot be located.'}, 
	
	/* Custom errors */
	UNABLE_TO_STORE: {description: 'Could not store the given data.'}
}


function processArgs(args){
	console.log('Arguments: ' + args);
	
	for(var i=0; i<args.length; i++){
		var tokens = args[i].split('=');
		switch(tokens[0].toUpperCase()){
			case 'PORT':
				if(!isNaN(tokens[1])){
					port = tokens[1];
					console.log('Will listen on port ' + port);
				}
				break;
			case 'SENDER':
				sender = tokens[1];
				console.log('Will report sender as "' + sender + '"');
				break;
			case 'DEVICES':
				devicesFile = tokens[1];
				console.log('Will load device configuration from "' + devicesFile + '"');
			default:
				break;
		}
	}
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
	else if(pathname.indexOf('test/')===0){
		handlers.serve(request, response, query);
	}
	else{
		handlers.default(request, response, query);
	}
}

function devicesDocument(err, response, xmlnode){
	if(err){
		errorsDocument(err, response);
		return;
	}
	
	// Create DOM document
	var doc = new DOMParser().parseFromString('<MTConnectDevices/>');
	var rootNode = doc.firstChild;
	
	// Add header
	var headerNode = doc.createElement('Header');
	createHeaderNode(headerNode, {});
	rootNode.appendChild(headerNode);
	
	// Add devices
	var devicesNode = doc.importNode(xmlnode, true);
	rootNode.appendChild(devicesNode);
	
	// Write response
	var xml = new XMLSerializer().serializeToString(doc);
	response.writeHead(200, {"Content-Type":"application/xml", "Access-Control-Allow-Origin":"*"});
	response.write(xml);
	response.end();
}

function streamsDocument(err, response, data){
	if(err){
		errorsDocument(err, response);
		return;
	}
	
	response.writeHead(200, {"Content-Type":"application/xml", "Access-Control-Allow-Origin":"*"});
	
	var doc = new DOMParser().parseFromString('<MTConnectStreams/>');
	var rootNode = doc.firstChild;
	
	var headerNode = doc.createElement('Header');
	createHeaderNode(headerNode, {firstSequence: ((data.firstSequence === null) ? 0 : data.firstSequence) , lastSequence: ((data.lastSequence === null) ? 0 : data.lastSequence), nextSequence: ((data.nextSequence === null) ? 0 : data.nextSequence)});
	rootNode.appendChild(headerNode);
	
	var streamsNode = doc.createElement('Streams');
	rootNode.appendChild(streamsNode);
	
	// Create hierarchy
	var devices = {};
	for(var i in data.samples){
		var item = data.samples[i];
		
		// If device does not exist, add it.
		if( !devices.hasOwnProperty(item.deviceUuid) ){
			devices[item.deviceUuid] = {
				uuid: item.deviceUuid,
				name: item.deviceName,
				components: {}
			}
		}
		var device = devices[item.deviceUuid];
	
		// If component does not exist, add it.
		if( !device.components.hasOwnProperty(item.componentId) ){
			device.components[item.componentId] = {
				component: item.componentType,
				name: item.componentName,
				id: item.componentId,
				samples: [],
				events: [],
				condition: []
			}
		}
		var component = device.components[item.componentId];
		
		switch(item.category){
			case 'SAMPLE':
				component.samples.push(item);
				break;
			case 'EVENT':
				component.events.push(item);
				break;
			case 'CONDITION':
				component.condition.push(item);
				break;
			default:
				// Unknown. Do nothing.
				break;
		}
	}
	
	// Build XML from hierarchy
	// TODO: refactor
	for(var i in devices){
		var device = devices[i];
		var deviceNode = doc.createElement('DeviceStream');
		createDeviceNode(deviceNode, device);
		streamsNode.appendChild(deviceNode);
		
		// Iterate through each component
		for(var j in device.components){
			var component = device.components[j];
			var componentNode = doc.createElement('ComponentStream');
			createComponentNode(componentNode, component);
			deviceNode.appendChild(componentNode);
			
			// If we have samples, append them
			if( (component.samples) && (component.samples.length>0) ){
				var samplesNode = doc.createElement('Samples');
				componentNode.appendChild(samplesNode);
				for(var k in component.samples){
					var item = component.samples[k];
					var itemNode = doc.createElement(DataItemTypeToStreamsName(item.type));
					itemNode.setAttribute('dataItemId', '' + item.id);
					itemNode.setAttribute('timestamp', '' + item.timestamp);
					itemNode.setAttribute('sequence', '' + item.sequence);
					itemNode.setAttribute('subType', '' + item.subType);
					itemNode.appendChild(doc.createTextNode('' + item.value));
					samplesNode.appendChild(itemNode);
				}
			}
			
			// If we have events, append them
			if( (component.events) && (component.events.length>0) ){
				var eventsNode = doc.createElement('Events');
				componentNode.appendChild(eventsNode);
				for(var k in component.events){
					var item = component.events[k];
					var itemNode = doc.createElement(DataItemTypeToStreamsName(item.type));
					itemNode.setAttribute('dataItemId', '' + item.id);
					itemNode.setAttribute('timestamp', '' + item.timestamp);
					itemNode.setAttribute('sequence', '' + item.sequence);
					itemNode.setAttribute('subType', '' + item.subType);
					itemNode.appendChild(doc.createTextNode('' + item.value));
					eventsNode.appendChild(itemNode);
				}
			}
			
			// If we have conditions, append them
			if( (component.condition) && (component.condition.length>0) ){
				var conditionNode = doc.createElement('Condition');
				componentNode.appendChild(conditionNode);
				for(var k in component.samples){
					var item = component.samples[k];
					var itemNode = doc.createElement(DataItemTypeToStreamsName(item.condition));
					itemNode.setAttribute('dataItemId', '' + item.id);
					itemNode.setAttribute('timestamp', '' + item.timestamp);
					itemNode.setAttribute('sequence', '' + item.sequence);
					itemNode.setAttribute('type', '' + item.type);
					itemNode.setAttribute('subType', '' + item.subType);
					itemNode.appendChild(doc.createTextNode('' + item.value));
					conditionNode.appendChild(itemNode);
				}
			}
		}
	}
		
	var xml = new XMLSerializer().serializeToString(doc);
	response.write(xml);
	response.end();
}

function storeDocument(err, response, data){
	if(err){
		errorsDocument(err, response);
		return;
	}
	
	// Create DOM document
	var doc = new DOMParser().parseFromString('<MTConnectStore/>');
	var rootNode = doc.firstChild;
	
	// Add header
	var headerNode = doc.createElement('Header');
	createHeaderNode(headerNode, {});
	rootNode.appendChild(headerNode);
	
	// Add data
	var dataNode = doc.createElement('Store');
	rootNode.appendChild(dataNode);
	
	dataNode.appendChild(doc.createTextNode('Ok.'));
	
	// Write response
	var xml = new XMLSerializer().serializeToString(doc);
	response.writeHead(200, {"Content-Type":"application/xml", "Access-Control-Allow-Origin":"*"});
	response.write(xml);
	response.end();
}

function DataItemTypeToStreamsName(type){
	var tokens = type.split("_");
	var ret = [];
	for(var i in tokens){
		ret.push(
			tokens[i].charAt(0).toUpperCase() 
			+ tokens[i].substring(1).toLowerCase()
		);
	}
	return ret.join('');
}

function ConditionToStreamsName(condition){
	return conditions.charAt(0).toUpperCase() + conditions.substring(1).toLowerCase();
}

function errorsDocument(err, response){
	var doc = new DOMParser().parseFromString('<MTConnectError/>');
	var rootNode = doc.firstChild;

	// Write header
	var headerNode = doc.createElement('Header');
	createHeaderNode(headerNode, {});
	rootNode.appendChild(headerNode);
	
	// Add error(s)
	var errorsNode = doc.createElement('Errors');
	rootNode.appendChild(errorsNode);
	
	if( !(err instanceof Array) ){
		var node = doc.createElement('Error');
		node.setAttribute('errorCode', 'INTERNAL_ERROR');
		node.appendChild(doc.createTextNode(JSON.stringify(err)));
		errorsNode.appendChild(node);
	}
	else{
		for(i=0; i<err.length; i++){
			var errorCode = err[i];
			var errorDescription = ErrorCodes.hasOwnProperty(errorCode) ? ErrorCodes[errorCode].description : ErrorCodes.Default.description;
			console.log('Error code: ' + errorCode);
			console.log('Error description: ' + errorDescription);
			console.log('Data: ' + JSON.stringify(err[i]));
			
			var node = doc.createElement('Error');
			node.setAttribute('errorCode', errorCode);
			node.appendChild(doc.createTextNode(errorDescription));
			errorsNode.appendChild(node);
		}
	}
	
	// Write response
	var xml = new XMLSerializer().serializeToString(doc);
	response.writeHead(200, {"Content-Type":"application/xml", "Access-Control-Allow-Origin":"*"});
	response.write(xml);
	response.end();	
}

function createHeaderNode(node, attributes){
	if( (attributes===undefined)||(attributes===null) ){
		attributes = {};
	}
	attributes.creationTime = new Date().toISOString();
	attributes.sender = sender;
	attributes.instanceId = '' + instanceId;
	attributes.version = version;
	attributes.bufferSize = '' + bufferSize;
	
	for(var item in attributes){
		node.setAttribute(item, '' + attributes[item]);
	}
}

function createDeviceNode(node, data){
	node.setAttribute('name', '' + data.name);
	node.setAttribute('uuid', '' + data.uuid);
}

function createComponentNode(node, data){
	node.setAttribute('component', '' + data.component);
	node.setAttribute('name', '' + data.name);
	node.setAttribute('id', '' + data.id);
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateInstanceId(){
	return getRandomInt(0, 4294967295);
}