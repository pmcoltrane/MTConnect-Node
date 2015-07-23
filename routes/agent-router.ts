/// <reference path="../typings/tsd.d.ts" />
/// <reference path="./item-store.ts" />
/// <reference path="./sample-store.ts" />

import express = require('express');
var xmldom = require('xmldom');
var ItemStore = require('./item-store');
var SampleStore = require('./sample-store');
var fs = require('fs');
var dom = require('xmldom').DOMParser;

var xml = fs.readFileSync('probe.xml', {encoding: 'utf8'});

var doc = new dom().parseFromString(xml);

var deviceStore = new ItemStore(doc);
var sampleStore = new SampleStore(); 

sampleStore.storeSample({
	id: 'cn6',
	value: 'UNAVAILABLE'
});

sampleStore.storeSample({
	id: 'x2',
	value: '15.0000'
});

sampleStore.storeSample({
	id: 'cn6',
	value: 'READY'
});

sampleStore.storeSample({
	id: 'x2',
	value: '16.0530'
});

sampleStore.storeSample({
	id: 'estop',
	value: 'UNAVAILABLE'
});

sampleStore.storeSample({
	id: 'estop',
	value: 'ARMED'
});

export function getItems(req:express.Request, res:express.Response, next:(err?:any)=>void):void {
	var device = req.params['device'] || null;
	var path = req.query['path'] || null;
	
	if(device) path = '//Device[@id=' + device + ']';
	
	var callback = function(info){
		req['items'] = info;
		console.log('got info');
		next();
	}
	
	var errcallback = function(err){
		next(err);
	}
	
	if(!!path){
		deviceStore.
		selectItemsFromXPath(path).
		then(callback).
		catch(errcallback);
	}
	else{
		deviceStore.
		selectItems().
		then(callback).
		catch(errcallback);
	}
}

export function getStreams(req:express.Request, res:express.Response, next:(err?:any)=>void):void {
	var devices = req['items'];
	var from = req.query.from || 0;
	var count = req.query.count || 100;
	
	var ids = devices.map(function(item){ return item.id; });
	sampleStore.getSample(ids, from, count).
	then(function(samples){
		req['samples'] = samples;
		console.log('got samples');
		next();
	}).
	catch(function(err){
		next(err);
	});
	
}

export function mergeDeviceAndStreams(req:express.Request, res:express.Response, next:(err?:any)=>void):void {
	var devices = req['items'];
	var capture = req['samples'];
	
	var merged = {};
	
	for(var i in devices){
		var item = devices[i];
		merged[item.id] = item;
		merged[item.id].samples = [];
	}
	
	var samples = capture.samples;
	for(var i in samples){
		var item = samples[i];
		if(merged.hasOwnProperty[item.id]){
			merged[item.id].samples.push(item);
		}
	}
	console.log('merged items and samples');
	req['streams'] = merged;
	delete capture.samples;
	req['header'] = capture;
	next();
}