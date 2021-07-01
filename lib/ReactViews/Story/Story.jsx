/* eslint-disable react/prop-types */
import PropTypes from "prop-types";
import React from "react";
import { sortable } from "react-anything-sortable";
import { withTranslation } from "react-i18next";
import styled, { withTheme } from "styled-components";
import Box from "../../Styled/Box";
import { RawButton } from "../../Styled/Button";
import Ul from "../../Styled/List";
import Text from "../../Styled/Text";
import Spacing from "../../Styled/Spacing";
import parseCustomHtmlToReact from "../Custom/parseCustomHtmlToReact";
import Icon, { StyledIcon } from "../../Styled/Icon";
import classNames from "classnames";

const findTextContent = content => {
  if (typeof content === "string") {
    return content;
  }
  if (content[0] && content[0].props && content[0].props.children) {
    return findTextContent(content[0].props.children);
  }
  if (!content.props || !content.props.children) {
    return "";
  }
  if (typeof content.props.children === "string") {
    return content.props.children;
  }
  return findTextContent(content.props.children);
};

const StoryControl = styled(Box).attrs({
  centered: true,
  left: true,
  justifySpaceBetween: true
})``;

const StoryMenuButton = styled(RawButton)`
  color: ${props => props.theme.textDarker};
  background-color: ${props => props.theme.textLight};

  ${StyledIcon} {
    width: 35px;
  }

  svg {
    fill: ${props => props.theme.textDarker};
    width: 18px;
    height: 18px;
  }
  & > span {
    // position: absolute;
    // left: 37px;
  }

  border-radius: 0;

  width: 114px;
  // ensure we support long strings
  min-height: 32px;
  display: block;

  &:hover,
  &:focus {
    color: ${props => props.theme.textLight};
    background-color: ${props => props.theme.colorPrimary};
    svg {
      fill: ${props => props.theme.textLight};
      stroke: ${props => props.theme.textLight};
    }
  }
`;

const hideList = props => props.openMenu(null);

const getTruncatedContent = text => {
  const content = parseCustomHtmlToReact(text);
  const except = findTextContent(content);
  return except.slice(0, 100);
};

const toggleMenu = props => event => {
  event.stopPropagation();
  props.openMenu(props.story);
};

const viewStory = props => event => {
  event.stopPropagation();
  props.viewStory(props.story);
  hideList(props);
};

const deleteStory = props => event => {
  event.stopPropagation();
  props.deleteStory(props.story);
  hideList(props);
};

const editStory = props => event => {
  event.stopPropagation();
  props.editStory(props.story);
  hideList(props);
};

const recaptureStory = props => event => {
  event.stopPropagation();
  props.recaptureStory(props.story);
  hideList(props);
};

const calculateOffset = props => storyRef => {
  const offsetTop = storyRef.current?.offsetTop || 0;
  const scrollTop = props.parentRef.current.scrollTop || 0;
  const heightParrent = storyRef.current?.offsetParent.offsetHeight || 0;
  const offsetTopScroll = offsetTop - scrollTop + 25;
  if (offsetTopScroll + 125 > heightParrent) {
    return `bottom ${offsetTopScroll + 125 - heightParrent + 45}px;`;
  }
  return `top: ${offsetTopScroll}px;`;
};

const renderMenu = props => menuRef => {
  const { t } = props;
  return (
    <Ul ref={e => (menuRef = e)}>
      <li>
        <StoryMenuButton
          onClick={viewStory(props)}
          title={t("story.viewStory")}
        >
          <StoryControl>
            <StyledIcon glyph={Icon.GLYPHS.viewStory} />
            <span>{t("story.view")}</span>
          </StoryControl>
        </StoryMenuButton>
      </li>
      <li>
        <StoryMenuButton
          onClick={editStory(props)}
          title={t("story.editStory")}
        >
          <StoryControl>
            <StyledIcon glyph={Icon.GLYPHS.editStory} />
            <span>{t("story.edit")}</span>
          </StoryControl>
        </StoryMenuButton>
      </li>
      <li>
        <StoryMenuButton
          onClick={recaptureStory(props)}
          title={t("story.recaptureStory")}
        >
          <StoryControl>
            <StyledIcon glyph={Icon.GLYPHS.story} />
            <span>{t("story.recapture")}</span>
          </StoryControl>
        </StoryMenuButton>
      </li>
      <li>
        <StoryMenuButton
          onClick={deleteStory(props)}
          title={t("story.deleteStory")}
        >
          <StoryControl>
            <StyledIcon glyph={Icon.GLYPHS.cancel} />
            <span>{t("story.delete")}</span>
          </StoryControl>
        </StoryMenuButton>
      </li>
    </Ul>
  );
};

