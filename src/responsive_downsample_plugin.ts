import moment_module = require('moment');
const moment = (window as any).moment ? (window as any).moment : moment_module;
import { Chart } from 'chart.js';
import { IChartPlugin, TimeScale } from './chartjs_ext';
import * as utils from './utils';

import { DataMipmap } from './data_mipmap';
import { LTTBDataMipmap } from './lttb_data_mipmap';

export interface ResponsiveDownsamplePluginOptions {
  /**
   * Enable/disable plugin
   */
  enabled?: boolean;
  /**
   * The aggregation algorithm to thin out data. Default: LTTB
   */
  aggregationAlgorithm?: 'AVG' | 'LTTB';
  /**
   * Desired mininmal distance between data points in pixels. Default: 1 pixel
   */
  desiredDataPointDistance?: number;
  /**
   * Minimal number of data points. Limits
   */
  minNumPoints?: number;
  /**
   * Flag is set by plugin to trigger reload of data
   */
  needsUpdate?: boolean;
  /**
   * Current target resolution(Set by plugin)
   */
  targetResolution?: number;
}

/**
 * Chart js Plugin for downsampling data
 */
export class ResponsiveDownsamplePlugin implements IChartPlugin {
  static getPluginOptions(chart: any): ResponsiveDownsamplePluginOptions {
    let options: ResponsiveDownsamplePluginOptions = chart.options.responsiveDownsample || {};
    utils.defaultsDeep(options || {}, {
      enabled: false,
      aggregationAlgorithm: 'LTTB',
      desiredDataPointDistance: 1,
      minNumPoints: 100
    });

    if (options.enabled) {
      chart.options.responsiveDownsample = options;
    }

    return options;
  }

  static hasDataChanged(chart: Chart): boolean {
    const changedDataSet = chart.data.datasets.find((dataset: any) => utils.isNil(dataset.mipMap));

    return !utils.isNil(changedDataSet);
  }

  static createDataMipMap(chart: Chart, options: ResponsiveDownsamplePluginOptions): void {
    chart.data.datasets.forEach((dataset: any, i) => {
      const data = !utils.isNil(dataset.originalData)
        ? dataset.originalData
        : dataset.data;

      if (data.length === 0) { return; }

      const mipMap = (options.aggregationAlgorithm === 'LTTB')
        ? new LTTBDataMipmap(data, options.minNumPoints)
        : new DataMipmap(data, options.minNumPoints);

      dataset.originalData = data;
      dataset.mipMap = mipMap;
      dataset.data = mipMap.getMipMapLevel(mipMap.getNumLevel() - 1); // set last level for first render pass
    });
  }

  static getTargetResolution(chart: Chart, options: ResponsiveDownsamplePluginOptions): number {
    const xScale: TimeScale = (chart as any).scales["x-axis-0"];

    if (utils.isNil(xScale)) return null;

    let start = moment(xScale.getValueForPixel(xScale.left) as any);
    let end = moment(xScale.getValueForPixel(xScale.left + 1) as any);
    const targetResolution = end.diff(start);

    return targetResolution * options.desiredDataPointDistance;
  }

  static updateMipMap(chart: Chart, targetResolution: number): void {
    chart.data.datasets.forEach((dataset: any, i) => {
      const mipMap = dataset.mipMap
      if (utils.isNil(mipMap)) return;

      dataset.data = mipMap.getMipMapForResolution(targetResolution);
    });
    // defer update because chart is still in render loop
    setTimeout(() => chart.update(), 100);
  }

  beforeInit(chart: Chart): void {
    const options = ResponsiveDownsamplePlugin.getPluginOptions(chart);
    if (!options.enabled) { return; }

    ResponsiveDownsamplePlugin.createDataMipMap(chart, options);
    options.needsUpdate = true;
  }

  beforeDatasetsUpdate(chart: Chart): void {
    const options = ResponsiveDownsamplePlugin.getPluginOptions(chart);
    if (!options.enabled) { return; }

    // only update mip map if data set was reloaded externally
    if (ResponsiveDownsamplePlugin.hasDataChanged(chart)) {
      ResponsiveDownsamplePlugin.createDataMipMap(chart, options);
      options.needsUpdate = true;
    }
  }

  beforeDraw(chart: Chart): void {
    const options = ResponsiveDownsamplePlugin.getPluginOptions(chart);
    if (!options.enabled) { return; }

    const targetResolution = ResponsiveDownsamplePlugin.getTargetResolution(chart, options);
    if (options.needsUpdate || options.targetResolution !== targetResolution) {
      options.targetResolution = targetResolution;
      ResponsiveDownsamplePlugin.updateMipMap(chart, targetResolution);
      options.needsUpdate = false;
    }
  }
}
