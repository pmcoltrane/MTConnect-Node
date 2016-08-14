/// <reference path="../../typings/tsd.d.ts" />
'use strict';
var DevicesRouter = (function () {
    function DevicesRouter() {
        this.fetchAllDevices = function (req, res, next) {
            res.send('all devices');
        };
        this.fetchDevice = function (req, res, next) {
            var name = req.params.device;
            res.send("device " + name);
        };
    }
    return DevicesRouter;
}());
module.exports = DevicesRouter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGV2aWNlcy1yb3V0ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJkZXZpY2VzLXJvdXRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwrQ0FBK0M7QUFDL0MsWUFBWSxDQUFDO0FBSWI7SUFFSTtRQUdPLG9CQUFlLEdBQUcsVUFBQyxHQUFvQixFQUFFLEdBQXFCLEVBQUUsSUFBYztZQUNqRixHQUFHLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQzVCLENBQUMsQ0FBQTtRQUVNLGdCQUFXLEdBQUcsVUFBQyxHQUFvQixFQUFFLEdBQXFCLEVBQUUsSUFBYztZQUM3RSxJQUFJLElBQUksR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQztZQUM3QixHQUFHLENBQUMsSUFBSSxDQUFDLFlBQVUsSUFBTSxDQUFDLENBQUM7UUFDL0IsQ0FBQyxDQUFBO0lBVEQsQ0FBQztJQVdMLG9CQUFDO0FBQUQsQ0FBQyxBQWRELElBY0M7QUFFRCxpQkFBUyxhQUFhLENBQUMifQ==