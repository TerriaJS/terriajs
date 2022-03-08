import React from "react";
import { Story } from "../Story";
import parseCustomHtmlToReact from "../../Custom/parseCustomHtmlToReact";
import styled from "styled-components";

const StoryContainer = styled.div<{ isCollapsed: boolean }>`
  max-height: ${props => (props.isCollapsed ? 0 : "100px")};
  @media (min-height: 700px) {
    max-height: ${props => (props.isCollapsed ? 0 : "200px")};
  }
  @media (min-height: 900px) {
    max-height: ${props => (props.isCollapsed ? 0 : "400px")};
  }

  padding: ${props => (props.isCollapsed ? 0 : "10px 15px")};
  transition: max-height 0.2s, padding 0.2s;
  overflow-y: auto;

  img {
    max-width: 100%;
  }
  * {
    max-width: 100%;
    //These are technically the same, but use both
    overflow-wrap: break-word;
    word-wrap: break-word;

    -ms-word-break: break-all;
    // This is the dangerous one in WebKit, as it breaks things wherever
    word-break: break-all;
    // Instead use this non-standard one:
    word-break: break-word;

    // Adds a hyphen where the word breaks, if supported (No Blink)
    -ms-hyphens: auto;
    -moz-hyphens: auto;
    -webkit-hyphens: auto;
    hyphens: auto;
  }
`;

const StoryBody = ({
  isCollapsed,
  story
}: {
  isCollapsed: boolean;
  story: Story;
}) => (
  <StoryContainer isCollapsed={isCollapsed}>
    {story.text && parseCustomHtmlToReact(story.text)}
  </StoryContainer>
);

export default StoryBody;
