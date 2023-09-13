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

  it("should include embedded media using iframe tag with allowed sources and attributes", function () {
    const theStory = {
      id: "some id",
      title: "test",
      text: 'Story with video. <iframe src="https://www.youtube.com/embed/1234" title="Should be omitted" referrerpolicy="unsafe-url" width="560" height="315" allow="autoplay; fullscreen"></iframe><iframe src="https://www.youtube-nocookie.com/embed/1234" title="Should be omitted" referrerpolicy="unsafe-url" width="560" height="315" allow="autoplay; fullscreen"></iframe><iframe src="https://player.vimeo.com/video/1234" title="Should be omitted" referrerpolicy="unsafe-url" width="560" height="315" allow="autoplay; fullscreen"></iframe>'
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

    expect(theInstance.children.length === 4);

    expect(theInstance.children[0] as string).toEqual("Story with video. ");

    let theIframeInstance = theInstance.children[1] as ReactTestInstance;
    expect(theIframeInstance.type).toBe("iframe");
    expect(Object.keys(theIframeInstance.props).length).toBe(3);
    expect(theIframeInstance.props.src).toBe(
      "https://www.youtube.com/embed/1234"
    );
    expect(theIframeInstance.props.width).toBe("560");
    expect(theIframeInstance.props.height).toBe("315");

    theIframeInstance = theInstance.children[2] as ReactTestInstance;
    expect(theIframeInstance.type).toBe("iframe");
    expect(Object.keys(theIframeInstance.props).length).toBe(3);
    expect(theIframeInstance.props.src).toBe(
      "https://www.youtube-nocookie.com/embed/1234"
    );
    expect(theIframeInstance.props.width).toBe("560");
    expect(theIframeInstance.props.height).toBe("315");

    theIframeInstance = theInstance.children[3] as ReactTestInstance;
    expect(theIframeInstance.type).toBe("iframe");
    expect(Object.keys(theIframeInstance.props).length).toBe(3);
    expect(theIframeInstance.props.src).toBe(
      "https://player.vimeo.com/video/1234"
    );
    expect(theIframeInstance.props.width).toBe("560");
    expect(theIframeInstance.props.height).toBe("315");
  });

  it("should exclude embedded media using iframe tag with any forbidden sources", function () {
    const theStory = {
      id: "some id",
      title: "test",
      text: 'Story with video. <iframe src="https://www.youtube.com/embed/1234" width="560" height="315"></iframe><iframe src="https://any.forbidden.video.source" width="560" height="315"></iframe>'
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
  it("should not add iframe tag if there is no iframe in the story text", function () {
    const theStory = {
      id: "some id",
      title: "test",
      text: 'Story with video. <iframe2 src="https://www.youtube.com/embed/1234" width="560" height="315"></iframe2>'
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
