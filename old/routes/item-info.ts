import SampleInfo = require('./sample-info');

/**
 * DeviceInfo encapsulates all the data needed for a single item in a streams response.
 * Item data needs to be tied to its own attributes, along with its parent component and device.
 */
interface ItemInfo{
	id?:string;
	category?:string;
	name?:string;
	type?:string;
	subType?:string;
	componentId?:string;
	componentType?:string;
	componentName?:string;
	deviceId?:string;
	deviceName?:string;
	deviceUuid?:string;
	
	samples?:SampleInfo[];
}

export = ItemInfo;