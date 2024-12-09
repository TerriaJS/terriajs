import { observer } from "mobx-react";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import { withTheme } from "styled-components";
import Spacing from "../../../../Styled/Spacing";
import Text from "../../../../Styled/Text";
import Box from "../../../../Styled/Box";
import styled from "styled-components";

import { applyTranslationIfExists } from "../../../../Language/languageHelpers";
import { parseCustomMarkdownToReactWithOptions } from "../../../Custom/parseCustomMarkdownToReact";

const Numbers = styled(Text)`
  width: 22px;
  height: 22px;
  line-height: 22px;
  border-radius: 50%;
  background-color: ${(props) => props.theme.textDarker};
`;

const renderOrderedList = function (contents: any) {
  return contents.map((content: any, i: any) => (
    <Box key={i} paddedVertically>
      <Box alignItemsFlexStart>
        // @ts-expect-error TS(2769): No overload matches this call.
        <Numbers textLight textAlignCenter darkBg>
          {i + 1}
        </Numbers>
        <Spacing right={3} />
      </Box>
      <Text medium textDark>
        {content}
      </Text>
    </Box>
  ));
};

export class StyledHtmlRaw extends React.Component {
  static displayName = "StyledHtml";

  static propTypes = {
    markdown: PropTypes.string.isRequired,
    viewState: PropTypes.object.isRequired,
    theme: PropTypes.object,
    styledTextProps: PropTypes.object,
    injectTooltips: PropTypes.bool,
    t: PropTypes.func.isRequired,
    i18n: PropTypes.object.isRequired
  };
  static defaultProps = {
    injectTooltips: true
  };

  render() {
    // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
    const { viewState, injectTooltips, i18n } = this.props;
    // @ts-expect-error TS(2339): Property 'styledTextProps' does not exist on type ... Remove this comment to see the full error message
    const styledTextProps = this.props.styledTextProps || {};

    // @ts-expect-error TS(2339): Property 'markdown' does not exist on type 'Readon... Remove this comment to see the full error message
    const markdownToParse = applyTranslationIfExists(this.props.markdown, i18n);

    const parsed = parseCustomMarkdownToReactWithOptions(markdownToParse, {
      injectTermsAsTooltips: injectTooltips,
      tooltipTerms: viewState.terria.configParameters.helpContentTerms
    });
    const content = Array.isArray(parsed.props.children)
      ? parsed.props.children
      : [parsed.props.children];

    return (
      <div>
        {content?.map &&
          content.map((item: any, i: any) => {
            if (!item) return null;

            /* Either a header or paragraph tag */
            if (/(h[0-6]|p)/i.test(item.type)) {
              return (
                <Text
                  as={item.type}
                  key={i}
                  textDark
                  medium={item.type === "p"}
                  {...styledTextProps}
                >
                  {item.props.children}
                </Text>
              );
            } else if (item.type === "ol") {
              return (
                <>
                  {renderOrderedList(
                    item.props.children.map(
                      (point: any) => point.props.children
                    )
                  )}
                  <Spacing bottom={4} />
                </>
              );
              /* If it's none of the above tags, just render as
                  normal html but with the same text formatting.
                  We can style more tags as necessary */
            } else {
              return (
                <Text key={i} textDark medium {...styledTextProps}>
                  {item}
                </Text>
              );
            }
          })}
      </div>
    );
  }
}

export default withTranslation()(withTheme(observer(StyledHtmlRaw)));
