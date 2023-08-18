import React from "react";
import StoryBody from "../../../../lib/ReactViews/Story/StoryPanel/StoryBody";
import { act } from "react-dom/test-utils";
import {
  ReactTestInstance,
  ReactTestRenderer,
  create
} from "react-test-renderer";

describe("StoryBody", function () {
  let testRenderer: ReactTestRenderer;

  it("should include embedded media using iframe tag", function () {
    const theStory = {
      id: "some id",
      title: "test",
      text: 'Story with video. <iframe title="My Title" width="560" height="315" src="https://some.video.link"></iframe>'
    };

    act(() => {
      testRenderer = create(<StoryBody isCollapsed={false} story={theStory} />);
    });

    const storyBody = testRenderer.root.findAllByType(StoryBody);
    expect(storyBody.length === 1);

    const theInstance = (
      (
        (storyBody[0].children[0] as ReactTestInstance)
          .children[0] as ReactTestInstance
      ).children[0] as ReactTestInstance
    ).children[0] as ReactTestInstance;

    expect(theInstance.children.length === 2);

    expect(theInstance.children[0] as string).toEqual("Story with video. ");

    const theIframeInstance = theInstance.children[1] as ReactTestInstance;
    expect(theIframeInstance.type).toBe("iframe");
    expect(theIframeInstance.props.title).toBe("My Title");
    expect(theIframeInstance.props.src).toBe("https://some.video.link");
    expect(theIframeInstance.props.width).toBe("560");
    expect(theIframeInstance.props.height).toBe("315");
  });

  it("should exclude embedded media using unsafe tag", function () {
    const theStory = {
      id: "some id",
      title: "test",
      text: 'Story with video. <iframe2 width="560" height="315" src="https://some.video.link"></iframe2>'
    };

    act(() => {
      testRenderer = create(<StoryBody isCollapsed={false} story={theStory} />);
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
