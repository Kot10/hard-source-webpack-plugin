var ExtractTextPlugin = require('extract-text-webpack-plugin');
var ExtractTextVersion = require('extract-text-webpack-plugin/package.json').version;

var HardSourceWebpackPlugin = require('../../..');

var extractOptions;
if (Number(ExtractTextVersion[0]) > 1) {
  extractOptions = [{
    fallback: 'style-loader',
    use: 'css-loader',
  }];
}
else {
  extractOptions = ['style-loader', 'css-loader'];
}

module.exports = {
  context: __dirname,
  entry: './index.js',
  output: {
    path: __dirname + '/tmp',
    filename: 'main.js',
  },
  recordsPath: __dirname + '/tmp/cache/records.json',
  module: {
    loaders: [
      {
        test: /\.css$/,
        loader: ExtractTextPlugin.extract
        .apply(ExtractTextPlugin, extractOptions),
      },
    ],
  },
  plugins: [
    new ExtractTextPlugin('style.css'),
    new HardSourceWebpackPlugin({
      cacheDirectory: 'cache',
      environmentHash: {
        root: __dirname + '/../../..',
      },
    }),
    {
      apply: function(compiler) {
        compiler.plugin('--hard-source-after-freeze-module', function() {
          throw new Error('No freezing.');
        });
        compiler.plugin('hard-source-log', function() {
          // Silent logging.
        });
      }
    },
  ],
};
