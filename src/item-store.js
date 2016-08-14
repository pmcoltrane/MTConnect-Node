/// <reference path="../typings/tsd.d.ts" />
'use strict';
var ItemStore = (function () {
    function ItemStore() {
        this.firstSequence = 0;
        this.lastSequence = 0;
        this.nextSequence = 1;
        this.samples = {};
    }
    ItemStore.prototype.setSamples = function (sampleIds) {
        for (var i in sampleIds)
            if (!this.samples.hasOwnProperty(i)) {
                this.samples[i] = [];
            }
    };
    ItemStore.prototype.recordSample = function (sample) {
        var newNextSequence = this.nextSequence + 1;
        var newLastSequence = this.nextSequence;
        sample.sequence = newLastSequence;
        this.lastSequence = newLastSequence;
        this.nextSequence = newNextSequence;
        if (!this.samples[sample.id])
            this.samples[sample.id] = [];
        if (!sample.timestamp)
            sample.timestamp = new Date();
        this.samples[sample.id].push(sample);
    };
    ItemStore.prototype.getSample = function (includeIds, from, count) {
        if (from === void 0) { from = 0; }
        if (count === void 0) { count = 100; }
        var returnValue = [];
        var enough = false;
        var checkId = function (id) { return (includeIds && includeIds.length > 0) ? includeIds.indexOf(id) >= 0 : true; };
        for (var i in this.samples)
            if (checkId(i)) {
                var currentSamples = this.samples[i];
                for (var j in currentSamples)
                    if (currentSamples[j].sequence >= from) {
                        returnValue.push(currentSamples[j]);
                        if (returnValue.length >= count)
                            enough = true;
                    }
                if (enough)
                    break;
            }
        return returnValue;
    };
    ItemStore.prototype.getCurrent = function (includeIds, at) {
        var returnValue = [];
        var checkId = function (id) { return (includeIds && includeIds.length > 0) ? includeIds.indexOf(id) >= 0 : true; };
        for (var i in this.samples)
            if (checkId(i)) {
                var currentSamples = this.samples[i];
                if (at) {
                    for (var j = currentSamples.length - 1; j >= 0; j--)
                        if (currentSamples[j].sequence < at) {
                            returnValue.push(currentSamples[j]);
                            break;
                        }
                }
                else {
                    returnValue.push(currentSamples[currentSamples.length - 1]);
                }
            }
        return returnValue;
    };
    return ItemStore;
}());
exports.ItemStore = ItemStore;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaXRlbS1zdG9yZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIml0ZW0tc3RvcmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsNENBQTRDO0FBQzVDLFlBQVksQ0FBQTtBQUdaO0lBQUE7UUFFVyxrQkFBYSxHQUFXLENBQUMsQ0FBQTtRQUN6QixpQkFBWSxHQUFXLENBQUMsQ0FBQTtRQUN4QixpQkFBWSxHQUFXLENBQUMsQ0FBQTtRQUV4QixZQUFPLEdBQStCLEVBQUUsQ0FBQTtJQTREbkQsQ0FBQztJQTFEVSw4QkFBVSxHQUFqQixVQUFrQixTQUFtQjtRQUNqQyxHQUFHLENBQUEsQ0FBQyxJQUFJLENBQUMsSUFBSSxTQUFTLENBQUM7WUFBQyxFQUFFLENBQUEsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUEsQ0FBQztnQkFDeEQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUE7WUFDeEIsQ0FBQztJQUNMLENBQUM7SUFFTSxnQ0FBWSxHQUFuQixVQUFvQixNQUFjO1FBQzlCLElBQUksZUFBZSxHQUFHLElBQUksQ0FBQyxZQUFZLEdBQUcsQ0FBQyxDQUFBO1FBQzNDLElBQUksZUFBZSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUE7UUFFdkMsTUFBTSxDQUFDLFFBQVEsR0FBRyxlQUFlLENBQUE7UUFDakMsSUFBSSxDQUFDLFlBQVksR0FBRyxlQUFlLENBQUE7UUFDbkMsSUFBSSxDQUFDLFlBQVksR0FBRyxlQUFlLENBQUE7UUFFbkMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQTtRQUMxRCxFQUFFLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUM7WUFBQyxN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