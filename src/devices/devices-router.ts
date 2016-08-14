/// <reference path="../../typings/tsd.d.ts" />
'use strict';

import Express = require('express');

class DevicesRouter{
    
    public constructor(){
    }
    
    public fetchAllDevices = (req: Express.Request, res: Express.Response, next: Function) => {
        res.send('all devices');
    }
    
    public fetchDevice = (req: Express.Request, res: Express.Response, next: Function) => {
        var name = req.params.device;
        res.send(`device ${name}`);
    }
    
}

export = DevicesRouter;