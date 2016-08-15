/// <reference path="../../typings/tsd.d.ts" />
'use strict';

import * as Express from 'express'
import {DeviceStore} from '../device-store'

export class DevicesRouter{

    public constructor(private store: DeviceStore){
        this.store.loadXmlFile('./probe.xml')
        let foo = this.store.idsFromXPath('//DataItem')
        console.log(foo)
    }
    
    public fetchAllDevices = (req: Express.Request, res: Express.Response, next: Function) => {
        res.send('all devices')
    }
    
    public fetchDevice = (req: Express.Request, res: Express.Response, next: Function) => {
        var name = req.params.device
        res.send(`device ${name}`)
    }
    
}