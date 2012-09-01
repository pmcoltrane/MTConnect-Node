/** 
Data items:

xp - actual position mm
zp - actual position mm

cspd - actual spindle speed RPM
cso - spindle override percent
rf - rotary mode SPINDLE|INDEX

pgm - program
blk - block
ln - line
pf - actual feedrate mm/s
pfs - feedrate override percent
pp - path position mm 3d
exec - execution mode
cm - controller mode
**/

var http = require('http');

var host = 'localhost';
var port = 8080;
var path = '/store';
var updateUrl = 'localhost:8080/store';



function SinAxis(id, host, port, path, amplitude, frequency){
	this.id = id;
	
	this.host = host;
	this.port = port;
	this.path = path;
	
	this.amplitude = amplitude;
	this.frequency = frequency;
	this.value = null;
	this.enabled = false;
	this.updateTimer = null;
	this.ticks = 0;
	this.lastTime = null;
	this.enable = SinAxis.prototype.enable;
	this.disable = SinAxis.prototype.disable;
	this.update = SinAxis.prototype.update;
}

SinAxis.prototype.enable = function(){
	this.disable();
	this.lastTime = new Date().getTime();
	var that = this;
	this.updateTimer = setInterval(
		function(){
			var now = new Date().getTime();
			var diff = now - that.lastTime;
			that.lastTime = now;
			that.ticks += diff;
			
			that.value = that.amplitude * Math.sin(that.frequency * that.ticks);
			
			var options = {
				host: that.host,
				port: that.port,
				path: that.path + '?id=' + that.id + '&timestamp=' + new Date(now).toISOString() + '&value=' + that.value,
				method: 'GET'
			};
			
			
			console.log(options);
			
			var req = http.request(options, function(result){
				console.log('Result: ' + result.statusCode);
			});
			
			req.on('error', function(e) {
				console.log('Problem with request: ' + e.message);
			});
			
			req.end();
		}, 
		1000
	);
}

SinAxis.prototype.disable = function(){
	if(this.updateTimer!==null){
		clearInterval(this.updateTimer);
		this.updateTimer = null;
	}
}


var xp = new SinAxis('xp', host, port, path, 100, 1);
xp.enable();

var zp = new SinAxis('zp', host, port, path, 50, 5);
zp.enable();