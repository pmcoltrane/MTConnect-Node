var Agent = require('./agent.js').Agent;

var config = processArgs(process.argv.splice(2));

var a = new Agent(config);
//TODO: add an Agent.ready event

setTimeout(function(){
	// UNCOMMENT THE FOLLOWING LINES TO PRE-POPULATE x2 WITH DUMMY DATA
	/*
	a._storeSample('x2', 0.1234, new Date().toISOString());
	a._storeSample('x2', 0.4717, new Date().toISOString());
	a._storeSample('x2', 0.1415, new Date().toISOString());
	a._storeSample('x2', 0.7183, new Date().toISOString());
	a._storeSample('x2', 1.1234, new Date().toISOString());
	a._storeSample('x2', 5.6789, new Date().toISOString());
	*/

	a.listen();
	
	console.log('ready');
}, 500);

function processArgs(args){
	if(args.length===0) return;
	
	var ret = {}
	
	for(var i=0; i<args.length; i++){
		var tokens = args[i].split('=');
		switch(tokens[0].toUpperCase()){
			case 'PORT':
				if(!isNaN(tokens[1])){
					ret.port = tokens[1];
					console.log('Port: ' + ret.port);
				}
				break;
			case 'SENDER':
				ret.sender = tokens[1];
				console.log('Sender: ' + ret.sender);
				break;
			case 'DEVICES':
				ret.devicesFile = tokens[1];
				console.log('Devices: ' + ret.devicesFile);
			case 'ADAPTERS':
				ret.adaptersFile = tokens[1];
				console.log('Adapters: ' + ret.adaptersFile);
			default:
				break;
		}
	}
	
	return ret;
}