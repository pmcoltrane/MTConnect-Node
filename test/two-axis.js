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

var ticks = 0;
var lastUpdate = new Date().getTime();
setInterval(mainLoop, 100);

var x = 0;
var z = 0;

var spindleSpeed = '180';
var spindleOverride = '100';
var rf = 'SPINDLE';

var program = '';
var blk = '';
var line = 0;
var pathFeedrate = '100';
var pathFeedrateOverride = '100';
var pathPosition = '0 0 0';
var executionMode = 'ACTIVE';	//READY, ACTIVE, INTERRUPTED, STOPPED
var controllerMode = 'AUTOMATIC';	//AUTOMATIC, SEMI_AUTOMATIC, MANUAL, MANUAL_DATA_INPUT, FEED_HOLD



function mainLoop(){
	var delta = (new Date().getTime()) - lastUpdate;
	ticks += delta;
	lastUpdate = new Date().getTime();

	updateAxes(delta);
	updateSpindle(delta);
	updateController(delta);
}

function loadInitial(){

}

function updateAxes(delta){
	x = 10 * Math.sin(x);
	z = 100 * Math.cos(z) + 100;
	
	
}

function updateSpindle(delta){

}

function updateController(delta){
	line += 1;
	pathPosition = x + ' 0 ' + z;
}