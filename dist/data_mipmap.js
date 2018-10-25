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
