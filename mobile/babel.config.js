const path = require('path');

module.exports = function(api) {
  api.cache(true);

  const envPath = path.resolve(__dirname, '../.env');

  return {
    presets: ["babel-preset-expo"],
    plugins: [
      ['module:react-native-dotenv', {
        moduleName: '@env',
        path: envPath,
      }]
    ]
  };
};
