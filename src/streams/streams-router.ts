/// <reference path="../../typings/tsd.d.ts" />
'use strict';

import * as Express from 'express'
import {ItemStore} from '../item-store'

export class StreamsRouter {

    public constructor(private store: ItemStore) {

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
        let path: string = req.query['path']
        let at: number = req.query['at']
        //TODO: support interval, path
        let current = this.store.getCurrent(null, at)

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
        let samples = this.store.getSample(null, from, count);

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