'use strict';

/*global require*/
require('terriajs-jasmine-ajax');

require('babel-polyfill');  // Polyfills Map, Set and other ES6.


jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000;

afterEach(function() {
    jasmine.Ajax.uninstall();
});
