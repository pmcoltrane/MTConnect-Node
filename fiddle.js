var xmldom = require('xmldom');
var DeviceStore = require('./routes/device-store');
var SampleStore = require('./routes/sample-store');
var fs = require('fs');
var dom = require('xmldom').DOMParser;

var xml = fs.readFileSync('probe.xml', {encoding: 'utf8'});

var doc = new dom().parseFromString(xml);


var store = new DeviceStore(doc);
var samples = new SampleStore();
// 
// store.selectInfoFromXPath('//Axes//DataItem').
// then(function(items){
// 	console.log('xpath filtered:')
// 	console.log(items);
// }).
// then(function(){
// 
// 
// 
// }).
// catch(function(err){
// 	console.error('ERROR');
// 	console.error(err);
// });

samples.storeSample({
	id: 'exec',
	value: 'UNAVAILABLE'
});

samples.storeSample({
	id: 'x2',
	value: '15.0000'
});

samples.storeSample({
	id: 'exec',
	value: 'READY'
});

samples.storeSample({
	id: 'x2',
	value: '16.0530'
});

samples.storeSample({
	id: 'x2',
	value: '16.1290'
});


var propertyBag = {};
store.selectInfo().then(function(items){
	var ids = items.map( function(item){ return item.id; } );
	propertyBag.devices = items;
	return samples.getSample(ids);
}).then(function(items){
	propertyBag.samples = items;
	console.log('done');
	console.log(propertyBag);
}).catch(function(err){
	console.error('ERROR');
	console.log(err);
});