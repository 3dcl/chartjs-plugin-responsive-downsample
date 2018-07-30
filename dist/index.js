"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var chartjs = require("chart.js");
var Chart = window && window.Chart ? window.Chart : chartjs.Chart;
var responsive_downsample_plugin_1 = require("./responsive_downsample_plugin");
var responsive_downsample_plugin_2 = require("./responsive_downsample_plugin");
exports.ResponsiveDownsamplePlugin = responsive_downsample_plugin_2.ResponsiveDownsamplePlugin;
Chart.pluginService.register(new responsive_downsample_plugin_1.ResponsiveDownsamplePlugin());
