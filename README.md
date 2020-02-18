chartjs-plugin-responsive-downsample
====================================
[![Build Status](https://travis-ci.com/3dcl/chartjs-plugin-responsive-downsample.svg?branch=master)](https://travis-ci.com/3dcl/chartjs-plugin-responsive-downsample)

A chart.js plugin to dynamically downsample line chart data depending on the chart resolution.
The plugin creates a mipmap-like data structure from line chart data and dynamically choses a downsampled version of the data depending on the chart resolution and x axis scale.

Inspired by: [AlbinoDrought/chartjs-plugin-downsample](https://github.com/AlbinoDrought/chartjs-plugin-downsample)

### Installation

```bash
$ npm install chartjs-plugin-responsive-downsample
```

### Configuration
```javascript
{
    options: {
        responsiveDownsample: {
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
    }
}

```
