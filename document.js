var DOMParser = require('xmldom').DOMParser;
var XMLSerializer = require('xmldom').XMLSerializer;


exports.Document = function Document(sender, instanceId, version, buffersize){
	this.sender = sender;
	this.instanceId = instanceId;
	this.version = version;
	this.bufferSize = buffersize;
}

exports.Document.prototype.errorCodes = {
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

/* Params:
 *   node - xml Devices node
 * Returns:
 *   An MTConnectDevices document.
 */
exports.Document.prototype.devicesDocument = function devicesDocument(node){

	// Create DOM document
	var doc = new DOMParser().parseFromString('<MTConnectDevices/>');
	var rootNode = doc.firstChild;
	
	// Add header
	var headerNode = this._createHeader(doc)
	rootNode.appendChild(headerNode);
	
	// Add devices
	var devicesNode = doc.importNode(node, true);
	rootNode.appendChild(devicesNode);
	
	return new XMLSerializer().serializeToString(doc);
}

/* Params:
 *   data - array of data items
 * Returns:
 *   An MTConnectStreams document.
 */
exports.Document.prototype.streamsDocument = function(data){
	var doc = new DOMParser().parseFromString('<MTConnectStreams/>');
	var rootNode = doc.firstChild;
	
	var headerNode = this._createHeader(
		doc, 
		{
			firstSequence: ((data.firstSequence === null) ? 0 : data.firstSequence) , 
			lastSequence: ((data.lastSequence === null) ? 0 : data.lastSequence), 
			nextSequence: ((data.nextSequence === null) ? 0 : data.nextSequence)
		}
	);
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
		var deviceNode = this._createDeviceStream(doc, device);
		streamsNode.appendChild(deviceNode);
		
		// Iterate through each component
		for(var j in device.components){
			var component = device.components[j];
			var componentNode = this._createComponentStream(doc, component);
			deviceNode.appendChild(componentNode);
			
			var categories = {
				samples: 'Samples',
				events: 'Events',
				condition: 'Condition'
			}
			
			for(var category in categories){
				if( component.hasOwnProperty(category) && (component[category].length>0) ){
					var node = doc.createElement(categories[category]);
					componentNode.appendChild(node);
					
					for( var k in component[category] ){
						var item = component[category][k];
						node.appendChild(this._createStreamDataItem(
							doc,
							this._toStreamsName(item.type),
							item.value, 
							{
								dataItemId: '' + item.id,
								timestamp: '' + item.timestamp,
								sequence: '' + item.sequence,
								subType: '' + item.subType								
							}
						));
					}
				}
			}
			
		}
	}
		
	return new XMLSerializer().serializeToString(doc);
}

exports.Document.prototype.errorsDocument = function(error){
	var doc = new DOMParser().parseFromString('<MTConnectError/>');
	var rootNode = doc.firstChild;

	// Write header
	var headerNode = this._createHeader(doc, {});
	rootNode.appendChild(headerNode);
	
	// Add error(s)
	var errorsNode = doc.createElement('Errors');
	rootNode.appendChild(errorsNode);
	
	if( !(error instanceof Array) ){
		var node = doc.createElement('Error');
		node.setAttribute('errorCode', 'INTERNAL_ERROR');
		node.appendChild(doc.createTextNode(JSON.stringify(error)));
		errorsNode.appendChild(node);
	}
	else{
		for(i=0; i<error.length; i++){
			var errorCode = error[i];
			var errorDescription = this.errorCodes.hasOwnProperty(errorCode) ? this.errorCodes[errorCode].description : this.errorCodes.Default.description;
			
			var node = doc.createElement('Error');
			node.setAttribute('errorCode', errorCode);
			node.appendChild(doc.createTextNode(errorDescription));
			errorsNode.appendChild(node);
		}
	}
	
	// Write response
	return new XMLSerializer().serializeToString(doc);
}

exports.Document.prototype.storeDocument = function(){
	var doc = new DOMParser().parseFromString('<MTConnectStore/>');
	var rootNode = doc.firstChild;
	
	// Write header
	var headerNode = this._createHeader(doc, {});
	rootNode.appendChild(headerNode);
	
	var dataNode = doc.createElement('Store');
	rootNode.appendChild(dataNode);
	
	dataNode.appendChild(doc.createTextNode('Ok.'));
	
	return new XMLSerializer().serializeToString(doc);
}

exports.Document.prototype._createHeader = function _createHeader(doc, attributes){
	if( (attributes===undefined)||(attributes===null) ){
		attributes = {};
	}
	
	attributes.creationTime = new Date().toISOString();
	attributes.sender = this.sender;
	attributes.instanceId = '' + this.instanceId;
	attributes.version = this.version;
	attributes.bufferSize = '' + this.bufferSize;
	
	var node = doc.createElement('Header');
	for(var item in attributes){
		node.setAttribute(item, '' + attributes[item]);
	}
	
	return node;
}

exports.Document.prototype._createStreamDataItem = function _createStreamDataItem(doc, name, value, attributes){
	var item = doc.createElement(name);
	
	for(var attr in attributes){
		item.setAttribute(attr, '' + attributes[attr]);
	}
	
	item.appendChild(doc.createTextNode('' + value));
	return item;
}

exports.Document.prototype._toStreamsName = function _toStreamsName(name){
	var tokens = name.split("_");
	var ret = [];
	for(var i in tokens){
		ret.push(
			tokens[i].charAt(0).toUpperCase() 
			+ tokens[i].substring(1).toLowerCase()
		);
	}
	return ret.join('');
}

exports.Document.prototype._createDeviceStream = function _createDeviceStream(doc, data){
	var node = doc.createElement('DeviceStream');
	node.setAttribute('name', '' + data.name);
	node.setAttribute('uuid', '' + data.uuid);
	return node;
}

exports.Document.prototype._createComponentStream = function _createComponentStream(doc, data){
	var node = doc.createElement('ComponentStream');
	node.setAttribute('component', '' + data.component);
	node.setAttribute('name', '' + data.name);
	node.setAttribute('id', '' + data.id);
	return node;
}