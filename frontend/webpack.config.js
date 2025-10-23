const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MonacoWebpackPlugin = require("monaco-editor-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = (env, argv) => {
  const isProduction = argv.mode === "production";

  return {
    mode: isProduction ? "production" : "development",
    devtool: isProduction ? "source-map" : "inline-source-map",
    entry: "./src/index.tsx",
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: isProduction ? "[name].[contenthash].js" : "[name].bundle.js",
      clean: true,
    },
    resolve: {
      extensions: [".tsx", ".ts", ".js"],
    },
    module: {
      rules: [
        {
          test: /\.(ts|tsx)$/,
          exclude: /node_modules/,
          use: "ts-loader",
        },
        {
          test: /\.css$/,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : "style-loader",
            "css-loader",
            "postcss-loader",
          ],
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: "./public/index.html",
      }),
      new MonacoWebpackPlugin({
        languages: ["html"],
        features: [
          "coreCommands",
          "find",
          "folding",
          "format",
          "hover",
          "wordHighlighter",
        ],
      }),
    ].concat(isProduction ? [new MiniCssExtractPlugin()] : []),
    devServer: {
      static: {
        directory: path.join(__dirname, "dist"),
      },
      hot: true,
      open: true,
      port: 3000,
      historyApiFallback: true,
    },
  };
};
