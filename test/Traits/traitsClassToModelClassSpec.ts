import traitsClassToModelClass from "../../lib/Traits/traitsClassToModelClass";
import UrlTraits from "../../lib/Traits/UrlTraits";

describe("traitsClassToModelClass", function() {
  it("memoizes correctly", function() {
    expect(traitsClassToModelClass(UrlTraits)).toBe(
      traitsClassToModelClass(UrlTraits)
    );
  });
});
