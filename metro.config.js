const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Add storage resolver for op-sqlite
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Redirect Storage.native to Storage.op-sqlite.native
  if (moduleName.endsWith('Storage.native')) {
    const opSqlitePath = moduleName.replace('Storage.native', 'storage/Storage.op-sqlite.native');
    return context.resolveRequest(context, opSqlitePath, platform);
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: "./global.css" });
