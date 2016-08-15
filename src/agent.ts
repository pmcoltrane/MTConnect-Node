'use strict'
import * as Express from 'express'
import {DevicesRouter} from './devices/devices-router'
import {StreamsRouter} from './streams/streams-router'
import {DeviceStore} from './device-store'
import {ItemStore} from './item-store'

export class Agent{
    
    public app: Express.Express
    
    private devices: DevicesRouter
    private streams: StreamsRouter
    
    public sender: string = 'mtconnect-node'
    public version: string = '1.2.0.0'
    public bufferSize: number = 0

    private deviceStore: DeviceStore
    private itemStore: ItemStore
    
    public constructor(){
        this.app = Express()
        this.deviceStore = new DeviceStore()
        this.itemStore = new ItemStore()

        this.devices = new DevicesRouter(this.deviceStore)
        this.streams = new StreamsRouter(this.itemStore)

        this.app.use('/sample', this.streams.fetchSamples)
        this.app.use('/current', this.streams.fetchCurrent)
        this.app.use('/:device', this.devices.fetchDevice)
        this.app.use('/', this.devices.fetchAllDevices)
        this.app.use(this.fallthrough)
    }
    
    public root = (req: Express.Request, res: Express.Response, next: Function) => {
        console.log(req)
        res.status(200).send('root')
    }
    
    public fallthrough = (req: Express.Request, res: Express.Response, next: Function) => {
        res.status(404).send('not found!')
    }
    
}