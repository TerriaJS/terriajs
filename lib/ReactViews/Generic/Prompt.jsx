import React from "react";
import PropTypes from "prop-types";
import Styles from "./prompt.scss";
import classNames from "classnames";
import FadeIn from "../Transitions/FadeIn/FadeIn";
import Box, { BoxSpan } from "../../Styled/Box";
import Spacing from "../../Styled/Spacing";
import { TextSpan } from "../../Styled/Text";
import { RawButton } from "../../Styled/Button";
import { withTheme } from "styled-components";
import Caret from "../Generic/Caret";

class Prompt extends React.PureComponent {
  render() {
    return (
      <FadeIn isVisible={this.props.isVisible}>
        <Box
          column
          rounded
          positionAbsolute
          backgroundColor={this.props.theme.colorPrimary}
          paddedRatio={3}
          styledWidth={"273px"}
          css={`
            bottom: 30px;
            right: px;
          `}
        >
          <Caret
            style={{
              top: `75px`,
              left: `265px`
            }}
            size={15}
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
  isVisible: PropTypes.bool.isRequired,
  theme: PropTypes.object
};

export default withTheme(Prompt);
