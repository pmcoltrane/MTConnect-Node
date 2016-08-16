/// <reference path="../typings/tsd.d.ts" />
'use strict'

import * as xpath from 'xpath'
import dom = require('xmldom')
import * as fs from 'fs'
import * as streamInfo from './stream-info'

export class DeviceStore {

    private probe: Document
    private lookup: {[name:string]:streamInfo.ItemInfo} = {}

    private probeTypeToStreamType(name:string):string{
        let tokens = name.split('-')
        for(let i in tokens){
            tokens[i] = this.toTitleCase(tokens[i])
        }
        return tokens.join('')
    }

    public toTitleCase(text:string):string{
        if(!text) return text
        if(text.length === 1) return text.toUpperCase()

        return text.substr(0, 1).toUpperCase() + text.substr(1).toLowerCase()
    }

    public loadXml(xml: string): void {
        this.probe = new dom.DOMParser().parseFromString(xml) 
        let select = xpath.useNamespaces({ 'm': 'urn:mtconnect.org:MTConnectDevices:1.3' })
        let results: Node[] = select('//m:DataItem', this.probe)

        for (let i in results) {
            let component = results[i].parentNode.parentNode
            let device: Node = component
            while (device.localName !== 'Device') device = device.parentNode

            let itemId = results[i].attributes.getNamedItem('id').value
            let componentId = component.attributes.getNamedItem('id').value
            let deviceId = device.attributes.getNamedItem('id').value
            this.lookup[itemId] = {
                id: itemId,
                component: componentId,
                device: deviceId,
                category: results[i].attributes.getNamedItem('category').value,
                itemNode: results[i],
                deviceNode: device,
                componentNode: component,
                type: results[i].attributes.getNamedItem('type').value,
                streamType: this.probeTypeToStreamType(results[i].attributes.getNamedItem('type').value)
            }
            let subTypeAttr = device.attributes.getNamedItem('subType')
            if(subTypeAttr) this.lookup[itemId].subType = subTypeAttr.value
        }  
    }

    public loadXmlFile(filename: string): void {
        let content: string = fs.readFileSync(filename, 'utf8')
        this.loadXml(content)
    }

    public idsFromXPath(path: string): string[] {
        if (!this.probe) return null
        if (!path) return null

        let returnValue: string[] = []
        let results: Node[] = xpath.useNamespaces({ 'm': 'urn:mtconnect.org:MTConnectDevices:1.3' })(path, this.probe)
        for (let i in results) returnValue.push(results[i].attributes['id'])

        return returnValue
    }

    public getInfoFor(id: string): streamInfo.ItemInfo {
        return this.lookup[id]
    }

}