class Story extends React.Component {
  constructor(props) {
    super(props);
    this.storyRef = React.createRef();
    this.menuRef = React.createRef();
  }

  /* eslint-disable-next-line camelcase */
  UNSAFE_componentWillMount() {
    window.addEventListener("click", this.hideList);
  }

  componentWillUnmount() {
    window.removeEventListener("click", this.hideList);
  }

  render() {
    const story = this.props.story;
    const bodyText = getTruncatedContent(story.text);
    const { t } = this.props;
    return (
      <>
        <Box
          ref={this.storyRef}
          column
          backgroundColor={this.props.theme.darkWithOverlay}
          rounded
          css={`
            cursor: move;
            float: none !important;
          `}
          style={this.props.style}
          className={classNames(this.props.className)}
          onMouseDown={this.props.onMouseDown}
          onTouchStart={this.props.onTouchStart}
          position="static"
        >
          <Box
            fullWidth
            position="static"
            justifySpaceBetween
            padded
            verticalCenter
            styledHeight={"40px"}
            backgroundColor={this.props.theme.darkWithOverlay}
            rounded
            css={`
              padding-left: 15px;
              padding-right: 0;
              border-bottom: 1px solid rgba(255, 255, 255, 0.15);
            `}
          >
            <Text textLight medium>
              {story.title && story.title.length > 0
                ? story.title
                : t("story.untitledScene")}
            </Text>
            <Box>
              {this.props.recaptureStorySuccessful && (
                <RawButton>
                  <StyledIcon
                    styledWidth="20px"
                    light
                    glyph={Icon.GLYPHS.recapture}
                    onClick={toggleMenu(this.PropTypesprops)}
                    css={`
                      padding-right: 10px;
                    `}
                  />
                </RawButton>
              )}
              <MenuButton
                theme={this.props.theme}
                onClick={toggleMenu(this.props)}
              >
                <StyledIcon
                  styledWidth="20px"
                  light
                  glyph={Icon.GLYPHS.menuDotted}
                  onClick={toggleMenu(this.props)}
                />
              </MenuButton>
            </Box>
            {this.props.menuOpen && (
              <Box
                css={`
                  position: absolute;
                  z-index: 100;
                  right: 20px;

                  ${this.calculateOffset}
                  padding: 0;
                  margin: 0;

                  ul {
                    list-style: none;
                  }
                `}
              >
                {renderMenu(this.props)(this.menuRef)}
              </Box>
            )}
          </Box>
          {bodyText.length > 0 && (
            <Box paddedRatio={2} paddedHorizontally={3}>
              <Text textLight medium>
                {bodyText}
              </Text>
            </Box>
          )}
        </Box>
        <Spacing bottom={1} />
      </>
    );
  }
}

const MenuButton = styled(RawButton)`
  padding: 0 10px 0 10px;
  min-height: 40px;
  border-radius: ${props => props.theme.radiusLarge};
  background: transparent;
  &:hover,
  &:focus {
    opacity: 0.9;
    background-color: ${props => props.theme.dark};
  }
`;

Story.propTypes = {
  story: PropTypes.object,
  editStory: PropTypes.func,
  viewStory: PropTypes.func,
  deleteStory: PropTypes.func,
  recaptureStory: PropTypes.func,
  recaptureStorySuccessful: PropTypes.bool,
  onMouseDown: PropTypes.func.isRequired,
  onTouchStart: PropTypes.func.isRequired,
  style: PropTypes.object,
  className: PropTypes.string,
  menuOpen: PropTypes.bool,
  openMenu: PropTypes.func,
  theme: PropTypes.object.isRequired,
  parentRef: PropTypes.any,
  t: PropTypes.func.isRequired
};

export default sortable(withTranslation()(withTheme(Story)));
