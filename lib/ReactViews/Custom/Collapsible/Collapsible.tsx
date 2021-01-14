"use strict";

import { observer } from "mobx-react";
import React from "react";
import { GLYPHS, StyledIcon } from "../../Icon";

const RawButton: any = require("../../../Styled/Button").RawButton;
const Text: any = require("../../../Styled/Text").default;
const TextSpan: any = require("../../../Styled/Text").TextSpan;
const Box: any = require("../../../Styled/Box").default;
const SpacingSpan: any = require("../../../Styled/Spacing").SpacingSpan;

interface CollapsibleProps {
  title: string;
  isOpen?: boolean;
  isInverse?: boolean;
  onToggle?: (isOpen: boolean) => void;
  btnRight?: boolean;
  /**
   * caret is default style
   */
  btnStyle?: "plus" | "caret";
  titleTextProps?: any;
  bodyBoxProps?: any;
  bodyTextProps?: any;
  /**
   * caret is light coloured (default is true)
   */
  light?: boolean;
}

@observer
export default class Collapsible extends React.Component<
  CollapsibleProps,
  { isOpen: boolean }
> {
  constructor(props: CollapsibleProps) {
    super(props);
    this.state = { isOpen: props.isOpen ?? false };
  }

  toggleOpen() {
    this.setState({ isOpen: !this.state.isOpen });
    if (this.props.onToggle) this.props.onToggle(!this.state.isOpen);
  }

  render() {
    const CollapseIcon = (
      <StyledIcon
        displayInline
        styledWidth={"8px"}
        light={this.props.light ?? true}
        glyph={
          this.props.btnStyle === "plus"
            ? this.state.isOpen
              ? GLYPHS.minusThick
              : GLYPHS.plusThick
            : this.state.isOpen
            ? GLYPHS.opened
            : GLYPHS.closed
        }
      />
    );

    return (
      <React.Fragment>
        <RawButton
          fullWidth
          onClick={this.toggleOpen.bind(this)}
          css={`
            text-align: left;
          `}
          aria-expanded={this.state.isOpen}
          aria-controls={`${this.props.title}`}
        >
          {!this.props.btnRight && CollapseIcon}
          {!this.props.btnRight && <SpacingSpan right={2} />}
          <TextSpan
            textLight={this.props.light ?? true}
            bold
            medium
            {...this.props.titleTextProps}
          >
            {this.props.title}
          </TextSpan>
          {this.props.btnRight && <SpacingSpan right={2} />}
          {this.props.btnRight && CollapseIcon}
        </RawButton>
        <Box {...this.props.bodyBoxProps}>
          {this.state.isOpen && (
            <Text
              textLight={this.props.light ?? true}
              small
              id={`${this.props.title}`}
              {...this.props.bodyTextProps}
            >
              {this.props.children}
            </Text>
          )}
        </Box>
      </React.Fragment>
    );
  }
}
