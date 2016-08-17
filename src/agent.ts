'use strict'
import * as Express from 'express'
import * as BodyParser from 'body-parser'
import {DeviceStore} from './device-store'
import {ItemStore} from './item-store'
import {Sample} from './sample'
import * as xmldom from 'xmldom'
import * as xpath from 'xpath'
import {ProtocolError, ProtocolErrors} from './error'

export class Agent {

    public app: Express.Express

    public sender: string = 'mtconnect-node'
    public version: string = '1.2.0.0'
    public bufferSize: number = 0
    private instanceId: number = 0

    private deviceStore: DeviceStore
    private itemStore: ItemStore

    private serializer: xmldom.XMLSerializer

    private generateDevicesDocument(devices: Node[]): Document {
        let doc = new xmldom.DOMParser().parseFromString('<MTConnectDevices/>')
        let header = this.createElement(doc, 'Header', {
            creationTime: new Date().toISOString(),
            sender: this.sender,
            instanceId: this.instanceId.toString(),
            version: this.version,
            bufferSize: this.bufferSize.toString(),
            assetBufferSize: "0",
            assetCount: "0"
        })
        doc.documentElement.appendChild(header)

        let body = doc.createElement("Devices")
        doc.documentElement.appendChild(body)

        for (let elem of devices) body.appendChild(elem)

        return doc
    }

    private generateErrorDocument(errors: ProtocolError[]): Document {
        let doc = new xmldom.DOMParser().parseFromString('<MTConnectError/>')
        let header = this.createElement(doc, 'Header', {
            creationTime: new Date().toISOString(),
            sender: this.sender,
            version: this.version,
            bufferSize: this.bufferSize.toString(),
            instanceId: this.instanceId.toString()
        })
        doc.documentElement.appendChild(header)

        let body = doc.createElement('Errors')
        doc.documentElement.appendChild(body)

        for (let err of errors) {
            let node = this.createElement(doc, 'Error', {
                errorCode: err.errorCode
            })
            if (err.errorDescription) node.textContent = err.errorDescription
            body.appendChild(node)
        }

        return doc
    }

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
                let nameAttr = info.componentNode.attributes.getNamedItem('name')
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
            if (samples[i].value) elem.textContent = samples[i].value.toString()

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

        // Remove empty Samples, Events, Condition tags
        let nodesToRemove: Node[] = []
        for (let i in components) for (let j = 0; j < components[i].childNodes.length; j++) {
            let node = components[i].childNodes.item(j)
            if (node.childNodes.length === 0)
                nodesToRemove.push(node)
        }
        for (let i in nodesToRemove) nodesToRemove[i].parentNode.removeChild(nodesToRemove[i])

        // Finish generating document
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

    public constructor(devicePath: string) {
        this.app = Express()
        this.deviceStore = new DeviceStore()
        this.itemStore = new ItemStore()
        this.serializer = new xmldom.XMLSerializer()

        this.app.get('/sample', this.fetchSamples)
        this.app.get('/current', this.fetchCurrent)
        this.app.get('/:device', this.fetchDevice)
        this.app.post('/:device', BodyParser.urlencoded({ type: 'application/x-www-form-urlencoded', extended: false }), this.recordSamples)
        this.app.get('/', this.fetchAllDevices)
        this.app.use(this.fallthrough)
        this.app.use(this.internalErrorHandler)

        this.deviceStore.loadXmlFile(devicePath)

        this.itemStore.recordSample({ id: 'x2', value: 100.00 })
        this.itemStore.recordSample({ id: 'x2', value: 101.00 })
        this.itemStore.recordSample({ id: 'x3', value: 7 })
        this.itemStore.recordSample({ id: 'x2', value: 102.03 })
        this.itemStore.recordSample({ id: 'x2', value: 103.1 })
        this.itemStore.recordSample({ id: 'x2', value: 104.30 })
        this.itemStore.recordSample({ id: 'x3', value: 7.1 })
        this.itemStore.recordSample({ id: 'x2', value: 105.20 })
        this.itemStore.recordSample({ id: 'system', condition: 'NORMAL' })
        this.itemStore.recordSample({ id: 'estop', value: 'ARMED' })
    }

    public root = (req: Express.Request, res: Express.Response, next: Function) => {
        console.log(req)
        res.status(200).send('root')
    }

    public fallthrough = (req: Express.Request, res: Express.Response, next: Function) => {
        res.status(404).send('not found!')
    }

    public internalErrorHandler = (err: Error, req: Express.Request, res: Express.Response, next: Function) => {
        let doc = this.generateErrorDocument([ProtocolErrors.internalError])
        res.contentType('application/xml').send(this.serializer.serializeToString(doc))
    }

    public fetchAllDevices = (req: Express.Request, res: Express.Response, next: Function) => {
        let devices = this.deviceStore.getDevices(null)
        let doc = this.generateDevicesDocument(devices)
        res
            .contentType('application/xml')
            .send(this.serializer.serializeToString(doc))
    }

    public fetchDevice = (req: Express.Request, res: Express.Response, next: Function) => {
        let name = req.params.device
        let devices = this.deviceStore.getDevices(name)
        let doc: Document

        if (!devices || devices.length === 0) {
            let doc = this.generateErrorDocument([ProtocolErrors.noDevice])
        }
        else {
            let doc = this.generateDevicesDocument(devices)
        }
        res
            .contentType('application/xml')
            .send(this.serializer.serializeToString(doc))
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
        let samples = this.itemStore.getSample(ids, from, count)

        res
            .contentType('application/xml')
            .send(this.serializer.serializeToString(this.generateStreamsDocument(samples)))
    }

    public recordSamples = (req: Express.Request, res: Express.Response, next: Function) => {
        // FIXME: verify ids in advance
        // Report an error on failure, or a success document on success
        for (let i in req.body) {
            let info = this.deviceStore.getInfoFor(i)
            if (info && info.deviceNode.attributes.getNamedItem('name').value === req.params['device']) {
                this.itemStore.recordSample({
                    id: i,
                    value: req.body[i]
                })
            }
        }
        res.sendStatus(204)
    }

}