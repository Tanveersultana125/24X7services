// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config')
const expoConfig = require('eslint-config-expo/flat')

module.exports = defineConfig([
  expoConfig,
  {
    // scripts/ is the web export tooling, left alone until the web app is picked up again.
    ignores: ['dist/*', 'dist-web/*', 'scripts/*', 'src/uniwind-types.d.ts', 'src/lib/publicAssets.generated.ts'],
  },
])
