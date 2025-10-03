const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Add the root directory to watchFolders so Metro can see shared packages
config.watchFolders = [
  // Root of the monorepo
  path.resolve(__dirname, ".."),
];

// Configure resolver to find modules in workspace
config.resolver.nodeModulesPath = [
  // Local node_modules in mobile/ (prioritize local packages)
  path.resolve(__dirname, "node_modules"),
  // Root node_modules for workspace packages
  path.resolve(__dirname, "../node_modules"),
];

// Disable symlinks to avoid Expo Router issues
config.resolver.unstable_enableSymlinks = false;

// Only add aliases for our workspace packages, not Expo internals
config.resolver.alias = {
  "@contractor-platform/types": path.resolve(__dirname, "../shared/types"),
  "@contractor-platform/utils": path.resolve(__dirname, "../shared/utils"),
};

// More specific blockList to avoid interfering with Expo Router
config.resolver.blockList = [
  // Ignore other workspace packages to avoid conflicts
  /packages\/web\/.*/,
  // Ignore build outputs but be more specific
  /packages\/.*\/build\/.*/,
  /packages\/.*\/dist\/.*/,
  /packages\/.*\/\.next\/.*/,
  // Ignore test folders
  /.*\/__tests__\/.*/,
  /.*\/test-results\/.*/,
  /.*\/playwright-report\/.*/,
];

module.exports = config;
