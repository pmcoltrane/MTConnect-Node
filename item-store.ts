/// <reference path="typings/tsd.d.ts" />
import Promise = require('bluebird');

class ItemStore{
	private _items:any = {};
	private _firstSequence:number = 0;
	private _nextSequence:number = 1;
	private _totalItems:number = 0;
	
	public get firstSequence(){
		return this._firstSequence;
	}
	
	public get nextSequence(){
		return this._nextSequence;
	}
	
	public load = (xmldoc:XMLDocument):void => {
		// Probe data has changed. Reset everything.
		this._items = {};
		
		var devices:NodeList = xmldoc.getElementsByTagName('Device');
		
		for(var j=0; j<devices.length; j++){
			var device = <Element>devices[j];
			var deviceId = device.getAttribute('id');
			var deviceName = device.getAttribute('name');
			var deviceUuid = device.getAttribute('uuid');
		
			// Get DataItems
			var items = device.getElementsByTagName('DataItem');
			
			for(var i=0; i<items.length; i++){
				var item = <Element>items[i];
				
				var id = item.getAttribute('id');
				var category = item.getAttribute('category');
				var name = item.getAttribute('name');
				var type = item.getAttribute('type');
				var subType = item.getAttribute('subType');
				
				var component = <Element>item.parentNode.parentNode;
				var componentId = component.getAttribute('id');
				var componentType = component.tagName;
				var componentName = component.getAttribute('name');
						
				this._items[id] = {
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
	
	public getSample = (response, dataItems, from, count, callback):void => {
		var self = this;
		try{
			var fromInvalid = (from !== undefined) && (isNaN(from));	// from-parameter invalid if specified but not a number
			var fromOutOfRange = (!fromInvalid) && (from !== undefined) && ( (from<0) || (from>=this.nextSequence) );	// from-parameter out of range if valid, specified, but not between [firstSequence, nextSequence)
			
			if(fromInvalid) callback(['INVALID_REQUEST'], response, null);
			if(fromOutOfRange) callback(['OUT_OF_RANGE'], response, null);
			
			var countInvalid = (count !== undefined) && (isNaN(count));
			var countTooMany = (count > 500);
			
			if(countInvalid) callback(['INVALID_REQUEST'], response, null);
			if(countTooMany) callback(['TOO_MANY'], response, null);
			
			var ret = {samples: [], firstSequence: this.firstSequence, lastSequence: this.nextSequence-1, nextSequence: null};
			async.forEach(
				dataItems,
				function(id, callback){
					var item = self._items[id];
					for(var j=0; j<item.samples.length; j++){
						// Filter by from-parameter if necessary
						if(from!==undefined){
							if( item.samples[j].sequence < from ) continue;
						}
					
						var sample = self.flatten(item, j)
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
					callback(null, response, ret);
				}
			);
		}
		catch(e){
			console.log('Error in sample: ' + e);
			callback(['INTERNAL_ERROR'], response, null);	
		}
		
	}
	
	public getCurrentAsync = (response, dataItems:string[], at, callback):void => {
		var self = this;
		try{
			var atInvalid = (at !== undefined) && (isNaN(at));	//at-parameter invalid if specified but not a number
			var atOutOfRange = (!atInvalid) && (at !== undefined) && ( (at<this.firstSequence) || (at>= this.nextSequence) );	//at-parameter out of range if valid, specified, but not between [firstSequence, nextSequence)
			
			if(atInvalid) callback(['INVALID_REQUEST'], response, null);
			if(atOutOfRange) callback(['OUT_OF_RANGE'], response, null);
	
			var ret = {samples: [], firstSequence: this.firstSequence, lastSequence: this.nextSequence-1, nextSequence: null};
			Promise.map(dataItems, function(id){
				var item = self._items[id];
			
				var index = item.samples.length-1;
				if(index<0){
					callback();	// No samples, skip to next.
					return;
				}
				
				// If at-parameter exists, find appropriate sample index
				if(at !== undefined){
					console.log(item);
					if(item.samples[0].sequence > at) callback();	// No samples less than at-parameter, skip to next.
					
					for(var j=0; j<item.samples.length; j++){
						if(item.samples[j].sequence > at){
							index = j-1;
							break;
						}
					}
				}

				var sample = self.flatten(item, index)
				if( sample !== null ){
					ret.samples.push(sample);
					if( (ret.nextSequence===null) || (ret.nextSequence <= sample.sequence) ){
						ret.nextSequence = sample.sequence+1;
					}
				}
				
				callback();
			}).then(;
			
			async.forEach(
				dataItems,
				function(id, callback){
				
				},
				function(err){
					callback(null, response, ret);
				}
			);
		}
		catch(e){
			console.log('Error in current: ' + e);
			callback(['INTERNAL_ERROR'], response, null);
		}		
	}

	public storeSamples = (response, query, callback):void => {
		var data = [];
		var self = this;
		
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
	
		Promise.
		map(data, function(item){
			self.storeSample(item.id, item.value, item.timestamp, item.condition);
		}).
		then(function(items){
			callback();
		}).
		catch(function(err){
			callback(err, response, data);
		});
	}	
	
	private storeSample = (id, value, timestamp, condition):void => {
		if( !this._items.hasOwnProperty(id) ) throw new Error('No data item with id "' + id + '" exists.');
	
		// Exit if this value is identical to the previous value.
		if( this._items[id].samples.length > 0 ){
			var current = this._items[id].samples[this._items[id].samples.length-1];
			if( current.value == value ) return;
		}
		
		// If condition is not one of UNAVAILABLE, NORMAL, WARNING, or FAULT, exit.
		if( this._items[id].category === 'CONDITION' ){
			if( (condition != 'UNAVAILABLE') && (condition != 'NORMAL') && (condition != 'WARNING') && (condition != 'FAULT') ) return;
		}
		
		// Convert given timestamp to ISO string
		var ts = new Date(timestamp).toISOString();
	
		var sequence = this._nextSequence++;
		this._items[id].samples.push({sequence: sequence, timestamp: ts, value: value, condition: condition});
		this._totalItems += 1;
	}
	
	private flatten = (item, sampleIndex):any => {
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
			condition: sample.condition
		};		
	}
	
}

export = ItemStore;