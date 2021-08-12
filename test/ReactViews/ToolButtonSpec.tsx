import React from "react";
import TestRenderer from "react-test-renderer";
import Terria from "../../lib/Models/Terria";
import ViewState from "../../lib/ReactViewModels/ViewState";
import Icon from "../../lib/Styled/Icon";
import MapIconButton from "../../lib/ReactViews/MapIconButton/MapIconButton";
import { ToolButton } from "../../lib/ReactViews/Tool";

const TestComponent = () => <div>Test hello</div>;

describe("ToolButton", function() {
  let viewState: ViewState;
  let rendered: TestRenderer.ReactTestRenderer;

  beforeEach(function() {
    const terria = new Terria();
    viewState = new ViewState({
      terria,
      catalogSearchProvider: undefined,
      locationSearchProviders: []
    });
  });

  it("renders a map icon button", function() {
    rendered = TestRenderer.create(
      // @ts-ignore
      <ToolButton
        toolName="Test tool"
        viewState={viewState}
        icon={Icon.GLYPHS.bulb}
        getToolComponent={() => TestComponent as any}
        t={(key: any) => key}
      />
    );
    rendered.root.findByType(MapIconButton);
  });
});
