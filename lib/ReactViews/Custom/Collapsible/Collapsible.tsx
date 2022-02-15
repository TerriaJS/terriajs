"use strict";

import { observer } from "mobx-react";
import React, { useState, useEffect } from "react";
import Box, { IBoxProps } from "../../../Styled/Box";
import { RawButton } from "../../../Styled/Button";
import { SpacingSpan } from "../../../Styled/Spacing";
import Text, { TextSpan } from "../../../Styled/Text";
import { GLYPHS, StyledIcon } from "../../../Styled/Icon";
import { parseCustomMarkdownToReactWithOptions } from "../parseCustomMarkdownToReact";

interface CollapsibleIconProps {
  isOpen?: boolean;
  /**
   * caret is light coloured (default is true)
   */
  light?: boolean;
  /**
   * caret is default style
   */
  btnStyle?: "plus" | "caret";
}

interface CollapsibleProps extends CollapsibleIconProps {
  title: string;

  /** Function is called whenever Collapsible is toggled (close or open).
   * Return value is `true` if the listener has consumed the event, `false` otherwise.
   */
  onToggle?: (isOpen: boolean) => boolean | undefined;
  btnRight?: boolean;

  titleTextProps?: any;
  bodyBoxProps?: IBoxProps;
  bodyTextProps?: any;
}

export const CollapseIcon: React.FC<CollapsibleIconProps> = props => (
  <StyledIcon
    displayInline
    styledWidth={"8px"}
    light={props.light ?? true}
    glyph={
      props.btnStyle === "plus"
        ? props.isOpen
          ? GLYPHS.minus
          : GLYPHS.plus
        : GLYPHS.opened
    }
    opacity={props.isOpen ? 1 : 0.4}
    rotation={props.isOpen ? 0 : -90}
  />
);

const Collapsible: React.FC<CollapsibleProps> = observer(props => {
  const [isOpen, setIsOpen] = useState<boolean | undefined>();

  useEffect(() => setIsOpen(props.isOpen), [props.isOpen]);

  const toggleOpen = () => {
    const newIsOpen = !isOpen;
    // Only update isOpen state if onToggle doesn't consume the event
    if (!props.onToggle || !props.onToggle(newIsOpen)) setIsOpen(newIsOpen);
  };

  return (
    <React.Fragment>
      <RawButton
        fullWidth
        onClick={toggleOpen}
        css={`
          text-align: left;
          display: flex;
          align-items: center;
        `}
        aria-expanded={isOpen}
        aria-controls={`${props.title}`}
      >
        {!props.btnRight && <CollapseIcon {...props} isOpen={isOpen} />}
        {!props.btnRight && <SpacingSpan right={2} />}
        <TextSpan
          textLight={props.light ?? true}
          bold
          medium
          {...props.titleTextProps}
        >
          {parseCustomMarkdownToReactWithOptions(props.title, {
            inline: true
          })}
        </TextSpan>
        {props.btnRight && <SpacingSpan right={2} />}
        {props.btnRight && <CollapseIcon {...props} isOpen={isOpen} />}
      </RawButton>
      {isOpen ? (
        <Box {...props.bodyBoxProps}>
          <Text
            textLight={props.light ?? true}
            small
            id={`${props.title}`}
            {...props.bodyTextProps}
          >
            {props.children}
          </Text>
        </Box>
      ) : null}
    </React.Fragment>
  );
});

export default Collapsible;
