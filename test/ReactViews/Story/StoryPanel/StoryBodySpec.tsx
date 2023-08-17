import React from "react";
import StoryBody from "../../../../lib/ReactViews/Story/StoryPanel/StoryBody";
import { act } from "react-dom/test-utils";
import TestRenderer, { ReactTestInstance, create } from "react-test-renderer";
import Box from "../../../../lib/Styled/Box";
import { exp } from "protomaps";

describe("StoryBody", function () {
  it("should include embedded video using allowed tag and ignore unallowed attributes", function () {
    const theStory = {
      id: "some id",
      title: "test",
      text: 'Story with video. <iframe title="Special Title" width="560" height="315" src="https://some.video.link"></iframe>'
    };

    let testRenderer: ReturnType<typeof create> = TestRenderer.create(
      <StoryBody isCollapsed={false} story={theStory} />
    );

    act(() => {
      testRenderer = TestRenderer.create(
        <StoryBody isCollapsed={false} story={theStory} />
      );
    });

    const storyBody = testRenderer.root.findAllByType(StoryBody);
    expect(storyBody.length === 1);

    const theInstance = (
      (
        (storyBody[0].children[0] as ReactTestInstance)
          .children[0] as ReactTestInstance
      ).children[0] as ReactTestInstance
    ).children[0] as ReactTestInstance;

    const theIframeInstance = theInstance.children[1] as ReactTestInstance;

    expect(theInstance.children.length === 2);
    expect(theInstance.children[0] as string).toEqual("Story with video. ");
    expect(theIframeInstance.type).toBe("iframe");
    expect(theIframeInstance.props.title).toBe(undefined);
    expect(theIframeInstance.props.src).toBe("https://some.video.link");
    expect(theIframeInstance.props.width).toBe("560");
    expect(theIframeInstance.props.height).toBe("315");
  });

  it("should exclude embedded video using unknown tag", function () {
    const theStory = {
      id: "some id",
      title: "test",
      text: 'Story with video. <iframe2 width="560" height="315" src="https://some.video.link"></iframe2>'
    };

    let testRenderer: ReturnType<typeof create> = TestRenderer.create(
      <StoryBody isCollapsed={false} story={theStory} />
    );

    act(() => {
      testRenderer = TestRenderer.create(
        <StoryBody isCollapsed={false} story={theStory} />
      );
    });

    const storyBody = testRenderer.root.findAllByType(StoryBody);
    expect(storyBody.length === 1);

    const theInstance = (
      (
        (storyBody[0].children[0] as ReactTestInstance)
          .children[0] as ReactTestInstance
      ).children[0] as ReactTestInstance
    ).children[0] as ReactTestInstance;

    expect(theInstance.children.length === 1);
    expect(theInstance.children[0] as string).toEqual("Story with video. ");
  });
});
