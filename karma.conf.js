// Karma configuration
// Generated on Tue Dec 22 2015 11:24:15 GMT+1100 (AEDT)

module.exports = function(config) {
  config.set({

    // to avoid DISCONNECTED messages when connecting to BrowserStack
    browserDisconnectTimeout : 10000, // default 2000
    browserDisconnectTolerance : 1, // default 0
    browserNoActivityTimeout : 4*60*1000, //default 10000
    captureTimeout : 4*60*1000, //default 60000

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: 'wwwroot',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],


    // list of files / patterns to load in the browser
    files: [
      'build/TerriaJS-specs.js',
      {
        pattern: 'build/Cesium/**',
        watched: false,
        included: false,
        served: true
      }
    ],

    proxies: {
        '/data': 'http://localhost:3002/data',
        '/images': 'http://localhost:3002/images',
        '/test': 'http://localhost:3002/test',
        '/build': 'http://localhost:3002/build'
    },

    // list of files to exclude
    exclude: [
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
    },

    customLaunchers: {
        bs_chrome: {
              base: 'BrowserStack',
              browser: 'chrome',
              os: 'Windows',
              os_version: '7'
        },
        bs_safari: {
            base: 'BrowserStack',
            browser: 'safari',
            os: 'OS X',
            os_version: 'El Capitan'
        },
        bs_ie9: {
            base: 'BrowserStack',
            browser: 'ie',
            browser_version: '9.0',
            os: 'Windows',
            os_version: '7'
        },
        bs_ie10: {
            base: 'BrowserStack',
            browser: 'ie',
            browser_version: '10.0',
            os: 'Windows',
            os_version: '7'
        },
        bs_ie11: {
            base: 'BrowserStack',
            browser: 'ie',
            browser_version: '11.0',
            os: 'Windows',
            os_version: '7'
        },
        bs_firefox: {
            base: 'BrowserStack',
            browser: 'firefox',
            os: 'Windows',
            os_version: '7'
        },
        bs_firefox_esr: {
            base: 'BrowserStack',
            browser: 'firefox',
            browser_version: '38.0',
            os: 'Windows',
            os_version: '7'
        }
    },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress'],


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['bs_chrome', 'bs_safari', 'bs_firefox', 'bs_firefox_esr', 'bs_ie9', 'bs_ie10', 'bs_ie11'],

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true,

    // Concurrency level
    // how many browser should be started simultanous
    concurrency: 5,

    browserStack: {
        startTunnel: true
    }
  })
}
