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
