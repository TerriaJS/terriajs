/*global require*/
/// <reference types="jasmine" />
require('terriajs-jasmine-ajax');
import * as Enzyme from 'enzyme';
import * as jasmineEnzyme from 'jasmine-enzyme';
import * as Adapter from 'enzyme-adapter-react-16';
import { configure, spy } from "mobx";

Enzyme.configure({ adapter: new Adapter() });

configure({
    enforceActions: true,
    computedRequiresReaction: true
});

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

beforeEach(() => jasmineEnzyme());

afterEach(function() {
    const jasmineAny: any = jasmine;
    if (jasmineAny.Ajax) {
        jasmineAny.Ajax.uninstall();
    }
});
