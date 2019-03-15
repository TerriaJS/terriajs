/*global require*/
/// <reference types="jasmine" />
require('terriajs-jasmine-ajax');
import { configure, spy } from "mobx";

configure({
    enforceActions: true,
    computedRequiresReaction: true
});

// Fail the test if a MobX computed property throws an exception.
spy(event => {
    if (event.type === 'error') {
        fail(event.message);
    }
});

// require('babel-polyfill');  // Polyfills Map, Set and other ES6.
jasmine.getEnv().addReporter({
    specDone: result => (result.failedExpectations || []).forEach(expectation => console.warn(expectation.stack))
});

jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000;

afterEach(function() {
    const jasmineAny: any = jasmine;
    if (jasmineAny.Ajax) {
        jasmineAny.Ajax.uninstall();
    }
});
