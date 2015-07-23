/// <reference path="../typings/tsd.d.ts" />

import Promise = require('bluebird');
import SampleInfo = require('./sample-info');

class SampleStore{
	
	private _firstSequence:number;
	private _lastSequence:number;
	private _nextSequence:number;
	
	private _samples:SampleInfo[];
	
	public get firstSequence():number{
		return this._firstSequence;
	}
	
	public get lastSequence():number{
		return this._lastSequence;
	}
	
	public get nextSequence():number{
		return this._nextSequence;
	}
	
	constructor(){
		this._firstSequence = 0;
		this._lastSequence = 0;
		this._nextSequence = 1;
		this._samples = [];
	}	
	
	public storeSample = (sample:SampleInfo):void => {
		sample.timestamp = sample.timestamp || new Date();
		sample.sequence = this._nextSequence++;
		this._lastSequence = sample.sequence;
		
		if(!this._samples.hasOwnProperty[sample.id]) this._samples[sample.id] = [];
	
		this._samples.push(sample);
	}
	
	public getSample = (ids:string[], from:number = 0, count:number = 100):any => {
		var self = this;
		
		return Promise.try(function(){
			var samples = [];
			
			for(var i = self._samples.length-1; i>=0; i--){
				var sample = self._samples[i];
				
				if(sample.sequence < from) break;
				if(samples.length >= count) break;
				
				if(ids.indexOf(sample.id) !== -1){
					samples.push(sample);
				}
			}
			
			return samples;
		});
	}
	
}

export = SampleStore;