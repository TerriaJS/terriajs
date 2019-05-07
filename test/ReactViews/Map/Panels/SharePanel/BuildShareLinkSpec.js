"use strict";

//*global require,expect*/
import Terria from "../../../../../lib/Models/Terria";
import CatalogGroup from "../../../../../lib/Models/CatalogGroup";
import WebMapServiceCatalogItem from "../../../../../lib/Models/WebMapServiceCatalogItem";
import createCatalogMemberFromType from "../../../../../lib/Models/createCatalogMemberFromType";

import ViewState from "../../../../../lib/ReactViewModels/ViewState";
import {
  buildShareLink,
  SHARE_VERSION
} from "../../../../../lib/ReactViews/Map/Panels/SharePanel/BuildShareLink";
import URI from "urijs";

var terria;
var catalog;
var viewState;

beforeEach(function() {
  terria = new Terria({
    baseUrl: "./"
  });
  terria.baseMap = {
    name: "Bing Maps Aerial"
  };
  createCatalogMemberFromType.register("group", CatalogGroup);
  createCatalogMemberFromType.register("wms", WebMapServiceCatalogItem);

  catalog = terria.catalog;

  viewState = new ViewState({ terria });
});

const decodeAndParseStartHash = url =>
  JSON.parse(URI.decode(URI.parse(url).fragment.replace(/start=/, "")));

const flattenInitSources = initSources =>
  initSources.reduce((acc, initSource) => {
    Object.keys(initSource).forEach(key => {
      acc[key] = initSource[key];
    });

    return acc;
  }, {});

describe("BuildShareLink", function() {
  it("should generate a url with default catalog related flags", function() {
    const shareLink = buildShareLink(terria, viewState);
    const params = decodeAndParseStartHash(shareLink);
    const initSources = flattenInitSources(params.initSources);

    expect(params.version).toBe(SHARE_VERSION);
    expect(initSources.previewedItemId).toBeUndefined();
    expect(initSources.sharedFromExplorerPanel).toBeUndefined();
  });

  it("should generate a url with catalog sharing flags", function(done) {
    catalog
      .updateFromJson([
        {
          name: "A",
          type: "group",
          items: [
            {
              id: "C",
              name: "C",
              type: "wms",
              isEnabled: false
            }
          ]
        },
        {
          name: "B",
          type: "group"
        }
      ])
      .then(function() {
        // preview the wms item & the share link should reflect that
        viewState.viewCatalogMember(catalog.group.items[0].items[0]);
        const shareLink = buildShareLink(terria, viewState);
        const params = decodeAndParseStartHash(shareLink);
        const initSources = flattenInitSources(params.initSources);

        expect(initSources.previewedItemId).toBe("C");
        expect(initSources.sharedFromExplorerPanel).toBe(true);

        return catalog.updateByShareKeys({});
      })
      .then(function() {
        // close the catalog & the share link should reflect that
        viewState.closeCatalog();
        const params = decodeAndParseStartHash(
          buildShareLink(terria, viewState)
        );
        const initSources = flattenInitSources(params.initSources);

        expect(initSources.previewedItemId).toBeUndefined();
        expect(initSources.sharedFromExplorerPanel).toBeUndefined();

        done();
      })
      .otherwise(done.fail);
  });
});
