import React from "react";
import { create, act, ReactTestRenderer } from "react-test-renderer";
import SearchForm, {
  FieldSet,
  NumericParameter,
  SearchFormProps
} from "../../../../lib/ReactViews/Tools/ItemSearchTool/SearchForm";

describe("SearchForm", function() {
  describe("search button", function() {
    it("it is not shown if no parameters are given", function() {
      const { root } = render({
        onSubmit: () => {},
        parameters: []
      });
      expect(() => root.findByProps({ type: "submit" })).toThrow();
    });

    it("it is shown if at least 1 parameter is given", function() {
      const { root } = render({
        onSubmit: () => {},
        parameters: [
          {
            type: "numeric",
            id: "height",
            name: "Building height",
            range: { min: 10, max: 200 }
          }
        ]
      });
      const searchButton = root.findByProps({ type: "submit" });
      expect(searchButton).toBeDefined();
      expect(searchButton.props).toEqual(
        jasmine.objectContaining({
          type: "submit",
          primary: true,
          children: "itemSearchTool.searchBtnText"
        })
      );
    });
  });

  it("calls onSubmit with changed values", function() {
    const onSubmit = jasmine.createSpy("onSubmit");
    const { root } = render({
      onSubmit,
      parameters: [
        {
          type: "numeric",
          id: "height",
          name: "Building height",
          range: { min: 10, max: 200 }
        }
      ]
    });
    const form = root.findByType("form");
    const height = root.findByType(NumericParameter);
    height.props.onChange({ start: 30, end: 50 });
    form.props.onSubmit({ preventDefault: () => {} });
    expect(onSubmit).toHaveBeenCalledWith({ height: { start: 30, end: 50 } });
  });

  it("can render inputs for numeric parameter", function() {
    const { root } = render({
      onSubmit: () => {},
      parameters: [
        {
          type: "numeric",
          id: "height",
          name: "Building height",
          range: { min: 10, max: 200 }
        }
      ]
    });
    const minInput = root.findByProps({ name: "height-min" });
    const maxInput = root.findByProps({ name: "height-max" });
    expect(minInput).toBeDefined();
    expect(minInput.props).toEqual(
      jasmine.objectContaining({
        type: "number",
        name: "height-min",
        min: 10,
        max: 200,
        step: "any",
        placeholder: "10"
      })
    );
    expect(maxInput.props).toEqual(
      jasmine.objectContaining({
        type: "number",
        name: "height-max",
        min: 10,
        max: 200,
        step: "any",
        placeholder: "200"
      })
    );
  });

  it("can be disabled", function() {
    const { root } = render({
      onSubmit: () => {},
      parameters: [
        {
          type: "numeric",
          id: "height",
          name: "Building height",
          range: { min: 10, max: 200 }
        }
      ],
      disabled: true
    });
    const fieldSet = root.findByType(FieldSet);
    const searchButton = root.findByProps({ type: "submit" });
    expect(fieldSet.props.disabled).toBe(true);
    expect(searchButton.props.disabled).toBe(true);
  });
});

function render(
  props: Omit<SearchFormProps, "i18n" | "t" | "tReady">
): ReactTestRenderer {
  let rendered: ReactTestRenderer;
  act(() => {
    rendered = create(<SearchForm {...props} />);
  });
  // @ts-ignore
  return rendered;
}
