/// <reference path="../typings/tsd.d.ts" />
'use strict';

import {Agent} from './agent';
import Http = require('http');

var config = require('../conf/agent.json');
var port = config['server']['port'] || 8000;
var agent = new Agent();

Http.createServer(agent.app).listen(port);