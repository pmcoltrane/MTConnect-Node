var fs = require("fs");
var events = require("events");
var util = require("util");
var DOMParser = require("xmldom").DOMParser;
var XMLSerializer = require("xmldom").XMLSerializer;

var probeFilename = null;
var probeText = null;
var probeXmlDocument = null;

exports.loadDevices = function(filename, callback){
	if( filename == null){
		filename = 'probe.xml';
	}

	fs.readFile(filename, 'utf8', function load(err, data){
		if(err){
			callback(err, null);
		}
		
		try{
			probeText = data;
			probeXmlDocument = new DOMParser().parseFromString(data, 'text/xml');	
			callback(null, probeXmlDocument);
		}
		catch(e){
			probeXmlDocument = null;
			callback(e, null);
		}
		
	});	
}

exports.getProbe = function(deviceId){
	//TODO: support getting probe by deviceId
	return probeXmlDocument;
}

exports.getProbeString = function(deviceId){
	var xml = exports.getProbe(deviceId);
	return new XMLSerializer().serializeToString(xml);
}

exports.getDataItems = function(xpath){
	if(probeXmlDocument===null) return null;

	//TODO: support xpath processing
	var items = probeXmlDocument.getElementsByTagName('DataItem');
	var ret = [];
	for(var i=0; i<items.length; i++){
		var item = items[i];
		ret.push(item.getAttribute('id'));
	}
	return ret;
}

exports.findDataItemById =  function(id){
	if(probeXmlDocument===null) return null;
		
	return this.XmlDocument.getElementById(id);
};