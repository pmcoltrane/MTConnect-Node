/// <reference path="../typings/tsd.d.ts" />
'use strict'
import {Sample} from './sample.ts'

export class ItemStore{

    public firstSequence: number = 0
    public lastSequence: number = 0
    public nextSequence: number = 1

    public samples:{[id:string]:Sample[]} = {}


    public recordSample = (sample: Sample): void => {
        let newNextSequence = this.nextSequence + 1
        let newLastSequence = this.nextSequence

        sample.sequence = newLastSequence
        this.lastSequence = newLastSequence
        this.nextSequence = newNextSequence

        if(!this.samples[sample.id]) this.samples[sample.id] = []
        if(!sample.timestamp) sample.timestamp = new Date()
        this.samples[sample.id].push(sample)
    }

    public getSample(path?:string, from:number = 0, count:number = 100): Sample[] {
        let returnValue: Sample[] = []
        let enough: boolean = false

        //TODO: filter path
        for(let i in this.samples){
            for(let j in this.samples[i]){
                if (this.samples[i][j].sequence >= from){
                    returnValue.push(this.samples[i][j]);
                    if(returnValue.length >= count) enough = true;
                }
            }
            if(enough) break;
        }

        return returnValue;
    }

    public getCurrent(path?:string, at?:number): Sample[] {
        let returnValue: Sample[] = []

        for(let i in this.samples){
            if(at){
                for(let j = this.samples[i].length - 1; j>=0; j--){
                    if(this.samples[i][j].sequence<at){
                        returnValue.push(this.samples[i][j])
                        continue
                    }
                }
            }
            else{
                returnValue.push(this.samples[i][this.samples[i].length-1])
            }
        }

        return returnValue
    }
}
