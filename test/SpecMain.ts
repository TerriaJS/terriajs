/*global require*/
/// <reference types="jasmine" />
import "../lib/Core/prerequisites";
import "jasmine-ajax";
import { configure, spy } from "mobx";

configure({
  enforceActions: true,
  computedRequiresReaction: true
});

// Fail the test if a MobX computed property throws an exception.
spy(event => {
  if (event.type === "error") {
    fail(event.message);
  }
});

jasmine.getEnv().addReporter({
  specDone: result =>
    (result.failedExpectations || []).forEach(expectation =>
      console.warn(expectation.stack)
    )
});

jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000;
