'use strict'

export interface Sample{
    id: string
    timestamp?: Date
    sequence?: number
    condition?: string
    value?: number | string 
}