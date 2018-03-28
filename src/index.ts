import chartjs = require('chart.js');
const Chart = window && (window as any).Chart ? (window as any).Chart : chartjs.Chart;

import { ResponsiveDownsamplePlugin, ResponsiveDownsamplePluginOptions } from './responsive_downsample_plugin';
export { ResponsiveDownsamplePlugin, ResponsiveDownsamplePluginOptions } from './responsive_downsample_plugin';


// Extend chart.js options interface
declare module "chart.js" {
    interface ChartOptions {
        /**
         * Options for responsive downsample plugin
         */
        responsiveDownsample?: ResponsiveDownsamplePluginOptions;
    }
}

Chart.pluginService.register(new ResponsiveDownsamplePlugin());
