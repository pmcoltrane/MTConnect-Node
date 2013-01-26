var Agent = require('./agent.js').Agent;

var a = new Agent();

setTimeout(function(){
	a._storeSample('x2', 0.1234, new Date().toISOString());
	a._storeSample('x2', 0.4717, new Date().toISOString());
	a._storeSample('x2', 0.1415, new Date().toISOString());
	a._storeSample('x2', 0.7183, new Date().toISOString());
	a._storeSample('x2', 1.1234, new Date().toISOString());
	a._storeSample('x2', 5.6789, new Date().toISOString());

	a.listen();
	
	console.log('ready');
}, 500);