import { build, defaultBuildOptions } from '@redwoodjs/framework-tools'

// ESM build
await build({
  buildOptions: {
    ...defaultBuildOptions,
    bundle: true,
    entryPoints: [
      './src/index.ts',
      './src/entries.ts',
      './src/client.ts',
      './src/fully-react/assets.tsx',
      './src/fully-react/rwRscGlobal.ts',
      './src/buildFeServer.ts',
      './src/rsc/rscNodeLoader.ts',
      './src/react-server-dom-webpack/node-loader.ts',
      './src/middleware/index.ts',
      './src/devFeServer.ts',
      './src/runFeServer.ts',
    ],
    format: 'esm',
    outExtension: { '.js': '.mjs' },
    packages: 'external',
  },
})

// CJS build
await build({
  buildOptions: {
    ...defaultBuildOptions,
    bundle: true,
    entryPoints: ['./src/index.ts'],
    outExtension: { '.js': '.cjs' },
    packages: 'external',
  },
})
