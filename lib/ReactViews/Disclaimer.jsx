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

const TopElementBox = styled(Box)`
  z-index: 99999;
`;

const BackgroundImage = styled(Box)`
  background-image: linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)),
    url(${bingAerialBackground});
  background-size: cover;
  background-repeat: no-repeat;
  filter: blur(10px);
`;

const DisclaimerButton = styled(Button).attrs({
  // Seems to be more like designs with bold
  // textProps: {
  //   semiBold: true,
  // },
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

  // confirm() {
  //   const notification = this.props.viewState.notifications[0];
  //   if (notification && notification.confirmAction) {
  //     notification.confirmAction();
  //   }

  //   this.close(notification);
  // }

  // deny() {
  //   const notification = this.props.viewState.notifications[0];
  //   if (notification && notification.denyAction) {
  //     notification.denyAction();
  //   }

  //   this.close(notification);
  // }

  // close(notification) {
  //   runInAction(() => {
  //     this.props.viewState.disclaimerSettings = undefined;
  //   });

  //   // Force refresh once the notification is dispached if .hideUi is set since once all the .hideUi's
  //   // have been dispatched the UI will no longer be suppressed causing a change in the view state.
  //   if (notification && notification.hideUi) {
  //     triggerResize();
  //   }
  // }

  render() {
    const disclaimer = this.props.viewState.disclaimerSettings;
    console.log(this.props.theme);
    return (
      disclaimer && (
        <TopElementBox positionAbsolute fullWidth fullHeight centered>
          <BackgroundImage
            styledWidth={"110%"}
            styledHeight={"110%"}
            positionAbsolute
          />
          <TopElementBox displayInlineBlock left styledWidth={"573px"}>
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
              <DisclaimerButton denyButton>
                {disclaimer.denyText}
              </DisclaimerButton>
              <Spacing right={3} />
              <DisclaimerButton>{disclaimer.confirmText}</DisclaimerButton>
            </Box>
          </TopElementBox>
          {/* <NotificationWindow
          title={disclaimer.title}
          message={disclaimer.message}
          confirmText={disclaimer.confirmText}
          denyText={disclaimer.denyText}
          onConfirm={this.confirm}
          onDeny={this.deny}
          type={
            defined(disclaimer.type) ? disclaimer.type : "disclaimer"
          }
          width={disclaimer.width}
          height={disclaimer.height}
        /> */}
        </TopElementBox>
      )
    );
  }
}

export default withTranslation()(withTheme(Disclaimer));
