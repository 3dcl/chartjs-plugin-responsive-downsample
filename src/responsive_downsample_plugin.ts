import moment_module = require('moment');
const moment = (window && (window as any).moment) ? (window as any).moment : moment_module;
import { Chart, ChartData, ChartDataSets, ChartPoint } from 'chart.js';
import { IChartPlugin, TimeScale } from './chartjs_ext';
import * as utils from './utils';

import { DataMipmap } from './data_mipmap';
import { LTTBDataMipmap } from './lttb_data_mipmap';

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
   * Filters data to actual range of x axis
   */
  filterXRange?: boolean;

  /**
   * Flag is set by plugin to trigger reload of data
   */
  needsUpdate?: boolean;
  /**
   * Current target resolution(Set by plugin)
   */
  targetResolution?: number;
  /**
   * Start of x axis
   */
  start?: Date;
  /**
   * End of x axis;
   */
  end?: Date;
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
      filterXRange: true
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

  static getTargetResolution(chart: Chart, options: ResponsiveDownsamplePluginOptions): number {
    const xScale: TimeScale = (chart as any).scales["x-axis-0"];

    if (utils.isNil(xScale)) return null;

    let start = moment(xScale.getValueForPixel(xScale.left) as any);
    let end = moment(xScale.getValueForPixel(xScale.left + 1) as any);
    const targetResolution = end.diff(start);

    return targetResolution * options.desiredDataPointDistance;
  }

  static getStartAndEnd(chart: Chart): [Date, Date] {
    const xScale: TimeScale = (chart as any).scales["x-axis-0"];

    if (utils.isNil(xScale)) return [null, null];

    let start = moment(xScale.getValueForPixel(xScale.left) as any);
    let end = moment(xScale.getValueForPixel(xScale.right) as any);

    return [start.toDate(), end.toDate()];
  }

  static filterData(data: ChartPoint[], start: Date, end: Date): ChartPoint[] {
    let startIndex = 0;
    let endIndex = data.length;

    for (let i = 1; i < data.length; ++i) {
      const point = data[i];

      if (new Date(point.x as string) <= start) {
        startIndex = i;
      }

      if (new Date(point.x as string) >= end) {
        endIndex = i + 1;
        break;
      }
    }

    return data.slice(startIndex, endIndex);
  }

  static updateMipMap(chart: Chart, options: ResponsiveDownsamplePluginOptions, timeChanged: boolean): boolean {
    let updated = false;

    chart.data.datasets.forEach((dataset: MipMapDataSets, i) => {
      const mipMap = dataset.mipMap;
      if (utils.isNil(mipMap)) return;

      // check if mip map level actually changed
      let mipMalLevel = mipMap.getMipMapIndexForResolution(options.targetResolution);
      if (mipMalLevel === dataset.currentMipMapLevel && !timeChanged) {
        return;
      }
      updated = true;
      dataset.currentMipMapLevel = mipMalLevel;

      let newData = mipMap.getMipMapLevel(mipMalLevel);
      if (options.filterXRange) {
        newData = ResponsiveDownsamplePlugin.filterData(newData, options.start, options.end)
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
    if (!options.enabled) { return; }

    // only update mip map if data set was reloaded externally
    if (ResponsiveDownsamplePlugin.hasDataChanged(chart)) {
      ResponsiveDownsamplePlugin.createDataMipMap(chart, options);
      options.needsUpdate = true;
    }
  }

  beforeRender(chart: Chart): boolean {
    const options = ResponsiveDownsamplePlugin.getPluginOptions(chart);
    if (!options.enabled) { return; }

    const targetResolution = ResponsiveDownsamplePlugin.getTargetResolution(chart, options);
    const [start, end] = ResponsiveDownsamplePlugin.getStartAndEnd(chart);
    const timeChanged = (
      utils.isNil(options.start) ||
      utils.isNil(options.end) ||
      start.getTime() !== options.start.getTime() ||
      end.getTime() !== options.end.getTime()
    );

    if (options.needsUpdate ||
      options.targetResolution !== targetResolution ||
      timeChanged
    ) {
      options.targetResolution = targetResolution;
      options.start = start;
      options.end = end;
      options.needsUpdate = false;

      if (ResponsiveDownsamplePlugin.updateMipMap(chart, options, timeChanged)) {
        // update chart and cancel current render
        chart.update(0);

        return false;
      }
    }
  }
}
