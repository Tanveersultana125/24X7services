// Metro, with Uniwind wrapped around it so className props become styles.
const path = require('node:path')
const { getDefaultConfig } = require('expo/metro-config')
const { withUniwindConfig } = require('uniwind/metro')

const config = getDefaultConfig(__dirname)

const uniwind = withUniwindConfig(config, {
  cssEntryFile: './src/global.css',
  dtsFile: './src/uniwind-types.d.ts',
})

// Web only: Uniwind swaps react-native-web's InputAccessoryView for its own
// wrapper, and that wrapper reads react-native-web's index while the index is
// still importing it — a cycle that crashes the web build at start-up. The
// component is a no-op on the web anyway, so it keeps react-native-web's own.
const uniwindResolve = uniwind.resolver.resolveRequest
uniwind.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    platform === 'web' &&
    moduleName.endsWith('exports/InputAccessoryView') &&
    context.originModulePath.includes(`react-native-web${path.sep}`)
  ) {
    return context.resolveRequest(context, moduleName, platform)
  }
  return uniwindResolve(context, moduleName, platform)
}

module.exports = uniwind
