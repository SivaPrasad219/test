import TerserPlugin from "terser-webpack-plugin";
import HtmlWebpackPlugin from "html-webpack-plugin";
import { BundleAnalyzerPlugin } from "webpack-bundle-analyzer";

module.exports = {
  devServer: {
    https: false, // Use HTTPS or not
  },
  configureWebpack: {
    resolve: {
      fallback: {
        util: require.resolve("util/"),
      },
    },
    optimization: {
      minimize: true,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            compress: {
              drop_console: true, // Remove console.log statements
              dead_code: true, // Remove unreachable code
            },
            output: {
              comments: false, // Remove all comments
            },
          },
          extractComments: false, // Do not extract comments to a separate file
        }),
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        title: "DAS", // Set the title here
        template: "public/index.html", // Specify the path to your index.html file
      }),
      new BundleAnalyzerPlugin({
        analyzerMode: "static",
        openAnalyzer: false, // Open analyzer report automatically
        reportFilename: "bundle-report.html",
      }),
    ],
  },
  chainWebpack: (config) => {
    config.module
      .rule("txt")
      .test(/\.txt$/)
      .use("raw-loader")
      .loader("raw-loader")
      .end();

    // Babel Loader Configuration for Tree Shaking and Dead Code Elimination
    config.module
      .rule("js")
      .use("babel-loader")
      .loader("babel-loader")
      .tap((options) => {
        return {
          ...options,
          plugins: [
            ...(options.plugins || []),
            "babel-plugin-minify-dead-code-elimination",
          ],
        };
      });

    // Disable source maps for production
    config.when(process.env.NODE_ENV === "production", (config) => {
      config.devtool(false);
    });

    // Ensure lazy loading for dynamic imports
    config.module
      .rule("vue")
      .use("vue-loader")
      .loader("vue-loader")
      .tap((options) => {
        return {
          ...options,
          compilerOptions: {
            ...(options.compilerOptions || {}),
            isCustomElement: (tag) => tag.startsWith("lazy-"), // Assuming custom elements for lazy loading
          },
        };
      });
  },
};
