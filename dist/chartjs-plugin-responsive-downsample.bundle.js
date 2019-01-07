(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var moment_module = require("moment");
var moment = (window && window.moment) ? window.moment : moment_module;
var utils = require("./utils");
function getCompareValue(value) {
    if (typeof value === 'number') {
        return value;
    }
    else if (typeof value === 'string') {
        return (new Date(value)).getTime();
    }
    else if (value instanceof Date) {
        return value.getTime();
    }
    else {
        return moment(value).toDate().getTime();
    }
}
function rangeIsEqual(previousValue, currentValue) {
    if (utils.isNil(previousValue) ||
        utils.isNil(currentValue) ||
        utils.isNil(previousValue[0]) ||
        utils.isNil(previousValue[1]) ||
        utils.isNil(currentValue[0]) ||
        utils.isNil(currentValue[1])) {
        return false;
    }
    previousValue = [getCompareValue(previousValue[0]), getCompareValue(previousValue[1])];
    currentValue = [getCompareValue(currentValue[0]), getCompareValue(currentValue[1])];
    return previousValue[0] === currentValue[0] && previousValue[1] == currentValue[1];
}
exports.rangeIsEqual = rangeIsEqual;
function getScaleRange(scale) {
    if (utils.isNil(scale))
        return [null, null];
    var start = scale.getValueForPixel(scale.left);
    var end = scale.getValueForPixel(scale.right);
    return [start, end];
}
exports.getScaleRange = getScaleRange;
function cullData(data, range) {
    var startValue = getCompareValue(range[0]);
    var endValue = getCompareValue(range[1]);
    var startIndex = 0;
    var endIndex = data.length;
    for (var i = 1; i < data.length; ++i) {
        var point = data[i];
        var compareValue = getCompareValue(point.x || point.t);
        if (compareValue <= startValue) {
            startIndex = i;
        }
        if (compareValue >= endValue) {
            endIndex = i + 1;
            break;
        }
    }
    return data.slice(startIndex, endIndex);
}
exports.cullData = cullData;

},{"./utils":7,"moment":1}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var utils = require("./utils");
/**
 * A mipmap data structure for line chart data. Uses averages to downsample data.
 */
