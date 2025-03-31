import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    'src/index',
  ],
  declaration: 'node16',
  clean: true,
  failOnWarn: false,
  rollup: {
    inlineDependencies: [
      '@antfu/utils',
    ],
    emitCJS: true,
  },
})
