var http = require('http');
var url = require('url');
var probe = require('./probe.js');
var store = require('./store.js');
var DOMParser = require('xmldom').DOMParser;
var XMLSerializer = require('xmldom').XMLSerializer;

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
	
	var doc = new DOMParser().parseFromString('<MTConnectStreams/>');
	var rootNode = doc.firstChild;
	
	var headerNode = doc.createElement('Header');
	createHeaderNode(headerNode, {firstSequence: ((data.firstSequence === null) ? 0 : data.firstSequence) , lastSequence: ((data.lastSequence === null) ? 0 : data.lastSequence), nextSequence: ((data.lastSequence === null) ? 0 : data.lastSequence+1)});
	rootNode.appendChild(headerNode);
	
	var streamsNode = doc.createElement('Streams');
	rootNode.appendChild(streamsNode);
	
	//var debugNode = doc.createElement('Debug');
	//debugNode.appendChild(doc.createTextNode(JSON.stringify(data)));
	//streamsNode.appendChild(debugNode);
	
	// HACK: overall not very clean. Work on this.
	var devices = {};
	var components = {};
	for(var i in data.samples){
		var item = data.samples[i];
		
		var deviceId = item.deviceId;
		if(!devices.hasOwnProperty(deviceId)){
			// Add device node
			var dev = doc.createElement('DeviceStream');
			createDeviceNode(dev, item);
			devices[deviceId] = dev;
		}
		
		var componentId = item.componentId;
		if(!components.hasOwnProperty(componentId)){
			// Add component node
			var com = doc.createElement('ComponentStream');
			createComponentNode(com, item);
			devices[deviceId].appendChild(com);
			components[componentId] = com;
		}
	
		switch(item.category){
			case 'SAMPLE':
				if(components[componentId].getElementsByTagName('Samples').length===0){
					components[componentId].appendChild(doc.createElement('Samples'));
				}
				var itemNode = doc.createElement(DataItemTypeToStreamsName(item.type));
				itemNode.appendChild(doc.createTextNode(JSON.stringify(item)));
				components[componentId].getElementsByTagName('Samples')[0].appendChild(itemNode);
				break;
			case 'EVENT':
				if(components[componentId].getElementsByTagName('Events').length===0){
					components[componentId].appendChild(doc.createElement('Events'));
				}
				var itemNode = doc.createElement(DataItemTypeToStreamsName(item.type));
				itemNode.appendChild(doc.createTextNode(JSON.stringify(item)));
				components[componentId].getElementsByTagName('Events')[0].appendChild(itemNode);
				break;
			case 'CONDITION':
				if(components[componentId].getElementsByTagName('Condition').length===0){
					components[componentId].appendChild(doc.createElement('Condition'));
				}
				var itemNode = doc.createElement(DataItemTypeToStreamsName(item.condition));
				itemNode.appendChild(doc.createTextNode(JSON.stringify(item)));
				components[componentId].getElementsByTagName('Condition')[0].appendChild(itemNode);
				break;
			default:
				//Do nothing
		}
	}
	
	// Add all device nodes
	for(var i in devices){
		streamsNode.appendChild(devices[i]);
	}
	
	var xml = new XMLSerializer().serializeToString(doc);
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
	}
	attributes.sender = sender;
	attributes.instanceId = instanceId;
	attributes.version = version;
	attributes.bufferSize = bufferSize;

	var ret = '<Header creationTime="' + new Date().toISOString() + '" ';
	for(var item in attributes){
		ret += item + '="' + attributes[item] + '" ';
	}
	ret += '/>';
	return ret;
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
	node.setAttribute('name', '' + data.deviceName);
	node.setAttribute('uuid', '' + data.deviceUuid);
}

function createComponentNode(node, data){
	node.setAttribute('component', '' + data.componentType);
	node.setAttribute('name', '' + data.componentName);
	node.setAttribute('id', '' + data.componentId);
}

function getRandomInt (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateInstanceId(){
	return getRandomInt(0, 4294967295);
}