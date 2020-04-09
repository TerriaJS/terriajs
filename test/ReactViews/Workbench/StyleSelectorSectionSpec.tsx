const findAllWithType = require("react-shallow-testutils").findAllWithType;
import { getShallowRenderedOutput } from "../MoreShallowTools";
import React from "react";
// import Terria from "../../../lib/Models/Terria";
// import ViewState from "../../../lib/ReactViewModels/ViewState";
// import WebMapServiceCatalogItem from "../../../lib/Models/WebMapServiceCatalogItem";
import StyleSelectorSection from "../../../lib/ReactViews/Workbench/Controls/StyleSelectorSection";

describe("StyleSelectorSection", function() {
  // uncomment these if you need terria/viewstate
  // let terria: Terria;
  // let viewState: ViewState;

  beforeEach(function() {
    // uncomment these if you need terria/viewstate
    // terria = new Terria({
    //   baseUrl: "./"
    // });
    // viewState = new ViewState({
    //   terria: terria
    // });
  });

  it("renders the provided style options for a given item", function() {
    // ideally you would mock out an actual wms item and then set its styles, but here's a quick example
    // for mocking something purely to check the React element does what you expect it to.
    // const someWMS = new WebMapServiceCatalogItem("blah", terria);
    const mockItem = {
      selectableDimensions: {
        availableStyles: [
          {
            name: "Neko Style",
            id: "first_style"
          },
          {
            name: "Mochi Style",
            id: "second_style"
          }
        ]
      }
    };

    const styleSelectorSection = <StyleSelectorSection item={mockItem} />;
    const result = getShallowRenderedOutput(styleSelectorSection);
    const memberComponents = findAllWithType(result, "option");

    expect(memberComponents.length).toEqual(2);
    memberComponents.forEach((member: any, index: number) => {
      // `StyleSelectorSection`s render out html option elements, with the names as the values
      expect(member.type).toEqual("option");
      expect(mockItem.selectableDimensions.availableStyles[index].name).toEqual(
        member.props.children
      );
    });
  });
});
