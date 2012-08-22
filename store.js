// VARIABLES
var store = {};	// Stores samples by data item.
var nextSequence = 0;

// EXPORTS
exports.load = function(xmldoc){
	// Probe data has changed. Reset everything.
	store = {};
	
	var devices = xmldoc.getElementsByTagName('Device');
	
	for(var j=0; j<devices.length; j++){
		var device = devices[j];
		var deviceId = device.getAttribute('id');
		var deviceName = device.getAttribute('name');
		var deviceUuid = device.getAttribute('uuid');
	
		// Get DataItems
		var items = device.getElementsByTagName('DataItem');
		
		for(var i=0; i<items.length; i++){
			var item = items[i];
			
			var id = item.getAttribute('id');
			var category = item.getAttribute('category');
			var name = item.getAttribute('name');
			var type = item.getAttribute('type');
			var subType = item.getAttribute('subType');
			
			var component = item.parentNode.parentNode;
			var componentId = component.getAttribute('id');
			var componentType = component.tagName;
			var componentName = component.getAttribute('name');
					
			store[id] = {
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
				samples: []};
		}
	}
}

exports.getSample = function(dataItems, from, count){
	var ret = {samples: [], firstSequence: null, lastSequence: null};

	for(var i=0; i<dataItems.length; i++){
		var id = dataItems[i];
		var item = store[id];
		for(var j=0; j<item.samples.length; j++){
			//TODO: filter by from-parameter if necessary
			var sample = flatten(item, j)
			if( sample !== null){
				ret.samples.push(sample);
				if( (ret.firstSequence===null) || (sample.sequence<ret.firstSequence) ){
					ret.firstSequence = sample.sequence;
				}
				if( (ret.lastSequence===null) || (sample.sequence>ret.lastSequence) ){
					ret.lastSequence = sample.sequence;
				}
			}
		}
	}
	
	//TODO: once all samples are processed, sort by sequence number and filter by count if necessary
	
	return ret;
}

exports.getCurrent = function(dataItems, at){
	//TODO: this looks like it should refactor to be done in parallel.
	var ret = {samples: [], firstSequence: null, lastSequence: null};
	
	for(var i=0; i<dataItems.length; i++){
		var id = dataItems[i];
		var item = store[id];
		//TODO: include at-parameter
		
		var sample = flatten(item, item.samples.length-1)
		if( sample !== null ){
			ret.samples.push(sample);
			if( (ret.firstSequence===null) || (sample.sequence<ret.firstSequence) ){
				ret.firstSequence = sample.sequence;
			}
			if( (ret.lastSequence===null) || (sample.sequence>ret.lastSequence) ){
				ret.lastSequence = sample.sequence;
			}
		}
	}
	
	return ret;
}

exports.storeSample = function(id, value, timestamp, condition){
	var sequence = nextSequence++;
	store[id].samples.push({sequence: sequence, timestamp: timestamp, value: value, condition: condition});
}

exports.getDataItems = function(params){
	var ret = [];
	for(key in store){
		ret.push(key);
	}
	return ret;
}


// INTERNAL IMPLEMENTATION
function flatten(item, sampleIndex){
	if(sampleIndex<0) return null;
	if(sampleIndex>=item.samples.length) return null;
	
	var sample = item.samples[sampleIndex];
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
		condition: sample.condition};
}



	