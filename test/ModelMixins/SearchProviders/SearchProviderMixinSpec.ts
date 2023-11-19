import SearchProviderMixin from "../../../lib/ModelMixins/SearchProviders/SearchProviderMixin";
import CommonStrata from "../../../lib/Models/Definition/CommonStrata";
import CreateModel from "../../../lib/Models/Definition/CreateModel";
import Terria from "../../../lib/Models/Terria";
import BingMapsSearchProviderTraits from "../../../lib/Traits/SearchProviders/BingMapsSearchProviderTraits";

class TestSearchProvider extends SearchProviderMixin(
  CreateModel(BingMapsSearchProviderTraits)
) {
  type = "test";

  constructor(uniqueId: string | undefined, terria: Terria) {
    super(uniqueId, terria);
  }

  public override logEvent = jasmine.createSpy();
  public override doSearch = jasmine
    .createSpy()
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
    const result = searchProvider.search(undefined as never);
    expect(result.resultsCompletePromise).toBeDefined();
    expect(result.message).toBeDefined();

    expect(searchProvider.logEvent).not.toHaveBeenCalled();
    expect(searchProvider.doSearch).not.toHaveBeenCalled();
  });

  it(" - should not run search if only spaces", () => {
    const result = searchProvider.search("        ");
    expect(result.resultsCompletePromise).toBeDefined();
    expect(result.message).toBeDefined();

    expect(searchProvider.logEvent).not.toHaveBeenCalled();
    expect(searchProvider.doSearch).not.toHaveBeenCalled();
  });

  it(" - should not run search if searchText less than minCharacters", () => {
    const result = searchProvider.search("12");
    expect(result.resultsCompletePromise).toBeDefined();
    expect(result.message).toBeDefined();

    expect(searchProvider.logEvent).not.toHaveBeenCalled();
    expect(searchProvider.doSearch).not.toHaveBeenCalled();
  });

  it(" - should run search if searchText is valid", () => {
    const result = searchProvider.search("1234");
    expect(result.resultsCompletePromise).toBeDefined();
    expect(result.message).not.toBeDefined();

    expect(searchProvider.logEvent).toHaveBeenCalled();
    expect(searchProvider.doSearch).toHaveBeenCalled();
  });
});
