import moment_module = require('moment');
const moment = (window && (window as any).moment) ? (window as any).moment : moment_module;
import { Chart, ChartData, ChartDataSets, ChartPoint } from 'chart.js';
import { IChartPlugin, TimeScale } from './chartjs_ext';
import * as utils from './utils';

import { DataMipmap } from './data_mipmap';
import { LTTBDataMipmap } from './lttb_data_mipmap';
import * as data_culling from './data_culling';

interface MipMapDataSets extends ChartDataSets {
  originalData?: ChartPoint[];
  currentMipMapLevel?: number;
  mipMap?: DataMipmap;
}

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
   * Cull data to displayed range of x scale
   */
  cullData?: boolean;
  /**
   * Flag is set by plugin to trigger reload of data
   */
  needsUpdate?: boolean;
  /**
   * Current target resolution(Set by plugin)
   */
  targetResolution?: number;
  /**
   * Scale range of x axis
   */
  scaleRange?: data_culling.Range;
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
      minNumPoints: 100,
      cullData: true
    });

    if (options.enabled) {
      chart.options.responsiveDownsample = options;
    }

    return options;
  }

  static hasDataChanged(chart: Chart): boolean {
    return !utils.isNil(
      utils.findInArray(
        chart.data.datasets as MipMapDataSets[],
        (dataset) => {
          return utils.isNil(dataset.mipMap)
        }
      )
    );
  }

  static createDataMipMap(chart: Chart, options: ResponsiveDownsamplePluginOptions): void {
    chart.data.datasets.forEach((dataset: MipMapDataSets, i) => {
      const data = !utils.isNil(dataset.originalData)
        ? dataset.originalData
        : dataset.data as ChartPoint[];

      const mipMap = (options.aggregationAlgorithm === 'LTTB')
        ? new LTTBDataMipmap(data, options.minNumPoints)
        : new DataMipmap(data, options.minNumPoints);

      dataset.originalData = data;
      dataset.mipMap = mipMap;
      dataset.data = mipMap.getMipMapLevel(mipMap.getNumLevel() - 1); // set last level for first render pass
    });
  }

  static restoreOriginalData(chart: Chart): boolean {
    let updated = false;

    chart.data.datasets.forEach((dataset: MipMapDataSets) => {
      if (!utils.isNil(dataset.originalData)) {
        dataset.data = dataset.originalData;
        updated = true;
      }
    });

    return updated;
  }

  static getTargetResolution(chart: Chart, options: ResponsiveDownsamplePluginOptions): number {
    const xScale: TimeScale = (chart as any).scales["x-axis-0"];

    if (utils.isNil(xScale)) return null;

    let start = moment(xScale.getValueForPixel(xScale.left) as any);
    let end = moment(xScale.getValueForPixel(xScale.left + 1) as any);
    const targetResolution = end.diff(start);

    return targetResolution * options.desiredDataPointDistance;
  }

  static updateMipMap(chart: Chart, options: ResponsiveDownsamplePluginOptions, rangeChanged: boolean): boolean {
    let updated = false;

    chart.data.datasets.forEach((dataset: MipMapDataSets, i) => {
      const mipMap = dataset.mipMap;
      if (utils.isNil(mipMap)) return;

      let mipMalLevel = mipMap.getMipMapIndexForResolution(options.targetResolution);
      if (mipMalLevel === dataset.currentMipMapLevel && !rangeChanged) {
        // skip update if mip map level and data range did not change
        return;
      }
      updated = true;
      dataset.currentMipMapLevel = mipMalLevel;

      let newData = mipMap.getMipMapLevel(mipMalLevel);
      if (options.cullData) {
        newData = data_culling.cullData(newData, options.scaleRange)
      }

      dataset.data = newData;
    });

    return updated;
  }

  beforeInit(chart: Chart): void {
    const options = ResponsiveDownsamplePlugin.getPluginOptions(chart);
    if (!options.enabled) { return; }

    ResponsiveDownsamplePlugin.createDataMipMap(chart, options);
    options.needsUpdate = true;
  }

  beforeDatasetsUpdate(chart: Chart): void {
    const options = ResponsiveDownsamplePlugin.getPluginOptions(chart);
    if (!options.enabled) {
      // restore original data if present
      options.needsUpdate = ResponsiveDownsamplePlugin.restoreOriginalData(chart);
      return;
    }

    // only update mip map if data set was reloaded externally
    if (ResponsiveDownsamplePlugin.hasDataChanged(chart)) {
      ResponsiveDownsamplePlugin.createDataMipMap(chart, options);
      options.needsUpdate = true;
    }
  }

  beforeRender(chart: Chart): boolean {
    const options = ResponsiveDownsamplePlugin.getPluginOptions(chart);
    if (!options.enabled) {
      // update chart if data was restored from original data
      if (options.needsUpdate) {
        options.needsUpdate = false;
        chart.update(0);

        return false;
      }
      return;
    }

    const targetResolution = ResponsiveDownsamplePlugin.getTargetResolution(chart, options);
    const xScale: TimeScale = (chart as any).scales["x-axis-0"];
    const scaleRange = data_culling.getScaleRange(xScale);
    const rangeChanged = !data_culling.rangeIsEqual(options.scaleRange, scaleRange);

    if (options.needsUpdate ||
      options.targetResolution !== targetResolution ||
      rangeChanged
    ) {
      options.targetResolution = targetResolution;
      options.scaleRange = scaleRange;
      options.needsUpdate = false;

      if (ResponsiveDownsamplePlugin.updateMipMap(chart, options, rangeChanged)) {
        // update chart and cancel current render
        chart.update(0);

        return false;
      }
    }
  }
}
