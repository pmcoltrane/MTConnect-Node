import ItemInfo = require('./item-info');
import Promise = require('bluebird');
var xmldom = require('xmldom');
import xpath = require('xpath');

// Stores sufficient data to match up a DataItem ID to its parent component and device
// Using the structure specified in the provided XML document.
/**
 * DeviceStore stores the 'probe' document, along with sufficient structure to 
 */
class ItemStore{
	
	private _document:XMLDocument;
	private _itemData:{[id:string]:ItemInfo} = {}; 
	private _itemDataArray:ItemInfo[] = [];
	
	constructor(document:XMLDocument){
		this._document = document;
		var devices:NodeList = document.getElementsByTagName('Device');
	
		// Extract just enough structure to fill stream requests.
		// That's the device and parent component for each data item.	
		for(var i=0; i<devices.length; i++){
			var device = <Element>devices[i];
			var deviceId = device.getAttribute('id');
			var deviceName = device.getAttribute('name');
			var deviceUuid = device.getAttribute('uuid');
		
			var items = device.getElementsByTagName('DataItem');
			for(var j=0; j<items.length; j++){
				var item = <Element>items[j];
				var id = item.getAttribute('id');
				var category = item.getAttribute('category');
				var name = item.getAttribute('name');
				var type = item.getAttribute('type');
				var subType = item.getAttribute('subType');
				
				// Immediate parent is the <DataItems> node
				// Component node is the parent of that
				var component = <Element>item.parentNode.parentNode;
				var componentId = component.getAttribute('id');
				var componentType = component.tagName;
				var componentName = component.getAttribute('name');
				
				 var info:ItemInfo = {
					id: id, 
					category: category,
					name: name,
					type: type,
					subType: subType,
					componentId: componentId,
					componentType: componentType,
					componentName: componentName,
					deviceId: deviceId,
					deviceName: deviceName,
					deviceUuid: deviceUuid
				}
				
				this._itemData[id] = info;
				this._itemDataArray.push(info);
			}	
		}
	}
	
	public selectItems = ():Promise<ItemInfo[]> => {
		return Promise.all(this._itemDataArray);
	}
	
	public selectItemsFromXPath = (path:string):Promise<ItemInfo[]> => {
		var self = this;
		
		var nodes = xpath.select(path, self._document);
		return Promise.map(nodes, (node) => {
			var id =  (<Element>node).getAttribute('id');
			return self._itemData[id];
		});
	}
	
}

export = ItemStore;