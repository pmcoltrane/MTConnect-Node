'use strict';
import Express = require('express');
import DevicesRouter = require('./devices/devices-router');
import StreamsRouter = require('./streams/streams-router');

class Agent{
    
    public app: Express.Express;
    
    private devices: DevicesRouter;
    private streams: StreamsRouter;
    
    public sender: string = 'mtconnect-node';
    public version: string = '1.2.0.0';
    public bufferSize: number = 0;
    
    public constructor(){
        this.app = Express();
        this.devices = new DevicesRouter();
        this.streams = new StreamsRouter();
        
        this.app.use('/sample', this.streams.fetchSamples);
        this.app.use('/current', this.streams.fetchCurrent);
        this.app.use('/:device', this.devices.fetchDevice);
        this.app.use('/', this.devices.fetchAllDevices);
        this.app.use(this.fallthrough);
    }
    
    public root = (req: Express.Request, res: Express.Response, next: Function) => {
        console.log(req);
        res.status(200).send('root');
    }
    
    public fallthrough = (req: Express.Request, res: Express.Response, next: Function) => {
        res.status(404).send('not found!');
    }
    
}

export = Agent;