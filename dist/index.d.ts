import { ResponsiveDownsamplePluginOptions } from './responsive_downsample_plugin';
export { ResponsiveDownsamplePlugin, ResponsiveDownsamplePluginOptions } from './responsive_downsample_plugin';
declare module "chart.js" {
    interface ChartOptions {
        /**
         * Options for responsive downsample plugin
         */
        responsiveDownsample?: ResponsiveDownsamplePluginOptions;
    }
}
