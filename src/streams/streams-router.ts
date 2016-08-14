/// <reference path="../../typings/tsd.d.ts" />
'use strict';

import Express = require('express')
import {ItemStore} from '../item-store'

class DevicesRouter {

    private store: ItemStore;

    public constructor() {
        this.store = new ItemStore()

        this.store.recordSample({ id: 'x1', value: 100.00 })
        this.store.recordSample({ id: 'x1', value: 101.00 })
        this.store.recordSample({ id: 'z1', value: 7 })
        this.store.recordSample({ id: 'x1', value: 102.03 })
        this.store.recordSample({ id: 'x1', value: 103.1 })
        this.store.recordSample({ id: 'x1', value: 104.30 })
        this.store.recordSample({ id: 'z1', value: 7.1 })
        this.store.recordSample({ id: 'x1', value: 105.20 })
    }

    public fetchCurrent = (req: Express.Request, res: Express.Response, next: Function) => {
        let path: string = req.params['path']
        let at: number = req.params['at']
        //TODO: support interval
        let current = this.store.getCurrent(path, at)

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
        let path: string = req.params['path']
        let from: number = req.params['from']
        let count: number = req.params['count']

        //TODO: support interval
        let samples = this.store.getSample(path, from, count);

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

export = DevicesRouter;