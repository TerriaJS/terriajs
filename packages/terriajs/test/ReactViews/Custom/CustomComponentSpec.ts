import CustomComponent from "../../../lib/ReactViews/Custom/CustomComponent";
import registerCustomComponentTypes from "../../../lib/ReactViews/Custom/registerCustomComponentTypes";

// The sanitizer uses these to decide which registered custom-component
// attributes to keep verbatim (free text, so values may contain `:`) versus
// which are URLs that must still be scheme-validated. Both are scoped to the
// attribute's own tag.
describe("CustomComponent", function () {
  beforeEach(function () {
    registerCustomComponentTypes();
  });

  describe("isFreeTextAttribute", function () {
    it("keeps a free-text attribute on its own tag", function () {
      expect(
        CustomComponent.isFreeTextAttribute("chart", "column-titles")
      ).toBe(true);
    });

    it("does not keep a URL attribute (it is scheme-validated instead)", function () {
      expect(CustomComponent.isFreeTextAttribute("chart", "src")).toBe(false);
    });

    it("does not keep a custom attribute on the wrong tag", function () {
      expect(
        CustomComponent.isFreeTextAttribute("collapsible", "column-titles")
      ).toBe(false);
    });

    it("does not keep attributes on unregistered tags", function () {
      expect(CustomComponent.isFreeTextAttribute("a", "href")).toBe(false);
      expect(CustomComponent.isFreeTextAttribute("img", "src")).toBe(false);
    });
  });

  describe("isUrlAttribute", function () {
    it("classifies a component's URL attributes", function () {
      expect(CustomComponent.isUrlAttribute("chart", "src")).toBe(true);
      expect(CustomComponent.isUrlAttribute("chart", "sources")).toBe(true);
    });

    it("does not classify free-text attributes as URLs", function () {
      expect(CustomComponent.isUrlAttribute("chart", "column-titles")).toBe(
        false
      );
    });

    it("does not classify attributes on unregistered tags", function () {
      expect(CustomComponent.isUrlAttribute("a", "href")).toBe(false);
    });
  });
});
