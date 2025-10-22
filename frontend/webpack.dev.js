const { merge } = require("webpack-merge");
const common = require("./webpack.common.js");

module.exports = merge(common, {
  mode: "development",
  devtool: "inline-source-map",
  devServer: {
    static: "./dist",
    hot: true,
    proxy: [
      {
        context: ["/api"],
        target: "http://localhost:8888",
      },
      {
        context: ["/ws"],
        target: "ws://localhost:8888",
        ws: true,
      },
    ],
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader", "postcss-loader"],
      },
    ],
  },
});
