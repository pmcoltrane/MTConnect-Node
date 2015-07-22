/// <reference path="../typings/tsd.d.ts" />
/// <reference path="./device-store.ts" />
/// <reference path="./sample-store.ts" />

import express = require('express');
var xmldom = require('xmldom');
var DeviceStore = require('./device-store');
var SampleStore = require('./sample-store');
var fs = require('fs');
var dom = require('xmldom').DOMParser;

var xml = fs.readFileSync('probe.xml', {encoding: 'utf8'});

var doc = new dom().parseFromString(xml);

var deviceStore = new DeviceStore(doc);
var sampleStore = new SampleStore(); 

export function getDevices(req:express.Request, res:express.Response, next:(err?:any)=>void):void {
	var device = req.params['device'] || null;
	var path = req.query['path'] || null;
	
	if(device) path = '//Device[@id=' + device + ']';
	
	var callback = function(info){
		req['devices'] = info;
		console.log('got info');
		next();
	}
	
	var errcallback = function(err){
		next(err);
	}
	
	if(!!path){
		deviceStore.
		selectInfoFromXPath(path).
		then(callback).
		catch(errcallback);
	}
	else{
		deviceStore.
		selectInfo().
		then(callback).
		catch(errcallback);
	}
}

export function getStreams(req:express.Request, res:express.Response, next:(err?:any)=>void):void {
	var devices = req['devices'];
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
	var devices = req['devices'];
	var samples = req['samples'];
	
	var merged = {};
	
	for(var i in devices){
		var item = devices[i];
		merged[item.id] = item;
		merged[item.id].samples = [];
	}
	
	for(var i in samples){
		var item = samples[i];
		if(merged.hasOwnProperty[item.id]){
			merged[item.id].samples.push(item);
		}
	}
	
	req['merged'] = merged;
	next();
}