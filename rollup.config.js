import svelte from 'rollup-plugin-svelte'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import image from '@rollup/plugin-image'
import livereload from 'rollup-plugin-livereload'
import { terser } from 'rollup-plugin-terser'
import css from 'rollup-plugin-css-only'
import rootImport from 'rollup-plugin-root-import'
import nodePolyfills from 'rollup-plugin-node-polyfills'

const { createPreprocessors } = require('./svelte.config.js')

const production = !process.env.ROLLUP_WATCH

// Provides a server for `yarn dev` (or `npm run dev`) command
function serve() {
  let server

  function toExit() {
    if (server) server.kill(0)
  }

  return {
    writeBundle() {
      if (server) return
      server = require('child_process').spawn(
        'npm',
        ['run', 'start', '--', '--dev'],
        {
          stdio: ['ignore', 'inherit', 'inherit'],
          shell: true,
        }
      )

      process.on('SIGTERM', toExit)
      process.on('exit', toExit)
    },
  }
}

export default {
  input: 'src/main.js',
  output: {
    sourcemap: true,
    format: 'iife',
    name: 'app',
    file: 'public/build/bundle.js',
  },
  plugins: [
    svelte({
      // we depend on svelte.config.js here so we don't duplicate preprocessor settings
      preprocess: createPreprocessors(!production),

      // enable run-time checks when not in production
      dev: !production,

      // we'll extract any component CSS out into a separate file - better for performance
      css: (css) => {
        css.write('bundle.css')
      },
    }),

    // If you have external dependencies installed from npm, you'll most likely need
    // these plugins. In some cases you'll need additional configuration - consult the
    // documentation for details:
    //   https://github.com/rollup/plugins/tree/master/packages/commonjs
    resolve({
      browser: true,
      // If we depend on node modules built with Svelte, de-dupe the svelte runtime
      dedupe: ['svelte'],
      preferBuiltins: false,
    }),

    // Allow JS import statements to use '/' to indicate root of project (not root of file system)
    rootImport({
      root: `${__dirname}/src`,
      useInput: 'append',
    }),

    // Converts commonjs modules into ES6 modules required by Rollup.js
    commonjs(),

    // Allows you to import a local/relative PNG,JPG,SVG etc. and use it as <img src={}>
    image(),

    // Exports CSS from node_module dependencies into a single file that we can import
    // NOTE: When toastify.js is removed, we should be able to remove this too.
    css({ output: 'public/build/vendor.css' }),

    // Provides nodejs libraries in the browser env, if needed. We use `events`.
    nodePolyfills(),

    // In dev mode, call `npm run start` once
    // the bundle has been generated
    !production && serve(),

    // Watch the `public` directory and refresh the
    // browser on changes when not in production
    !production && livereload('public'),

    // If we're building for production (npm run build
    // instead of npm run dev), minify
    production && terser(),
  ],
  watch: {
    clearScreen: false,
  },
}
