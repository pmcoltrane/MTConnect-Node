/// <reference path="../typings/tsd.d.ts" />
'use strict';
var Agent = require('./agent');
var Http = require('http');
var config = require('../conf/agent.json');
var port = config['server']['port'] || 8000;
var agent = new Agent();
Http.createServer(agent.app).listen(port);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXBwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDRDQUE0QztBQUM1QyxZQUFZLENBQUM7QUFFYixJQUFPLEtBQUssV0FBVyxTQUFTLENBQUMsQ0FBQztBQUNsQyxJQUFPLElBQUksV0FBVyxNQUFNLENBQUMsQ0FBQztBQUU5QixJQUFJLE1BQU0sR0FBRyxPQUFPLENBQUMsb0JBQW9CLENBQUMsQ0FBQztBQUMzQyxJQUFJLElBQUksR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksSUFBSSxDQUFDO0FBQzVDLElBQUksS0FBSyxHQUFHLElBQUksS0FBSyxFQUFFLENBQUM7QUFFeEIsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDIn0=