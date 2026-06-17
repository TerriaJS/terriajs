import SearchProviderMixin from "../../../lib/ModelMixins/SearchProviders/SearchProviderMixin";
import CommonStrata from "../../../lib/Models/Definition/CommonStrata";
import CreateModel from "../../../lib/Models/Definition/CreateModel";
import Terria from "../../../lib/Models/Terria";
import BingMapsSearchProviderTraits from "../../../lib/Traits/SearchProviders/BingMapsSearchProviderTraits";

class TestSearchProvider extends SearchProviderMixin(
  CreateModel(BingMapsSearchProviderTraits)
) {
  type = "test";

  public override logEvent = jasmine.createSpy("logEvent");
  public override doSearch = jasmine
    .createSpy("doSearch")
    .and.callFake(() => Promise.resolve());
}

describe("SearchProviderMixin", () => {
  let terria: Terria;
  let searchProvider: TestSearchProvider;

  beforeEach(() => {
    terria = new Terria({
      baseUrl: "./"
    });
    searchProvider = new TestSearchProvider("test", terria);
    searchProvider.setTrait(CommonStrata.definition, "minCharacters", 3);
    searchProvider.logEvent.calls.reset();
    searchProvider.doSearch.calls.reset();
  });

  it(" - properly mixed", () => {
    expect(SearchProviderMixin.isMixedInto(searchProvider)).toBeTruthy();
  });

  it(" - should not run search if searchText is undefined", () => {
    searchProvider.search(undefined as never);
    expect(searchProvider.searchResult.isSearching).toBeFalsy();
    expect(searchProvider.searchResult.message).toBeDefined();

    expect(searchProvider.logEvent).not.toHaveBeenCalled();
    expect(searchProvider.doSearch).not.toHaveBeenCalled();
  });

  it(" - should not run search if only spaces", () => {
    searchProvider.search("        ");
    expect(searchProvider.searchResult.isSearching).toBeFalsy();
    expect(searchProvider.searchResult.message).toBeDefined();

    expect(searchProvider.logEvent).not.toHaveBeenCalled();
    expect(searchProvider.doSearch).not.toHaveBeenCalled();
  });

  it(" - should not run search if searchText less than minCharacters", () => {
    searchProvider.search("12");
    expect(searchProvider.searchResult.isSearching).toBeFalsy();
    expect(searchProvider.searchResult.message).toBeDefined();

    expect(searchProvider.logEvent).not.toHaveBeenCalled();
    expect(searchProvider.doSearch).not.toHaveBeenCalled();
  });

  it(" - should run search if searchText is valid", () => {
    searchProvider.search("1234", true);
    expect(searchProvider.searchResult.isSearching).toBeTruthy();
    expect(searchProvider.searchResult.message).not.toBeDefined();

    expect(searchProvider.logEvent).toHaveBeenCalled();
    expect(searchProvider.doSearch).toHaveBeenCalled();
  });

  describe("searchBarModel minCharacters fallback", () => {
    let freshProvider: TestSearchProvider;

    beforeEach(() => {
      freshProvider = new TestSearchProvider("fresh", terria);
      freshProvider.logEvent.calls.reset();
      freshProvider.doSearch.calls.reset();
    });

    it(" - uses searchBarModel minCharacters when provider trait is not set", () => {
      terria.searchBarModel.setTrait(
        CommonStrata.definition,
        "minCharacters",
        7
      );
      expect(freshProvider.minCharacters).toEqual(7);
    });

    it(" - provider minCharacters takes precedence over searchBarModel", () => {
      terria.searchBarModel.setTrait(
        CommonStrata.definition,
        "minCharacters",
        7
      );
      freshProvider.setTrait(CommonStrata.definition, "minCharacters", 2);
      expect(freshProvider.minCharacters).toEqual(2);
    });

    it(" - does not search when text is shorter than searchBarModel minCharacters", () => {
      terria.searchBarModel.setTrait(
        CommonStrata.definition,
        "minCharacters",
        7
      );
      freshProvider.search("abc", true);
      expect(freshProvider.searchResult.isSearching).toBeFalsy();
      expect(freshProvider.doSearch).not.toHaveBeenCalled();
    });
  });
});
