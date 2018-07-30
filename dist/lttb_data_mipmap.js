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
