'use strict'

import * as xpath from 'xpath'
import {Sample} from './sample'

export interface ItemInfo {
    id: string
    category: string
    device: string
    component: string
    itemNode: Node
    deviceNode: Node
    componentNode: Node
    type: string
    subType?: string
    streamType: string
}