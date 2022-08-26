"use strict";

var CatalogGroup = require("../../lib/Models/CatalogGroup");
var createCatalogMemberFromType = require("../../lib/Models/Catalog/createCatalogMemberFromType");
var Terria = require("../../lib/Models/Terria");
var updateApplicationOnMessageFromParentWindow = require("../../lib/ViewModels/updateApplicationOnMessageFromParentWindow");

describe("updateApplicationOnMessageFromParentWindow", function () {
  var terria;
  var fakeWindow;

  beforeEach(function () {
    terria = new Terria({
      baseUrl: "./"
    });
    createCatalogMemberFromType.register("group", CatalogGroup);

    fakeWindow = jasmine.createSpyObj("window", ["addEventListener"]);
    fakeWindow.parent = jasmine.createSpyObj("parentWindow", ["postMessage"]);
  });

  it("subscribes to messages", function () {
    updateApplicationOnMessageFromParentWindow(terria, fakeWindow);
    expect(fakeWindow.addEventListener.calls.count()).toBe(1);
    expect(fakeWindow.addEventListener.calls.first().args[0]).toBe("message");
  });

  it("posts a message to its parent when ready", function () {
    updateApplicationOnMessageFromParentWindow(terria, fakeWindow);
    expect(fakeWindow.parent.postMessage.calls.count()).toBe(1);
    expect(fakeWindow.parent.postMessage.calls.first().args).toEqual([
      "ready",
      "*"
    ]);
  });

  it("updates the model when it receives a message from the parent", function () {
    var messageEventHandler;
    fakeWindow.addEventListener.and.callFake(function (eventName, callback) {
      messageEventHandler = callback;
    });
    updateApplicationOnMessageFromParentWindow(terria, fakeWindow);

    messageEventHandler({
      source: fakeWindow.parent,
      data: {
        initSources: [
          {
            catalog: [
              {
                name: "Foo",
                type: "group"
              }
            ]
          }
        ]
      }
    });

    var fooGroup = terria.catalog.group.findFirstItemByName("Foo");
    expect(fooGroup).toBeDefined();
    expect(fooGroup.type).toBe("group");
  });

  it("updates the model when it receives a message from the opener", function () {
    var messageEventHandler;
    fakeWindow.addEventListener.and.callFake(function (eventName, callback) {
      messageEventHandler = callback;
    });
    updateApplicationOnMessageFromParentWindow(terria, fakeWindow);

    messageEventHandler({
      opener: fakeWindow.parent,
      data: {
        initSources: [
          {
            catalog: [
              {
                name: "Foo",
                type: "group"
              }
            ]
          }
        ]
      }
    });

    var fooGroup = terria.catalog.group.findFirstItemByName("Foo");
    expect(fooGroup).toBeDefined();
    expect(fooGroup.type).toBe("group");
  });

  it("ignores messages that are not from its parent or opener window", function () {
    var messageEventHandler;
    fakeWindow.addEventListener.and.callFake(function (eventName, callback) {
      messageEventHandler = callback;
    });
    updateApplicationOnMessageFromParentWindow(terria, fakeWindow);

    messageEventHandler({
      source: {},
      data: {
        initSources: [
          {
            catalog: [
              {
                name: "Foo",
                type: "group"
              }
            ]
          }
        ]
      }
    });

    expect(terria.catalog.group.findFirstItemByName("Foo")).not.toBeDefined();
  });
});
