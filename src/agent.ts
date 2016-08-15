'use strict'
import * as Express from 'express'
import {DeviceStore} from './device-store'
import {ItemStore} from './item-store'
import {Sample} from './sample'
import * as xmldom from 'xmldom'

export class Agent {

    public app: Express.Express

    public sender: string = 'mtconnect-node'
    public version: string = '1.2.0.0'
    public bufferSize: number = 0
    private instanceId: number = 0

    private deviceStore: DeviceStore
    private itemStore: ItemStore

    private generateStreamsDocument(samples: Sample[]): Document {
        samples = samples.sort((a, b) => a.sequence - b.sequence)
        let doc = new xmldom.DOMParser().parseFromString('<MTConnectStreams/>')
        let header = this.createElement(doc, 'Header', {
            creationTime: new Date().toISOString(),
            sender: this.sender,
            instanceId: this.instanceId.toString(),
            version: this.version,
            bufferSize: this.bufferSize.toString(),
            firstSequence: (samples[0].sequence).toString(),
            lastSequence: (samples[samples.length - 1].sequence).toString(),
            nextSequence: (samples[samples.length - 1].sequence + 1).toString()
        })
        doc.documentElement.appendChild(header)

        let body = doc.createElement('Debug')
        for(let i in samples){
            let elem = this.createElement(doc, 'DebugItem', {
                id: samples[i].id.toString(),
                timestamp: samples[i].timestamp.toISOString(),
                sequence: samples[i].sequence.toString()
            })
            elem.textContent = samples[i].value.toString()
            body.appendChild(elem)
        }
        doc.documentElement.appendChild(body)

        //TODO: the actual data in proper format

        return doc
    }

    private createElement(doc: Document, name: string, attributes: { [name: string]: string }): Node {
        let elem = doc.createElement(name)
        for (let i in attributes) elem.setAttribute(i, attributes[i])
        return elem
    }

    public constructor() {
        this.app = Express()
        this.deviceStore = new DeviceStore()
        this.itemStore = new ItemStore()

        this.app.use('/sample', this.fetchSamples)
        this.app.use('/current', this.fetchCurrent)
        this.app.use('/:device', this.fetchDevice)
        this.app.use('/', this.fetchAllDevices)
        this.app.use(this.fallthrough)

        this.deviceStore.loadXmlFile('probe.xml')

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
        if (path) {
            var foo = this.deviceStore.idsFromXPath(path)
            console.log(foo)
        }
        let current = this.itemStore.getCurrent(null, at)


        res
        .contentType('application/xml')
        .send(new xmldom.XMLSerializer().serializeToString(this.generateStreamsDocument(current)))
    }

    public fetchSamples = (req: Express.Request, res: Express.Response, next: Function) => {
        let path: string = req.query['path']
        let from: number = req.query['from']
        let count: number = req.query['count']

        //TODO: support interval, path
        let samples = this.itemStore.getSample(null, from, count);

        res
        .contentType('application/xml')
        .send(new xmldom.XMLSerializer().serializeToString(this.generateStreamsDocument(samples)))
    }

}