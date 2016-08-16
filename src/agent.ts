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

    private serializer: xmldom.XMLSerializer

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

        let devices: { [id: string]: Node } = {}
        let components: { [id: string]: Node } = {}

        for (let i in samples) {
            let info = this.deviceStore.getInfoFor(samples[i].id)
            if (!info) continue

            // Add device if not already present
            if (!devices.hasOwnProperty(info.device)) {
                let devInfo: any = {
                    uuid: info.deviceNode.attributes.getNamedItem('uuid').value
                }
                let nameAttr = info.deviceNode.attributes.getNamedItem('name')
                if (nameAttr) devInfo['name'] = nameAttr.value

                devices[info.device] = this.createElement(doc, 'DeviceStreams', devInfo)
            }

            // Add component if not already present
            if (!components.hasOwnProperty(info.component)) {
                let cInfo: any = {
                    component: info.componentNode.localName,
                    componentId: info.component
                }
                let nameAttr = info.deviceNode.attributes.getNamedItem('name')
                if (nameAttr) cInfo['name'] = nameAttr.value

                let cNode = this.createElement(doc, 'ComponentStream', cInfo)
                components[info.component] = cNode
                devices[info.device].appendChild(cNode)
                cNode.appendChild(doc.createElement('Samples'))
                cNode.appendChild(doc.createElement('Events'))
                cNode.appendChild(doc.createElement('Condition'))
            }

            // Create data item
            let elemInfo: { [name: string]: string } = {
                dataItemId: samples[i].id.toString(),
                timestamp: samples[i].timestamp.toISOString(),
                sequence: samples[i].sequence.toString()
            }
            let nameAttr = info.itemNode.attributes.getNamedItem('name')
            if (nameAttr) elemInfo['name'] = nameAttr.value
            if (info.subType) elemInfo['subType'] = info.subType
            if (info.category === 'CONDITION') elemInfo['type'] = info.type
            let elem = this.createElement(doc, info.category === 'CONDITION' ? this.deviceStore.toTitleCase(samples[i].condition) : info.streamType, elemInfo)
            if(samples[i].value) elem.textContent = samples[i].value.toString()

            switch (info.category) {
                case "SAMPLE":
                    components[info.component].childNodes[0].appendChild(elem)
                    break;
                case "EVENT":
                    components[info.component].childNodes[1].appendChild(elem)
                    break;
                case "CONDITION":
                    components[info.component].childNodes[2].appendChild(elem)
                    break;
                default:
                    components[info.component].childNodes[0].appendChild(elem)
                    break;
            }
        }

        let body = doc.createElement('Streams')
        doc.documentElement.appendChild(body)
        for (let i in devices) body.appendChild(devices[i])

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
        this.serializer = new xmldom.XMLSerializer()

        this.app.use('/sample', this.fetchSamples)
        this.app.use('/current', this.fetchCurrent)
        this.app.use('/:device', this.fetchDevice)
        this.app.use('/', this.fetchAllDevices)
        this.app.use(this.fallthrough)

        this.deviceStore.loadXmlFile('probe.xml')

        this.itemStore.recordSample({ id: 'x2', value: 100.00 })
        this.itemStore.recordSample({ id: 'x2', value: 101.00 })
        this.itemStore.recordSample({ id: 'x3', value: 7 })
        this.itemStore.recordSample({ id: 'x2', value: 102.03 })
        this.itemStore.recordSample({ id: 'x2', value: 103.1 })
        this.itemStore.recordSample({ id: 'x2', value: 104.30 })
        this.itemStore.recordSample({ id: 'x3', value: 7.1 })
        this.itemStore.recordSample({ id: 'x2', value: 105.20 })
        this.itemStore.recordSample({ id: 'system', condition: 'NORMAL'})
        this.itemStore.recordSample({ id: 'estop', value: 'ARMED'})
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
        let ids: string[] = this.deviceStore.idsFromXPath(path)
        let current = this.itemStore.getCurrent(ids, at)

        res
            .contentType('application/xml')
            .send(this.serializer.serializeToString(this.generateStreamsDocument(current)))
    }

    public fetchSamples = (req: Express.Request, res: Express.Response, next: Function) => {
        let path: string = req.query['path']
        let from: number = req.query['from']
        let count: number = req.query['count']
        let ids: string[] = this.deviceStore.idsFromXPath(path)
        let samples = this.itemStore.getSample(ids, from, count);

        res
            .contentType('application/xml')
            .send(this.serializer.serializeToString(this.generateStreamsDocument(samples)))
    }

}