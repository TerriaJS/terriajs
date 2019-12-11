import Story from "../../../lib/ReactViews/Story/Story";
import { getShallowRenderedOutput } from "../MoreShallowTools";
import React from "react";

describe("Story", function() {
  it("should be wrapped with the sortable HOC as the first HOC", function() {
    expect(Story.name).toBe("SortableItem");
  });
  it("should render the translation HOC as its child, so it is draggable", function() {
    const story = <Story />;
    const result = getShallowRenderedOutput(story);
    expect(result.type.name).toBe("I18nextWithTranslation");
    expect(result.type.displayName).toBe("withI18nextTranslation(Story)");
  });
});
