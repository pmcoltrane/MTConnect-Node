/// <reference path="../typings/tsd.d.ts" />
'use strict'
import {Sample} from './sample.ts'

export class ItemStore {

    public firstSequence: number = 0
    public lastSequence: number = 0
    public nextSequence: number = 1

    public samples: { [id: string]: Sample[] } = {}

    public setSamples(sampleIds: string[]){
        for(let i in sampleIds) if(!this.samples.hasOwnProperty(i)){
            this.samples[i] = []
        }
    }

    public recordSample(sample: Sample): void {
        let newNextSequence = this.nextSequence + 1
        let newLastSequence = this.nextSequence

        sample.sequence = newLastSequence
        this.lastSequence = newLastSequence
        this.nextSequence = newNextSequence

        if (!this.samples[sample.id]) this.samples[sample.id] = []
        if (!sample.timestamp) sample.timestamp = new Date()
        this.samples[sample.id].push(sample)
    }

    public getSample(includeIds: string[], from: number = 0, count: number = 100): Sample[] {
        let returnValue: Sample[] = []
        let enough: boolean = false

        let checkId = (id: string): boolean => (includeIds && includeIds.length > 0) ? includeIds.indexOf(id) >= 0 : true

        for (let i in this.samples) if (checkId(i)) {
            let currentSamples = this.samples[i]
            for (let j in currentSamples) if (currentSamples[j].sequence >= from) {
                returnValue.push(currentSamples[j])
                if(returnValue.length >= count) break
            }
            if (returnValue.length >= count) break
        }

        return returnValue
    }

    public getCurrent(includeIds: string[], at?: number): Sample[] {
        let returnValue: Sample[] = []

        let checkId = (id: string): boolean => (includeIds && includeIds.length > 0) ? includeIds.indexOf(id) >= 0 : true

        for (let i in this.samples) if (checkId(i)) {
            let currentSamples = this.samples[i]

            if (at) {
                for (let j = currentSamples.length - 1; j >= 0; j--) if (currentSamples[j].sequence < at) {
                    returnValue.push(currentSamples[j])
                    break
                }
            }
            else {
                returnValue.push(currentSamples[currentSamples.length - 1])
            }
        }

        return returnValue
    }
}
