import React from "react";
import PropTypes from "prop-types";
import FadeIn from "../Transitions/FadeIn/FadeIn";
import Box, { BoxSpan } from "../../Styled/Box";
import Spacing from "../../Styled/Spacing";
import { TextSpan } from "../../Styled/Text";
import { RawButton } from "../../Styled/Button";
import { withTheme } from "styled-components";
import Caret from "../Generic/Caret";

class Prompt extends React.PureComponent {
  // Tried to keep/make use of the original story prompt css properties
  render() {
    return (
      <FadeIn isVisible={this.props.isVisible}>
        <Box
          column
          rounded
          positionAbsolute
          backgroundColor={this.props.theme.colorPrimary}
          paddedRatio={3}
          styledWidth={`${this.props.promptWidth || 200}px`}
          css={`
            top: ${this.props.promptTopOffset || 40}px;
            left: ${this.props.promptLeftOffset || -80}px;
          `}
        >
          <Caret
            style={{
              top: `${this.props.caretTopOffset || -8}px`,
              left: `${this.props.caretLeftOffset || 110}px`
            }}
            size={this.props.caretSize || 18}
            background={this.props.theme.colorPrimary}
          />
          {this.props.content}
          <Spacing bottom={4} />
          <RawButton
            title={this.props.dismissText}
            onClick={this.props.dismissAction}
          >
            <BoxSpan fullWidth left>
              <TextSpan isLink medium textLight>
                {this.props.dismissText}
              </TextSpan>
            </BoxSpan>
          </RawButton>
        </Box>
      </FadeIn>
    );
  }
}

Prompt.propTypes = {
  content: PropTypes.object,
  dismissText: PropTypes.string,
  dismissAction: PropTypes.func,
  displayDelay: PropTypes.number,
  promptWidth: PropTypes.number,
  promptTopOffset: PropTypes.number,
  promptLeftOffset: PropTypes.number,
  caretTopOffset: PropTypes.number,
  caretLeftOffset: PropTypes.number,
  caretSize: PropTypes.number,
  isVisible: PropTypes.bool.isRequired,
  theme: PropTypes.object.isRequired
};

export default withTheme(Prompt);
