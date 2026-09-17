import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypeScript from 'eslint-config-next/typescript'

// Next 16 removed `next lint` and ships eslint-config-next as flat config, so
// these are imported directly. Routing them through FlatCompat, as a Next 15
// project would, makes eslint-plugin-react's circular plugin object blow up
// inside the legacy config validator.
const config = [
  {
    ignores: ['.next/**', 'out/**', 'android/**', 'next-env.d.ts'],
  },
  ...nextCoreWebVitals,
  ...nextTypeScript,
]

export default config
