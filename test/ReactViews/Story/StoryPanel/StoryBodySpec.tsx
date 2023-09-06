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

  it("should include embedded media using iframe tag with allowed source", function () {
    // Story editor will only save embedded video with source, width and height.
    const theStory = {
      id: "some id",
      title: "test",
      text: 'Story with video. <iframe src="https://www.youtube.com/embed/1234" width="560" height="315"></iframe>'
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
    expect(theIframeInstance.props.src).toBe(
      "https://www.youtube.com/embed/1234"
    );
    expect(theIframeInstance.props.width).toBe("560");
    expect(theIframeInstance.props.height).toBe("315");
  });

  it("should exclude embedded media using iframe tag with any forbidden sources", function () {
    const theStory = {
      id: "some id",
      title: "test",
      text: 'Story with video. <iframe src="https://www.youtube.com/embed/ title="My Title" width="560" height="315""></iframe> <iframe src="https://some.video.link" width="560" height="315" "></iframe>'
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
