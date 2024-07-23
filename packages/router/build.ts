import { writeFileSync } from 'node:fs'

import { build, defaultBuildOptions } from '@redwoodjs/framework-tools'
import { generateCjsTypes } from '@redwoodjs/framework-tools/cjsTypes'

// CJS build
await build({
  buildOptions: {
    ...defaultBuildOptions,
    tsconfig: 'tsconfig.build.json',
    outdir: 'dist/cjs',
    packages: 'external',
  },
})

// ESM build
await build({
  buildOptions: {
    ...defaultBuildOptions,
    tsconfig: 'tsconfig.build.json',
    format: 'esm',
    packages: 'external',
  },
})

// Place a package.json file with `type: commonjs` in the dist/cjs folder so that
// all .js files are treated as CommonJS files.
writeFileSync('dist/cjs/package.json', JSON.stringify({ type: 'commonjs' }))

// Place a package.json file with `type: module` in the dist folder so that
// all .js files are treated as ES Module files.
writeFileSync('dist/package.json', JSON.stringify({ type: 'module' }))

await generateCjsTypes()
