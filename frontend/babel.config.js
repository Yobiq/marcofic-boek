module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Remove the old reanimated plugin to prevent conflicts
      // 'react-native-reanimated/plugin', // This causes the crash
      // Use the new worklets plugin instead (but only if needed)
      // 'react-native-worklets/plugin',
    ],
  };
};
