var async = require('async');
var ItemStore = (function () {
    function ItemStore() {
        var _this = this;
        this._items = {};
        this._firstSequence = 0;
        this._nextSequence = 1;
        this._totalItems = 0;
        this.load = function (xmldoc) {
            // Probe data has changed. Reset everything.
            _this._items = {};
            var devices = xmldoc.getElementsByTagName('Device');
            for (var j = 0; j < devices.length; j++) {
                var device = devices[j];
                var deviceId = device.getAttribute('id');
                var deviceName = device.getAttribute('name');
                var deviceUuid = device.getAttribute('uuid');
                // Get DataItems
                var items = device.getElementsByTagName('DataItem');
                for (var i = 0; i < items.length; i++) {
                    var item = items[i];
                    var id = item.getAttribute('id');
                    var category = item.getAttribute('category');
                    var name = item.getAttribute('name');
                    var type = item.getAttribute('type');
                    var subType = item.getAttribute('subType');
                    var component = item.parentNode.parentNode;
                    var componentId = component.getAttribute('id');
                    var componentType = component.tagName;
                    var componentName = component.getAttribute('name');
                    _this._items[id] = {
                        id: id,
                        category: category,
                        name: name,
                        type: type,
                        subType: subType,
                        componentId: componentId,
                        componentType: componentType,
                        componentName: componentName,
                        deviceId: deviceId,
                        deviceName: deviceName,
                        deviceUuid: deviceUuid,
                        samples: [] };
                }
            }
        };
        this.getSample = function (response, dataItems, from, count, callback) {
            var self = _this;
            try {
                var fromInvalid = (from !== undefined) && (isNaN(from)); // from-parameter invalid if specified but not a number
                var fromOutOfRange = (!fromInvalid) && (from !== undefined) && ((from < 0) || (from >= _this.nextSequence)); // from-parameter out of range if valid, specified, but not between [firstSequence, nextSequence)
                if (fromInvalid)
                    callback(['INVALID_REQUEST'], response, null);
                if (fromOutOfRange)
                    callback(['OUT_OF_RANGE'], response, null);
                var countInvalid = (count !== undefined) && (isNaN(count));
                var countTooMany = (count > 500);
                if (countInvalid)
                    callback(['INVALID_REQUEST'], response, null);
                if (countTooMany)
                    callback(['TOO_MANY'], response, null);
                var ret = { samples: [], firstSequence: _this.firstSequence, lastSequence: _this.nextSequence - 1, nextSequence: null };
                async.forEach(dataItems, function (id, callback) {
                    var item = self._items[id];
                    for (var j = 0; j < item.samples.length; j++) {
                        // Filter by from-parameter if necessary
                        if (from !== undefined) {
                            if (item.samples[j].sequence < from)
                                continue;
                        }
                        var sample = self.flatten(item, j);
                        if (sample !== null) {
                            ret.samples.push(sample);
                        }
                    }
                    callback();
                }, function (err) {
                    if (count === undefined) {
                        count = 10;
                    }
                    ret.samples.sort(function (a, b) {
                        if (a.sequence > b.sequence)
                            return 1;
                        if (a.sequence < b.sequence)
                            return -1;
                        return 0;
                    });
                    ret.samples.length = Math.min(count, ret.samples.length);
                    if (ret.samples.length > 0)
                        ret.nextSequence = ret.samples[ret.samples.length - 1].sequence + 1;
                    callback(null, response, ret);
                });
            }
            catch (e) {
                console.log('Error in sample: ' + e);
                callback(['INTERNAL_ERROR'], response, null);
            }
        };
        this.getCurrentAsync = function (response, dataItems, at, callback) {
            var self = _this;
            try {
                var atInvalid = (at !== undefined) && (isNaN(at)); //at-parameter invalid if specified but not a number
                var atOutOfRange = (!atInvalid) && (at !== undefined) && ((at < _this.firstSequence) || (at >= _this.nextSequence)); //at-parameter out of range if valid, specified, but not between [firstSequence, nextSequence)
                if (atInvalid)
                    callback(['INVALID_REQUEST'], response, null);
                if (atOutOfRange)
                    callback(['OUT_OF_RANGE'], response, null);
                var ret = { samples: [], firstSequence: _this.firstSequence, lastSequence: _this.nextSequence - 1, nextSequence: null };
                async.forEach(dataItems, function (id, callback) {
                    var item = self._items[id];
                    var index = item.samples.length - 1;
                    if (index < 0) {
                        callback(); // No samples, skip to next.
                        return;
                    }
                    // If at-parameter exists, find appropriate sample index
                    if (at !== undefined) {
                        console.log(item);
                        if (item.samples[0].sequence > at)
                            callback(); // No samples less than at-parameter, skip to next.
                        for (var j = 0; j < item.samples.length; j++) {
                            if (item.samples[j].sequence > at) {
                                index = j - 1;
                                break;
                            }
                        }
                    }
                    var sample = self.flatten(item, index);
                    if (sample !== null) {
                        ret.samples.push(sample);
                        if ((ret.nextSequence === null) || (ret.nextSequence <= sample.sequence)) {
                            ret.nextSequence = sample.sequence + 1;
                        }
                    }
                    callback();
                }, function (err) {
                    callback(null, response, ret);
                });
            }
            catch (e) {
                console.log('Error in current: ' + e);
                callback(['INTERNAL_ERROR'], response, null);
            }
        };
        this.storeSamples = function (response, query, callback) {
            var data = [];
            var self = _this;
            data.push({
                id: query.id,
                value: query.value,
                timestamp: query.timestamp,
                condition: query.condition
            });
            var i = 1;
            while (query.hasOwnProperty('id' + i)) {
                data.push({
                    id: query['id' + i],
                    value: query['value' + i],
                    timestamp: query['timestamp' + i],
                    condition: query['condition' + i]
                });
                i++;
            }
            async.forEach(data, function (item, callback) {
                try {
                    self.storeSample(item.id, item.value, item.timestamp, item.condition);
                    callback();
                }
                catch (e) {
                    console.log('Error storing data item: ' + JSON.stringify(e));
                    callback('UNABLE_TO_STORE');
                }
            }, function (err) {
                callback(err, response, data);
            });
        };
        this.storeSample = function (id, value, timestamp, condition) {
            if (!_this._items.hasOwnProperty(id))
                throw new Error('No data item with id "' + id + '" exists.');
            // Exit if this value is identical to the previous value.
            if (_this._items[id].samples.length > 0) {
                var current = _this._items[id].samples[_this._items[id].samples.length - 1];
                if (current.value == value)
                    return;
            }
            // If condition is not one of UNAVAILABLE, NORMAL, WARNING, or FAULT, exit.
            if (_this._items[id].category === 'CONDITION') {
                if ((condition != 'UNAVAILABLE') && (condition != 'NORMAL') && (condition != 'WARNING') && (condition != 'FAULT'))
                    return;
            }
            // Convert given timestamp to ISO string
            var ts = new Date(timestamp).toISOString();
            var sequence = _this._nextSequence++;
            _this._items[id].samples.push({ sequence: sequence, timestamp: ts, value: value, condition: condition });
            _this._totalItems += 1;
        };
        this.flatten = function (item, sampleIndex) {
            if (sampleIndex < 0)
                return null;
            if (sampleIndex >= item.samples.length)
                return null;
            var sample = item.samples[sampleIndex];
            return {
                id: item.id,
                category: item.category,
                name: item.name,
                type: item.type,
                subType: item.subType,
                componentId: item.componentId,
                componentType: item.componentType,
                componentName: item.componentName,
                deviceId: item.deviceId,
                deviceName: item.deviceName,
                deviceUuid: item.deviceUuid,
                sequence: sample.sequence,
                timestamp: sample.timestamp,
                value: sample.value,
                condition: sample.condition
            };
        };
    }
    Object.defineProperty(ItemStore.prototype, "firstSequence", {
        get: function () {
            return this._firstSequence;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ItemStore.prototype, "nextSequence", {
        get: function () {
            return this._nextSequence;
        },
        enumerable: true,
        configurable: true
    });
    return ItemStore;
})();
module.exports = ItemStore;
