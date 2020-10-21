import RootCatalogGroup from "../../lib/Models/RootCatalogGroup";
import { runInAction } from "mobx";
import Terria from "../../lib/Models/Terria";
import i18next from "i18next";
import GroupMixin from "../../lib/ModelMixins/GroupMixin";
import CatalogMemberMixin from "../../lib/ModelMixins/CatalogMemberMixin";

describe("RootCatalogGroup", function() {
  let terria: Terria;
  let group: RootCatalogGroup;

  beforeEach(function() {
    terria = new Terria();
    group = new RootCatalogGroup("some-defined-id", terria);
  });

  it("has a type", function() {
    expect(group.type).toBe("root-group");
  });

  it("always returns / as its id", function() {
    expect(group.uniqueId).toEqual("/");
  });
});
