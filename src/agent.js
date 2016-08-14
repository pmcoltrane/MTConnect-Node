'use strict';
var Express = require('express');
var DevicesRouter = require('./devices/devices-router');
var StreamsRouter = require('./streams/streams-router');
var Agent = (function () {
    function Agent() {
        this.sender = 'mtconnect-node';
        this.version = '1.2.0.0';
        this.bufferSize = 0;
        this.root = function (req, res, next) {
            console.log(req);
            res.status(200).send('root');
        };
        this.fallthrough = function (req, res, next) {
            res.status(404).send('not found!');
        };
        this.app = Express();
        this.devices = new DevicesRouter();
        this.streams = new StreamsRouter();
        this.app.use('/sample', this.streams.fetchSamples);
        this.app.use('/current', this.streams.fetchCurrent);
        this.app.use('/:device', this.devices.fetchDevice);
        this.app.use('/', this.devices.fetchAllDevices);
        this.app.use(this.fallthrough);
    }
    return Agent;
}());
module.exports = Agent;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWdlbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJhZ2VudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7QUFDYixJQUFPLE9BQU8sV0FBVyxTQUFTLENBQUMsQ0FBQztBQUNwQyxJQUFPLGFBQWEsV0FBVywwQkFBMEIsQ0FBQyxDQUFDO0FBQzNELElBQU8sYUFBYSxXQUFXLDBCQUEwQixDQUFDLENBQUM7QUFFM0Q7SUFXSTtRQUpPLFdBQU0sR0FBVyxnQkFBZ0IsQ0FBQztRQUNsQyxZQUFPLEdBQVcsU0FBUyxDQUFDO1FBQzVCLGVBQVUsR0FBVyxDQUFDLENBQUM7UUFjdkIsU0FBSSxHQUFHLFVBQUMsR0FBb0IsRUFBRSxHQUFxQixFQUFFLElBQWM7WUFDdEUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNqQixHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNqQyxDQUFDLENBQUE7UUFFTSxnQkFBVyxHQUFHLFVBQUMsR0FBb0IsRUFBRSxHQUFxQixFQUFFLElBQWM7WUFDN0UsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDdkMsQ0FBQyxDQUFBO1FBbEJHLElBQUksQ0FBQyxHQUFHLEdBQUcsT0FBTyxFQUFFLENBQUM7UUFDckIsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLGFBQWEsRUFBRSxDQUFDO1FBQ25DLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxhQUFhLEVBQUUsQ0FBQztRQUVuQyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUNuRCxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUNwRCxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUNuRCxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxlQUFlLENBQUMsQ0FBQztRQUNoRCxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7SUFDbkMsQ0FBQztJQVdMLFlBQUM7QUFBRCxDQUFDLEFBaENELElBZ0NDO0FBRUQsaUJBQVMsS0FBSyxDQUFDIn0=