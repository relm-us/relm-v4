// This file is used by the editor (e.g. vscode) to configure svelte settings

// We have to use 'require' here because this config isn't processed by babel
const sveltePreprocess = require('svelte-preprocess')

// We use a function to set up sveltePreprocess to avoid duplication (so it can
// be exported and re-used for the actual rollup.config.js svelte preprocess directive)
function createPreprocessors(sourceMap) {
  return sveltePreprocess({
    sourceMap,
    defaults: {
      style: 'scss',
    },
    scss: {
      // We can use a path relative to the root because
      // svelte-preprocess automatically adds it to `includePaths`
      // if none is defined.
      prependData: `@import 'src/styles/variables.scss';`,
    },
    postcss: {
      plugins: [
        require('autoprefixer')(),
        require('postcss-file')({
          url: 'copy',
          assetsPath: 'public/build/assets',
          publicPath: '/build/assets/',
          hash: true,
        }),
      ],
    },
  })
}

module.exports = {
  preprocess: createPreprocessors(true),
  createPreprocessors,
}
