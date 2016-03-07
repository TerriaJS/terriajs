// Karma configuration
// Generated on Tue Dec 22 2015 11:24:15 GMT+1100 (AEDT)

module.exports = function(config) {
  config.set({

    browserNoActivityTimeout: 100000000,

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
        sl_chrome: {
              base: 'SauceLabs',
              browserName: 'chrome',
              platform: 'Windows 7',
              version: '46.0'
        },
        sl_safari9: {
            base: 'SauceLabs',
            browserName: 'safari',
            platform: 'OS X 10.11',
            version: '9.0'
        },
        sl_ie9: {
            base: 'SauceLabs',
            browserName: 'internet explorer',
            platform: 'Windows 7',
            version: '9.0'
        },
        sl_ie10: {
            base: 'SauceLabs',
            browserName: 'internet explorer',
            platform: 'Windows 7',
            version: '10.0'
        },
        sl_ie11: {
            base: 'SauceLabs',
            browserName: 'internet explorer',
            platform: 'Windows 7',
            version: '11.0'
        },
        sl_firefox42: {
            base: 'SauceLabs',
            browserName: 'firefox',
            platform: 'Windows 7',
            version: '42.0'
        },
        sl_firefox38esr: {
            base: 'SauceLabs',
            browserName: 'firefox',
            platform: 'Windows 7',
            version: '38.0'
        }
    },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress', 'saucelabs'],


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
    browsers: ['sl_chrome', 'sl_safari9', 'sl_firefox42', 'sl_firefox38esr', 'sl_ie9', 'sl_ie10', 'sl_ie11'],

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true,

    // Concurrency level
    // how many browser should be started simultanous
    concurrency: 5,

    sauceLabels: {
        testName: 'TerriaJS Unit Tests',
        tunnelIdentifier: process.env.TRAVIS_BUILD_NUMBER
    }
  })
}
