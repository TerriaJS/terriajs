import React from "react";
import PropTypes from "prop-types";
import FadeIn from "../Transitions/FadeIn/FadeIn";
import Box from "../../Styled/Box";
import Spacing from "../../Styled/Spacing";
import { TextSpan } from "../../Styled/Text";
import { RawButton } from "../../Styled/Button";
import { withTheme } from "styled-components";
import Caret from "../Generic/Caret";

class Prompt extends React.PureComponent {
  // Tried to keep/make use of the original story prompt css properties
  render() {
    return (
      // @ts-expect-error TS(2339): Property 'isVisible' does not exist on type 'Reado... Remove this comment to see the full error message
      <FadeIn isVisible={this.props.isVisible}>
        <Box
          displayInlineBlock
          rounded
          position="absolute"
          // @ts-expect-error TS(2339): Property 'theme' does not exist on type 'Readonly<... Remove this comment to see the full error message
          backgroundColor={this.props.theme?.colorPrimary}
          paddedRatio={3}
          // @ts-expect-error TS(2339): Property 'promptWidth' does not exist on type 'Rea... Remove this comment to see the full error message
          styledWidth={`${this.props.promptWidth || 200}px`}
          css={`
            // @ts-expect-error TS(2339): Property 'promptTopOffset' does not exist on type ... Remove this comment to see the full error message
            top: ${this.props.promptTopOffset || 50}px;
            // @ts-expect-error TS(2339): Property 'promptLeftOffset' does not exist on type... Remove this comment to see the full error message
            left: ${this.props.promptLeftOffset || -140}px;
            pointer-events: auto;
          `}
        >
          <Caret
            style={{
              // @ts-expect-error TS(2339): Property 'caretTopOffset' does not exist on type '... Remove this comment to see the full error message
              top: `${this.props.caretTopOffset || -8}px`,
              // @ts-expect-error TS(2339): Property 'caretLeftOffset' does not exist on type ... Remove this comment to see the full error message
              left: `${this.props.caretLeftOffset || 160}px`
            }}
            // @ts-expect-error TS(2769): No overload matches this call.
            size={this.props.caretSize || 18}
            // @ts-expect-error TS(2339): Property 'theme' does not exist on type 'Readonly<... Remove this comment to see the full error message
            background={this.props.theme?.colorPrimary}
          />
          // @ts-expect-error TS(2339): Property 'content' does not exist on
          type 'Readonl... Remove this comment to see the full error message
          {this.props.content}
          <Spacing bottom={3} />
          // @ts-expect-error TS(2339): Property 'centered' does not exist on
          type 'Readon... Remove this comment to see the full error message
          <Box fullWidth centered={this.props.centered}>
            <RawButton
              // @ts-expect-error TS(2339): Property 'dismissText' does not exist on type 'Rea... Remove this comment to see the full error message
              title={this.props.dismissText}
              // @ts-expect-error TS(2339): Property 'dismissAction' does not exist on type 'R... Remove this comment to see the full error message
              onClick={this.props.dismissAction}
            >
              <TextSpan isLink medium textLight>
                // @ts-expect-error TS(2339): Property 'dismissText' does not
                exist on type 'Rea... Remove this comment to see the full error
                message
                {this.props.dismissText}
              </TextSpan>
            </RawButton>
          </Box>
        </Box>
      </FadeIn>
    );
  }
}

// @ts-expect-error TS(2339): Property 'propTypes' does not exist on type 'typeo... Remove this comment to see the full error message
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
  centered: PropTypes.bool,
  isVisible: PropTypes.bool.isRequired,
  theme: PropTypes.object.isRequired
};

export default withTheme(Prompt);
