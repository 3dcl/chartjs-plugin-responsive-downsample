import { ChartPoint } from 'chart.js';
import * as utils from './utils';

/**
 * A mipmap data structure for line chart data. Uses averages to downsample data.
 */
export class DataMipmap {
  protected minNumPoints: number;
  protected mipMaps: ChartPoint[][];
  protected originalData: ChartPoint[];
  protected resolution: number;

  /**
   * Create a data mipmap
   * @param data The orignal line chart data
   * @param minNumPoints Minimal number of points on lowest mipmap level(limits number of levels)
   */
  constructor(data: ChartPoint[], minNumPoints: number = 2) {
    this.minNumPoints = minNumPoints;
    this.setData(data);
  }

  /**
   * Set the line chart data and update mipmap level.
   * @param data The orignal line chart data
   */
  setData(data: ChartPoint[]): void {
    this.originalData = data || [];
    this.mipMaps = [];
    this.resolution = this.computeResolution(this.originalData);
    this.createMipMap();
  }

  /**
   * Set the minimal number of points
   * @param minNumPoints Minimal number of points on lowest mipmap level(limits number of levels)
   */
  setMinNumPoints(minNumPoints: number): void {
    this.minNumPoints = minNumPoints;
    this.mipMaps = [];
    this.createMipMap();
  }

  /**
   * Get the best fitting mipmap level for a certain scale resolution
   * @param resolution Desired resolution in ms per pixel
   */
  getMipMapForResolution(resolution: number): ChartPoint[] {
    return this.getMipMapLevel(this.getMipMapIndexForResolution(resolution));
  }

  /**
   * Computes the index of the best fitting mipmap level for a certain scale resolution
   * @param resolution Desired resolution in ms per pixel
   */
  getMipMapIndexForResolution(resolution: number): number {
    if (utils.isNil(resolution)) { return 0; }

    const factor = resolution / this.resolution;
    let level = utils.clamp(Math.floor(Math.log(factor) / Math.log(2.0)), 0, this.mipMaps.length - 1);

    return level;
  }

  /**
   * Get a mipmap level by index
   * @param level The index of the mipmap level
   */
  getMipMapLevel(level: number): ChartPoint[] {
    return this.mipMaps[level];
  }

  /**
   * Get all mipmap level
   */
  getMipMaps(): ChartPoint[][] {
    return this.mipMaps;
  }

  /**
   * Get the number of available mipmap level
   */
  getNumLevel(): number {
    return this.mipMaps.length;
  }

  protected computeResolution(data: ChartPoint[]): number {
    let minTimeDistance = Infinity;

    for (let i = 0, end = this.originalData.length - 1; i < end; ++i) {
      const current = this.originalData[i];
      const next = this.originalData[i + 1];


      minTimeDistance = Math.min(
        Math.abs(this.getTime(current) - this.getTime(next)),
        minTimeDistance
      );
    }

    return minTimeDistance;
  }

  protected createMipMap(): void {
    let targetResolution = this.resolution;
    let targetLength = this.originalData.length;
    this.mipMaps.push(this.originalData);
    let lastMipMap = this.originalData;

    while (lastMipMap.length > this.minNumPoints) {
      targetResolution = targetResolution * 2;
      targetLength = Math.floor(targetLength * 0.5);
      lastMipMap = this.downsampleToResolution(lastMipMap, targetResolution, targetLength);
      this.mipMaps.push(lastMipMap);
    }
  }

  protected downsampleToResolution(
    data: ChartPoint[],
    targetResolution: number,
    targetLength: number
  ): ChartPoint[] {
    const output: ChartPoint[] = [];
    let aggregationValues: ChartPoint[] = [];
    let firstPoint = data[0];
    aggregationValues.push(firstPoint);

    for (let i = 1, end = data.length; i < end; ++i) {
      const currentPoint = data[i];
      const timeDistance = Math.abs(this.getTime(firstPoint) - this.getTime(currentPoint));

      if (timeDistance < targetResolution) {
        aggregationValues.push(currentPoint);
      } else {
        // create new sensor value in output
        const newPoint = this.getAverage(aggregationValues);
        output.push(newPoint);

        // reset aggregation data structure
        firstPoint = currentPoint;
        aggregationValues = [currentPoint];
      }
    }

    // insert last point
    output.push(this.getAverage(aggregationValues));

    return output;
  }

  protected getAverage(aggregationValues: ChartPoint[]): ChartPoint {
    const value = aggregationValues
      .map(point => point.y as number)
      .reduce((previous, current) => previous + current)
      / aggregationValues.length;

    return {
      x: aggregationValues[0].x || aggregationValues[0].t,
      y: value
    };
  }

  protected getTime(point: ChartPoint): number {
    const x = point.x || point.t;

    if (typeof x === "number") {
      return x;
    } else if (typeof x === "string") {
      return new Date(x).getTime();
    } else {
      return x.getTime();
    }
  }
}