/// <reference types="jasmine" />
import "../lib/Core/prerequisites";
import "jasmine-ajax";
import { configure, spy } from "mobx";
import i18next from "i18next";
import registerCatalogMembers from "../lib/Models/registerCatalogMembers";
const JasmineDOM = require("@testing-library/jasmine-dom").default;
//import JasmineDOM from "@testing-library/jasmine-dom/dist";

configure({
  enforceActions: true,
  computedRequiresReaction: true,
  computedConfigurable: true // so that we can spy on computed items
});

registerCatalogMembers();

// Fail the test if a MobX computed property throws an exception.
spy(event => {
  if (event.type === "error") {
    fail(event.message);
  }
});

beforeAll(async function() {
  await i18next.init({
    lng: "cimode",
    debug: false
  });
});

beforeAll(() => jasmine.addMatchers(JasmineDOM));

jasmine.getEnv().addReporter({
  specDone: result =>
    (result.failedExpectations || []).forEach(expectation =>
      console.warn(expectation.stack)
    )
});

jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000;