var DataMipmap = /** @class */ (function () {
    /**
     * Create a data mipmap
     * @param data The orignal line chart data
     * @param minNumPoints Minimal number of points on lowest mipmap level(limits number of levels)
     */
    function DataMipmap(data, minNumPoints) {
        if (minNumPoints === void 0) { minNumPoints = 2; }
        this.minNumPoints = minNumPoints;
        this.setData(data);
    }
    /**
     * Set the line chart data and update mipmap level.
     * @param data The orignal line chart data
     */
    DataMipmap.prototype.setData = function (data) {
        this.originalData = data || [];
        this.mipMaps = [];
        this.resolution = this.computeResolution(this.originalData);
        this.createMipMap();
    };
    /**
     * Set the minimal number of points
     * @param minNumPoints Minimal number of points on lowest mipmap level(limits number of levels)
     */
    DataMipmap.prototype.setMinNumPoints = function (minNumPoints) {
        this.minNumPoints = minNumPoints;
        this.mipMaps = [];
        this.createMipMap();
    };
    /**
     * Get the best fitting mipmap level for a certain scale resolution
     * @param resolution Desired resolution in ms per pixel
     */
    DataMipmap.prototype.getMipMapForResolution = function (resolution) {
        return this.getMipMapLevel(this.getMipMapIndexForResolution(resolution));
    };
    /**
     * Computes the index of the best fitting mipmap level for a certain scale resolution
     * @param resolution Desired resolution in ms per pixel
     */
    DataMipmap.prototype.getMipMapIndexForResolution = function (resolution) {
        if (utils.isNil(resolution)) {
            return 0;
        }
        var factor = resolution / this.resolution;
        var level = utils.clamp(Math.floor(Math.log(factor) / Math.log(2.0)), 0, this.mipMaps.length - 1);
        return level;
    };
    /**
     * Get a mipmap level by index
     * @param level The index of the mipmap level
     */
    DataMipmap.prototype.getMipMapLevel = function (level) {
        return this.mipMaps[level];
    };
    /**
     * Get all mipmap level
     */
    DataMipmap.prototype.getMipMaps = function () {
        return this.mipMaps;
    };
    /**
     * Get the number of available mipmap level
     */
    DataMipmap.prototype.getNumLevel = function () {
        return this.mipMaps.length;
    };
    DataMipmap.prototype.computeResolution = function (data) {
        var minTimeDistance = Infinity;
        for (var i = 0, end = this.originalData.length - 1; i < end; ++i) {
            var current = this.originalData[i];
            var next = this.originalData[i + 1];
            minTimeDistance = Math.min(Math.abs(this.getTime(current) - this.getTime(next)), minTimeDistance);
        }
        return minTimeDistance;
    };
    DataMipmap.prototype.createMipMap = function () {
        var targetResolution = this.resolution;
        var targetLength = this.originalData.length;
        this.mipMaps.push(this.originalData);
        var lastMipMap = this.originalData;
        while (lastMipMap.length > this.minNumPoints) {
            targetResolution = targetResolution * 2;
            targetLength = Math.floor(targetLength * 0.5);
            lastMipMap = this.downsampleToResolution(lastMipMap, targetResolution, targetLength);
            this.mipMaps.push(lastMipMap);
        }
    };
    DataMipmap.prototype.downsampleToResolution = function (data, targetResolution, targetLength) {
        var output = [];
        var aggregationValues = [];
        var firstPoint = data[0];
        aggregationValues.push(firstPoint);
        for (var i = 1, end = data.length; i < end; ++i) {
            var currentPoint = data[i];
            var timeDistance = Math.abs(this.getTime(firstPoint) - this.getTime(currentPoint));
            if (timeDistance < targetResolution) {
                aggregationValues.push(currentPoint);
            }
            else {
                // create new sensor value in output
                var newPoint = this.getAverage(aggregationValues);
                output.push(newPoint);
                // reset aggregation data structure
                firstPoint = currentPoint;
                aggregationValues = [currentPoint];
            }
        }
        // insert last point
        output.push(this.getAverage(aggregationValues));
        return output;
    };
    DataMipmap.prototype.getAverage = function (aggregationValues) {
        var value = aggregationValues
            .map(function (point) { return point.y; })
            .reduce(function (previous, current) { return previous + current; })
            / aggregationValues.length;
        return {
            x: aggregationValues[0].x || aggregationValues[0].t,
            y: value
        };
    };
    DataMipmap.prototype.getTime = function (point) {
        var x = point.x || point.t;
        if (typeof x === "number") {
            return x;
        }
        else if (typeof x === "string") {
            return new Date(x).getTime();
        }
        else {
            return x.getTime();
        }
    };
    return DataMipmap;
}());
exports.DataMipmap = DataMipmap;

},{"./utils":7}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var chartjs = require("chart.js");
var Chart = window && window.Chart ? window.Chart : chartjs.Chart;
var responsive_downsample_plugin_1 = require("./responsive_downsample_plugin");
var responsive_downsample_plugin_2 = require("./responsive_downsample_plugin");
exports.ResponsiveDownsamplePlugin = responsive_downsample_plugin_2.ResponsiveDownsamplePlugin;
Chart.pluginService.register(new responsive_downsample_plugin_1.ResponsiveDownsamplePlugin());

},{"./responsive_downsample_plugin":6,"chart.js":1}],5:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var utils = require("./utils");
var data_mipmap_1 = require("./data_mipmap");
/**
 * A mipmap data structure that uses Largest-Triangle-Three-Buckets algorithm to downsample data
 */
