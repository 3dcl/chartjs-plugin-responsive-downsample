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
            enabled: true,
            /**
             * Choose aggregation algorithm 'AVG'(Average values) or
             * 'LTTB' (Largest-Triangle-Three-Buckets). Default: 'LTTB'
             */
            aggregationAlgorithm: 'LTTB',
            /**
             * The desired minimal distance between data points in pixels.
             * The plugin downsamples the data and tries to match this threshold.
             * Default: 1 pixel
             */
            desiredDataPointDistance: 1,
            /**
             * The minimal number of data points. The chart data is not downsampled further than
             * this threshold. Default: 100
             */
            minNumPoints: 100,
             /**
              * Cull data to displayed range of x scale. Default: true
              */
            cullData: boolean;
        }
    }
}
```
