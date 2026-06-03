const { override, addWebpackModuleRule } = require('customize-cra');
const path = require('path');

module.exports = override(
  (config) => {
    config.resolve = config.resolve || {};
    config.resolve.fullySpecified = false;
    return config;
  },
  addWebpackModuleRule({
    test: /\.(js|jsx)$/,
    include: path.resolve(__dirname, 'src'),
    exclude: /node_modules/,
    use: {
      loader: 'babel-loader',
      options: {
        presets: [
          '@babel/preset-env',
          ['@babel/preset-react', { runtime: 'automatic' }],
        ],
      },
    },
  })
);