var LTTBDataMipmap = /** @class */ (function (_super) {
    __extends(LTTBDataMipmap, _super);
    function LTTBDataMipmap() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    LTTBDataMipmap.prototype.getMipMapIndexForResolution = function (resolution) {
        if (utils.isNil(resolution)) {
            return 0;
        }
        var index = utils.findIndexInArray(this.resolutions, function (levelResolution) { return levelResolution >= resolution; });
        if (index === -1) {
            // use smallest mipmap as fallback
            index = this.resolutions.length - 1;
        }
        return index;
    };
    LTTBDataMipmap.prototype.createMipMap = function () {
        var _this = this;
        _super.prototype.createMipMap.call(this);
        this.resolutions = this.mipMaps.map(function (level) { return _this.computeAverageResolution(level); });
    };
    /**
     * This method is adapted from: https://github.com/sveinn-steinarsson/flot-downsample
     *
     * The MIT License
     * Copyright (c) 2013 by Sveinn Steinarsson
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    LTTBDataMipmap.prototype.downsampleToResolution = function (data, targetResolution, targetLength) {
        var dataLength = data.length;
        if (targetLength >= dataLength || targetLength === 0) {
            return data; // data has target size
        }
        var output = [];
        // bucket size, leave room for start and end data points
        var bucksetSize = (dataLength - 2) / (targetLength - 2);
        var a = 0; // initially a is the first point in the triangle
        var maxAreaPoint;
        var maxArea;
        var area;
        var nextA;
        // always add the first point
        output.push(data[a]);
        for (var i = 0; i < targetLength - 2; ++i) {
            // Calculate point average for next bucket (containing c)
            var avgX = 0;
            var avgY = 0;
            var avgRangeStart = Math.floor((i + 1) * bucksetSize) + 1;
            var avgRangeEnd = Math.floor((i + 2) * bucksetSize) + 1;
            avgRangeEnd = avgRangeEnd < dataLength ? avgRangeEnd : dataLength;
            var avgRangeLength = avgRangeEnd - avgRangeStart;
            for (; avgRangeStart < avgRangeEnd; avgRangeStart++) {
                avgX += this.getTime(data[avgRangeStart]);
                avgY += data[avgRangeStart].y * 1;
            }
            avgX /= avgRangeLength;
            avgY /= avgRangeLength;
            // Get the range for this bucket
            var rangeOffs = Math.floor((i + 0) * bucksetSize) + 1;
            var rangeTo = Math.floor((i + 1) * bucksetSize) + 1;
            // Point a
            var pointA = data[a];
            var pointAX = this.getTime(pointA);
            var pointAY = pointA.y * 1;
            maxArea = area = -1;
            for (; rangeOffs < rangeTo; rangeOffs++) {
                // Calculate triangle area over three buckets
                area = Math.abs((pointAX - avgX) * (data[rangeOffs].y - pointAY) -
                    (pointAX - this.getTime(data[rangeOffs])) * (avgY - pointAY)) * 0.5;
                if (area > maxArea) {
                    maxArea = area;
                    maxAreaPoint = data[rangeOffs];
                    nextA = rangeOffs; // Next a is this b
                }
            }
            output.push(maxAreaPoint); // Pick this point from the bucket
            a = nextA; // This a is the next a (chosen b)
        }
        output.push(data[dataLength - 1]); // Always add last
        return output;
    };
    LTTBDataMipmap.prototype.computeAverageResolution = function (data) {
        var timeDistances = 0;
        for (var i = 0, end = this.originalData.length - 1; i < end; ++i) {
            var current = this.originalData[i];
            var next = this.originalData[i + 1];
            timeDistances += Math.abs(this.getTime(current) - this.getTime(next));
        }
        return timeDistances / (data.length - 1);
    };
    return LTTBDataMipmap;
}(data_mipmap_1.DataMipmap));
exports.LTTBDataMipmap = LTTBDataMipmap;

},{"./data_mipmap":3,"./utils":7}],6:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var moment_module = require("moment");
var moment = (window && window.moment) ? window.moment : moment_module;
var utils = require("./utils");
var data_mipmap_1 = require("./data_mipmap");
var lttb_data_mipmap_1 = require("./lttb_data_mipmap");
var data_culling = require("./data_culling");
/**
 * Chart js Plugin for downsampling data
 */
var ResponsiveDownsamplePlugin = /** @class */ (function () {
    function ResponsiveDownsamplePlugin() {
    }
    ResponsiveDownsamplePlugin.getPluginOptions = function (chart) {
        var options = chart.options.responsiveDownsample || {};
        utils.defaultsDeep(options, {
            enabled: false,
            aggregationAlgorithm: 'LTTB',
            desiredDataPointDistance: 1,
            minNumPoints: 100,
            cullData: true
        });
        if (options.enabled) {
            chart.options.responsiveDownsample = options;
        }
        return options;
    };
    ResponsiveDownsamplePlugin.hasDataChanged = function (chart) {
        return !utils.isNil(utils.findInArray(chart.data.datasets, function (dataset) {
            return utils.isNil(dataset.mipMap);
        }));
    };
    ResponsiveDownsamplePlugin.createDataMipMap = function (chart, options) {
        chart.data.datasets.forEach(function (dataset, i) {
            var data = !utils.isNil(dataset.originalData)
                ? dataset.originalData
                : dataset.data;
            var mipMap = (options.aggregationAlgorithm === 'LTTB')
                ? new lttb_data_mipmap_1.LTTBDataMipmap(data, options.minNumPoints)
                : new data_mipmap_1.DataMipmap(data, options.minNumPoints);
            dataset.originalData = data;
            dataset.mipMap = mipMap;
            dataset.data = mipMap.getMipMapLevel(mipMap.getNumLevel() - 1); // set last level for first render pass
        });
    };
    ResponsiveDownsamplePlugin.restoreOriginalData = function (chart) {
        var updated = false;
        chart.data.datasets.forEach(function (dataset) {
            if (!utils.isNil(dataset.originalData) &&
                dataset.data !== dataset.originalData) {
                dataset.data = dataset.originalData;
                updated = true;
            }
        });
        return updated;
    };
    ResponsiveDownsamplePlugin.getTargetResolution = function (chart, options) {
        var xScale = chart.scales["x-axis-0"];
        if (utils.isNil(xScale))
            return null;
        var start = moment(xScale.getValueForPixel(xScale.left));
        var end = moment(xScale.getValueForPixel(xScale.left + 1));
        var targetResolution = end.diff(start);
        return targetResolution * options.desiredDataPointDistance;
    };
    ResponsiveDownsamplePlugin.updateMipMap = function (chart, options, rangeChanged) {
        var updated = false;
        chart.data.datasets.forEach(function (dataset, i) {
            var mipMap = dataset.mipMap;
            if (utils.isNil(mipMap))
                return;
            var mipMalLevel = mipMap.getMipMapIndexForResolution(options.targetResolution);
            if (mipMalLevel === dataset.currentMipMapLevel && !rangeChanged) {
                // skip update if mip map level and data range did not change
                return;
            }
            updated = true;
            dataset.currentMipMapLevel = mipMalLevel;
            var newData = mipMap.getMipMapLevel(mipMalLevel);
            if (options.cullData) {
                newData = data_culling.cullData(newData, options.scaleRange);
            }
            dataset.data = newData;
        });
        return updated;
    };
    ResponsiveDownsamplePlugin.prototype.beforeInit = function (chart) {
        var options = ResponsiveDownsamplePlugin.getPluginOptions(chart);
        if (!options.enabled) {
            return;
        }
        ResponsiveDownsamplePlugin.createDataMipMap(chart, options);
        options.needsUpdate = true;
    };
    ResponsiveDownsamplePlugin.prototype.beforeDatasetsUpdate = function (chart) {
        var options = ResponsiveDownsamplePlugin.getPluginOptions(chart);
        if (!options.enabled) {
            // restore original data and remove state from options
            options.needsUpdate = ResponsiveDownsamplePlugin.restoreOriginalData(chart);
            delete options.targetResolution;
            delete options.scaleRange;
            return;
        }
        // only update mip map if data set was reloaded externally
        if (ResponsiveDownsamplePlugin.hasDataChanged(chart)) {
            ResponsiveDownsamplePlugin.createDataMipMap(chart, options);
            options.needsUpdate = true;
        }
    };
    ResponsiveDownsamplePlugin.prototype.beforeRender = function (chart) {
        var options = ResponsiveDownsamplePlugin.getPluginOptions(chart);
        if (!options.enabled) {
            // update chart if data was restored from original data
            if (options.needsUpdate) {
                options.needsUpdate = false;
                chart.update(0);
                return false;
            }
            return;
        }
        var targetResolution = ResponsiveDownsamplePlugin.getTargetResolution(chart, options);
        var xScale = chart.scales["x-axis-0"];
        var scaleRange = data_culling.getScaleRange(xScale);
        var rangeChanged = !data_culling.rangeIsEqual(options.scaleRange, scaleRange);
        if (options.needsUpdate ||
            options.targetResolution !== targetResolution ||
            rangeChanged) {
            options.targetResolution = targetResolution;
            options.scaleRange = scaleRange;
            options.needsUpdate = false;
            if (ResponsiveDownsamplePlugin.updateMipMap(chart, options, rangeChanged)) {
                // update chart and cancel current render
                chart.update(0);
                return false;
            }
        }
    };
    return ResponsiveDownsamplePlugin;
}());
exports.ResponsiveDownsamplePlugin = ResponsiveDownsamplePlugin;

},{"./data_culling":2,"./data_mipmap":3,"./lttb_data_mipmap":5,"./utils":7,"moment":1}],7:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Check if a value is null or undefined
 */
