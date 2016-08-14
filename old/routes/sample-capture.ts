import SampleInfo = require('./sample-info');

interface SampleCapture{
	firstSequence?:number;
	lastSequence?:number;
	nextSequence?:number;
	bufferSize?:number;
	
	samples?:SampleInfo[];
}

export = SampleCapture;