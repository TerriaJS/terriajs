import { observer } from "mobx-react";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import { withTheme } from "styled-components";
import Box from "../Styled/Box";
import Text from "../Styled/Text";
import Spacing from "../Styled/Spacing";
import bingAerialBackground from "../../wwwroot/images/bing-aerial-labels-wide.png";
import styled from "styled-components";
import parseCustomMarkdownToReact from "./Custom/parseCustomMarkdownToReact";
import Button from "../Styled/Button";
import FadeIn from "./Transitions/FadeIn/FadeIn";

const TopElementBox = styled(Box)`
  z-index: 99999;
`;

const BackgroundImage = styled(Box)`
  background-image: linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)),
    url(${bingAerialBackground});
  background-size: cover;
  background-repeat: no-repeat;
  filter: blur(10px);
  z-index: 0;
`;

const DisclaimerButton = styled(Button).attrs({
  textProps: {
    semiBold: true,
  },
  rounded: true
})`
  width: 280px;
  border: 2px solid ${props => props.theme.grey};
  background-color: ${props =>
    props.denyButton ? "transparent" : props.theme.grey};
  color: ${props =>
    props.denyButton ? props.theme.grey : props.theme.textLight};
`;

@observer
class Disclaimer extends React.Component {
  static displayName = "Disclaimer";

  static propTypes = {
    viewState: PropTypes.object,
    theme: PropTypes.object,
    t: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);
  }

  confirm(confirmCallbackFn) {
    if (confirmCallbackFn) {
      confirmCallbackFn();
    }

    this.props.viewState.hideDisclaimer();
  }

  deny(denyCallbackFn) {
    if (denyCallbackFn) {
      denyCallbackFn();
    }
    // Otherwise, do nothing for now?
  }

  render() {
    const disclaimer = this.props.viewState.disclaimerSettings;
    console.log(this.props.theme);
    return (
      disclaimer && (
        <FadeIn isVisible={this.props.viewState.disclaimerVisible}>
          <TopElementBox positionAbsolute fullWidth fullHeight centered>
            <BackgroundImage
              // Make the image slightly larger to deal with
              // image shrinking a tad bit when blurred
              styledWidth={"105%"}
              styledHeight={"105%"}
              positionAbsolute
            />
            <Box displayInlineBlock left styledWidth={"573px"}>
              <Text
                styledFontSize={"18px"}
                styledLineHeight={"24px"}
                bold
                textLight
              >
                {disclaimer.title}
              </Text>
              <Spacing bottom={4} />
              <Text
                styledLineHeight={"18px"}
                textLight
                css={props =>
                  `
                // not sure of the ideal way to deal with this
                a {
                  font-weight: bold;
                  color: ${props.theme.colorPrimary};
                  text-decoration: none;
                }
              `
                }
              >
                {parseCustomMarkdownToReact(disclaimer.message)}
              </Text>
              <Spacing bottom={5} />
              <Box fullWidth centered>
                <DisclaimerButton
                  denyButton
                  onClick={() => this.deny(disclaimer.denyAction)}
                >
                  {disclaimer.denyText}
                </DisclaimerButton>
                <Spacing right={3} />
                <DisclaimerButton
                  onClick={() => this.confirm(disclaimer.confirmAction)}
                >
                  {disclaimer.confirmText}
                </DisclaimerButton>
              </Box>
            </Box>
          </TopElementBox>
        </FadeIn>
      )
    );
  }
}

export default withTranslation()(withTheme(Disclaimer));
