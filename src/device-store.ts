/// <reference path="../typings/tsd.d.ts" />
'use strict'

import * as xpath from 'xpath'
import dom = require('xmldom')
import * as fs from 'fs'

export class DeviceStore{

    private probe:Document

    public loadXml(xml:string):void {
        this.probe = new dom.DOMParser().parseFromString(xml)
    }

    public loadXmlFile(filename:string):void {
        let content:string = fs.readFileSync(filename, 'utf8')
        this.probe = new dom.DOMParser().parseFromString(content)
    }

    public idsFromXPath(path:string):string[] {
        if(!this.probe) return null

        let returnValue:string[] = []
        let results:Node[] = xpath.useNamespaces({'m': 'urn:mtconnect.org:MTConnectDevices:1.3'})(path, this.probe)
        for(let i in results) returnValue.push(results[i].attributes['id'])
        
        return returnValue
    }

}