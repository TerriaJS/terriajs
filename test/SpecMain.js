/*global require*/
require('terriajs-jasmine-ajax');
import Enzyme from 'enzyme';
import jasmineEnzyme from 'jasmine-enzyme';
import Adapter from 'enzyme-adapter-react-16';

Enzyme.configure({ adapter: new Adapter() });

// require('babel-polyfill');  // Polyfills Map, Set and other ES6.
jasmine.getEnv().addReporter({
    specDone: result => result.failedExpectations.forEach(expectation => console.warn(expectation.stack))
});

jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000;

beforeEach(() => jasmineEnzyme());

afterEach(function() {
    jasmine.Ajax.uninstall();
});
