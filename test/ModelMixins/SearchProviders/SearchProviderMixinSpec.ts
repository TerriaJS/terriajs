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
    .and.returnValue(Promise.resolve());
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
    expect(searchProvider.searchResult.state).toBe('idle');
    expect(searchProvider.searchResult.message).toBeDefined();

    expect(searchProvider.logEvent).not.toHaveBeenCalled();
    expect(searchProvider.doSearch).not.toHaveBeenCalled();
  });

  it(" - should not run search if only spaces", () => {
    searchProvider.search("        ");
    expect(searchProvider.searchResult.state).toBe('idle');
    expect(searchProvider.searchResult.message).toBeDefined();

    expect(searchProvider.logEvent).not.toHaveBeenCalled();
    expect(searchProvider.doSearch).not.toHaveBeenCalled();
  });

  it(" - should not run search if searchText less than minCharacters", () => {
    searchProvider.search("12");
    expect(searchProvider.searchResult.state).toBe('idle');
    expect(searchProvider.searchResult.message).toBeDefined();

    expect(searchProvider.logEvent).not.toHaveBeenCalled();
    expect(searchProvider.doSearch).not.toHaveBeenCalled();
  });

  it(" - should run search if searchText is valid", () => {
    searchProvider.search("1234", true);
    expect(searchProvider.searchResult.state).toBe('searching');
    expect(searchProvider.searchResult.message).not.toBeDefined();

    expect(searchProvider.logEvent).toHaveBeenCalled();
    expect(searchProvider.doSearch).toHaveBeenCalled();
  });
});
