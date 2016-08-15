'use strict'
import * as Express from 'express'
import {DeviceStore} from './device-store'
import {ItemStore} from './item-store'

export class Agent{
    
    public app: Express.Express
    
    public sender: string = 'mtconnect-node'
    public version: string = '1.2.0.0'
    public bufferSize: number = 0

    private deviceStore: DeviceStore
    private itemStore: ItemStore
    
    public constructor(){
        this.app = Express()
        this.deviceStore = new DeviceStore()
        this.itemStore = new ItemStore()

        this.app.use('/sample', this.fetchSamples)
        this.app.use('/current', this.fetchCurrent)
        this.app.use('/:device', this.fetchDevice)
        this.app.use('/', this.fetchAllDevices)
        this.app.use(this.fallthrough)

        this.itemStore.recordSample({ id: 'x1', value: 100.00 })
        this.itemStore.recordSample({ id: 'x1', value: 101.00 })
        this.itemStore.recordSample({ id: 'z1', value: 7 })
        this.itemStore.recordSample({ id: 'x1', value: 102.03 })
        this.itemStore.recordSample({ id: 'x1', value: 103.1 })
        this.itemStore.recordSample({ id: 'x1', value: 104.30 })
        this.itemStore.recordSample({ id: 'z1', value: 7.1 })
        this.itemStore.recordSample({ id: 'x1', value: 105.20 })
    }
    
    public root = (req: Express.Request, res: Express.Response, next: Function) => {
        console.log(req)
        res.status(200).send('root')
    }
    
    public fallthrough = (req: Express.Request, res: Express.Response, next: Function) => {
        res.status(404).send('not found!')
    }

    public fetchAllDevices = (req: Express.Request, res: Express.Response, next: Function) => {
        res.send('all devices')
    }
    
    public fetchDevice = (req: Express.Request, res: Express.Response, next: Function) => {
        var name = req.params.device
        res.send(`device ${name}`)
    }

    public fetchCurrent = (req: Express.Request, res: Express.Response, next: Function) => {
        let path: string = req.query['path']
        let at: number = req.query['at']
        //TODO: support interval, path
        let current = this.itemStore.getCurrent(null, at)

        let dbg: string = ''
        for (let i in current) {
            dbg += current[i].sequence
                + '\t' + current[i].id
                + '\t' + current[i].timestamp
                + '\t' + current[i].value
                + '\n'
        }
        res.send(dbg)
    }

    public fetchSamples = (req: Express.Request, res: Express.Response, next: Function) => {
        let path: string = req.query['path']
        let from: number = req.query['from']
        let count: number = req.query['count']

        //TODO: support interval, path
        let samples = this.itemStore.getSample(null, from, count);

        let dbg: string = ''
        for (let i in samples) {
            dbg += samples[i].sequence
                + '\t' + samples[i].id
                + '\t' + samples[i].timestamp
                + '\t' + samples[i].value
                + '\n'
        }
        res.send(dbg);
    }
    
}