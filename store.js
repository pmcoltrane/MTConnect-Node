// VARIABLES
var store = {};	// Stores samples by data item.
var firstSequence = 0;
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
	var ret = {samples: [], firstSequence: firstSequence, lastSequence: nextSequence-1};

	for(var i=0; i<dataItems.length; i++){
		var id = dataItems[i];
		var item = store[id];
		for(var j=0; j<item.samples.length; j++){
			// Filter by from-parameter if necessary
			if(from!==undefined){
				console.log('from=' + from);
				if( item.samples[j].sequence < from ) continue;
			}
		
			var sample = flatten(item, j)
			if( sample !== null){
				ret.samples.push(sample);
			}
		}
	}
	
	// Sort by sequence and filter by count if necessary
	if( count===undefined ){
		count=10;
	}
	ret.samples.sort(function(a, b){
		if(a.sequence > b.sequence) return 1;
		if(a.sequence < b.sequence) return -1;
		return 0;
	});
	ret.samples.length = Math.min(count, ret.samples.length);
	
	return ret;
}

exports.getSampleAsync = function(response, dataItems, from, count, callback){
	var fromInvalid = (from !== undefined) && (isNaN(from));	// from-parameter invalid if specified but not a number
	var fromOutOfRange = (!fromInvalid) && (from !== undefined) && ( (from<firstSequence) || (from>=nextSequence) );	// from-parameter out of range if valid, specified, but not between [firstSequence, nextSequence)
	
	if(fromInvalid) callback(['INVALID_REQUEST'], response, null);
	if(fromOutOfRange) callback(['OUT_OF_RANGE'], response, null);
	
	var countInvalid = (count !== undefined) && (isNaN(count));
	var countTooMany = (count > 500);
	
	if(countInvalid) callback(['INVALID_REQUEST'], response, null);
	if(countTooMany) callback(['TOO_MANY'], response, null);

	callback(null, response, exports.getSample(dataItems, from, count));
}

exports.getCurrent = function(dataItems, at){
	//TODO: this looks like it should refactor to be done in parallel.
	var ret = {samples: [], firstSequence: firstSequence, lastSequence: nextSequence-1};
	
	for(var i=0; i<dataItems.length; i++){
		var id = dataItems[i];
		var item = store[id];
		
		var index = item.samples.length-1;
		if(index<0) continue;	// No samples, skip to next.
		
		// If at-parameter exists, find appropriate sample index
		if(at !== undefined){
			if(item.samples[0].sequence > at) continue;	// No samples less than at-parameter, skip to next.
			
			for(var j=0; j<item.samples.length; j++){
				if(item.samples[j].sequence > at){
					index = j-1;
					break;
				}
			}
		}

		var sample = flatten(item, index)
		if( sample !== null ){
			ret.samples.push(sample);
		}
	}
	
	return ret;
}

exports.getCurrentAsync = function(response, dataItems, at, callback){
	var atInvalid = (at !== undefined) && (isNaN(at));	//at-parameter invalid if specified but not a number
	var atOutOfRange = (!atInvalid) && (at !== undefined) && ( (at<firstSequence) || (at>= nextSequence) );	//at-parameter out of range if valid, specified, but not between [firstSequence, nextSequence)
	
	if(atInvalid) callback(['INVALID_REQUEST'], response, null);
	if(atOutOfRange) callback(['OUT_OF_RANGE'], response, null);

	callback(null, response, exports.getCurrent(dataItems, at));
}

exports.storeSample = function(id, value, timestamp, condition){
	if( !store.hasOwnProperty(id) ) return;
	
	// Exit if this value is identical to the previous value.
	if( store[id].samples.length > 0 ){
		var current = store[id].samples[store[id].samples.length-1];
		if( current.value == value ) return;
	}
	
	// If condition is not one of UNAVAILABLE, NORMAL, WARNING, or FAULT, exit.
	if( store[id].category === 'CONDITION' ){
		if( (condition != 'UNAVAILABLE') && (condition != 'NORMAL') && (condition != 'WARNING') && (condition != 'FAULT') ) return;
	}
	
	// TODO: validate timestamp

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



	