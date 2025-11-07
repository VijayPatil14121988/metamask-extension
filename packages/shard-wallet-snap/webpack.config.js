const path = require('path');
const { SnapsWebpackPlugin } = require('@metamask/snaps-webpack-plugin');

module.exports = {
  entry: './src/index.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    clean: true,
  },
  experiments: {
    asyncWebAssembly: true,
  },
  resolve: {
    extensions: ['.ts', '.js'],
    fallback: {
      'crypto': false,
      'stream': false,
      'buffer': false,
    },
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.wasm$/,
        type: 'webassembly/async',
      },
    ],
  },
  plugins: [
    new SnapsWebpackPlugin({
      manifestPath: path.resolve(__dirname, 'snap.manifest.json'),
      writeManifest: true,
      eval: false, // Don't evaluate in SES during build
    }),
  ],
  mode: 'production',
  target: ['web', 'es2020'],
  stats: 'errors-warnings',
};
