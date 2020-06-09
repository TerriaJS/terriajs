import { observer } from "mobx-react";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import { withTheme } from "styled-components";
import styled from "styled-components";

import StyledHtml from "./StyledHtml";

import parseCustomMarkdownToReact from "../../../Custom/parseCustomMarkdownToReact";

import Box, { BoxSpan } from "../../../../Styled/Box";
import { RawButton } from "../../../../Styled/Button";
// import Spacing from "../../../../Styled/Spacing";
import Text from "../../../../Styled/Text";

const UlTrainerItems = styled(Box).attrs({
  as: "ul"
})`
  ${p => p.theme.removeListStyles()}
`;

const TrainerButton = styled(RawButton)`
  ${p => p.theme.addBasicHoverStyles()}
  background: ${p => p.theme.greyLighter};
  color: ${p => p.theme.dark};
  border-radius: ${p => p.theme.radiusLarge};
`;

@observer
class TrainerPane extends React.Component {
  static displayName = "TrainerPane";

  static propTypes = {
    viewState: PropTypes.object.isRequired,
    content: PropTypes.object.isRequired,
    t: PropTypes.func
  };

  constructor(props) {
    super(props);
  }

  render() {
    const { content } = this.props;
    const { trainerItems, markdownText } = content;
    return (
      <Text textDark noFontSize>
        <Box column>
          {markdownText && (
            <StyledHtml
              content={parseCustomMarkdownToReact(markdownText).props.children}
            />
          )}
          {trainerItems?.map && (
            <UlTrainerItems fullWidth wrap justifySpaceBetween>
              {trainerItems.map((item, index) => (
                <li
                  css={`
                    width: calc(50% - 5px);
                    margin-bottom: 10px;
                  `}
                  key={index}
                >
                  <TrainerButton
                    fullWidth
                    onClick={() => console.log("clicked")}
                  >
                    <BoxSpan centered>
                      <BoxSpan
                        centered
                        styledMinHeight={"110px"}
                        styledWidth={"70%"}
                      >
                        {item.title}
                      </BoxSpan>
                    </BoxSpan>
                  </TrainerButton>
                </li>
              ))}
            </UlTrainerItems>
          )}
        </Box>
      </Text>
    );
  }
}

export default withTranslation()(withTheme(TrainerPane));
