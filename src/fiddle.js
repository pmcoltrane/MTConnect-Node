var xpath = require('xpath');
var xmldom = require('xmldom').DOMParser;
var fs = require('fs');

var content = '<?xml version="1.0" encoding="UTF-8"?><MTConnectDevices><Header></Header><Devices><Device><DataItems><DataItem id="foo"></DataItem><DataItem id="bar"></DataItem></DataItems></Device></Devices></MTConnectDevices>'
content = fs.readFileSync('probemin.xml', 'utf8');
var doc = new xmldom().parseFromString(content, "application/xml");
var select = xpath.useNamespaces({'m': 'urn:mtconnect.org:MTConnectDevices:1.3'})
var results = select('//m:DataItem/@id', doc);

console.log(results.map(function(item){ return item.value}));