function isNil(value) {
    return (typeof value === "undefined") || value === null;
}
exports.isNil = isNil;
/**
 * Clamp a number to a range
 * @param value
 * @param min
 * @param max
 */
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}
exports.clamp = clamp;
/**
 * Recursivly assign default values to an object if object is missing the keys.
 * @param object The destination object to assign default values to
 * @param defaults The default values for the object
 * @return The destination object
 */
function defaultsDeep(object, defaults) {
    for (var key in defaults) {
        var value = object[key];
        if (typeof value === "undefined") {
            object[key] = defaults[key];
        }
        else if (value !== null && typeof value === "object") {
            object[key] = defaultsDeep(value, defaults[key]);
        }
    }
    return object;
}
exports.defaultsDeep = defaultsDeep;
/**
 * Finds the first element in an array for that the comaperator functions returns true
 *
 * @export
 * @template T Element type of the array
 * @param {Array<T>} array An array
 * @param {(element: T) => boolean} compareFunction Comperator function returning true for the element seeked
 * @returns {T} The found element or undefined
 */
function findInArray(array, compareFunction) {
    if (isNil(array))
        return undefined;
    for (var i = 0; i < array.length; i++) {
        if (compareFunction(array[i]) === true) {
            return array[i];
        }
    }
    return undefined;
}
exports.findInArray = findInArray;
/**
 * Finds the first index in an array for that the comaperator function for an element returns true
 *
 * @export
 * @template T
 * @param {Array<T>} array An array of elements
 * @param {(element: T) => boolean} compareFunction Comperator function returning true for the element seeked
 * @returns {number} Index of the matched element or -1 if no element was found
 */
function findIndexInArray(array, compareFunction) {
    if (isNil(array))
        return undefined;
    for (var i = 0; i < array.length; i++) {
        if (compareFunction(array[i]) === true) {
            return i;
        }
    }
    return -1;
}
exports.findIndexInArray = findIndexInArray;

},{}]},{},[4]);
