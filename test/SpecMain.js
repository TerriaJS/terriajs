'use strict';

/*global require*/
require('terriajs-jasmine-ajax');

jasmine.DEFAULT_TIMEOUT_INTERVAL = 6000;

afterEach(function() {
    jasmine.Ajax.uninstall();
});
