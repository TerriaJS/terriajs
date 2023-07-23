import { observer } from "mobx-react";
import React from "react";
import { WithTranslationProps, withTranslation } from "react-i18next";
import Spacing from "../../../../Styled/Spacing";
import Text from "../../../../Styled/Text";
import Box from "../../../../Styled/Box";
import styled, { withTheme, DefaultTheme } from "../../../../Styled/styled";
import { i18n, TFunction } from "i18next";
import ViewState from "../../../../ReactViewModels/ViewState";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components";

import { applyTranslationIfExists } from "../../../../Language/languageHelpers";
import { parseCustomMarkdownToReactWithOptions } from "../../../Custom/parseCustomMarkdownToReact";
import {
  WithViewState,
  withViewState
} from "../../../StandardUserInterface/ViewStateContext";

const Numbers = styled(Text)<{ darkBg: boolean }>`
  width: 22px;
  height: 22px;
  line-height: 22px;
  border-radius: 50%;
  background-color: ${(props) => props.theme.textDarker};
`;

interface PropsType {
  markdown: string;
  viewState: ViewState;
  styledTextProps?: any;
  injectTooltips?: boolean;
}

const renderOrderedList = function (contents: any) {
  return contents.map((content: any, i: number) => {
    return (
      <Box key={i} paddedVertically>
        <Box alignItemsFlexStart>
          <Numbers textLight textAlignCenter darkBg>
            {i + 1}
          </Numbers>
          <Spacing right={3} />
        </Box>
        <Text medium textDark>
          {content}
        </Text>
      </Box>
    );
  });
};

function renderContentItem(props: PropsType, item: any, i: number) {
  if (!item) return item;

  if (/(h[0-6]|p)/i.test(item.type)) {
    return (
      <Text
        as={item.type}
        key={i}
        textDark
        medium={item.type === "p"}
        {...(props.styledTextProps ?? {})}
      >
        {item.props.children}
      </Text>
    );
  } else if (item.type === "ol") {
    return [
      renderOrderedList(
        item.props.children.map((point: any) => point.props.children)
      ),
      <Spacing bottom={4} />
    ];
  } else {
    /* If it's none of the above tags, just render as
        normal html but with the same text formatting.
        We can style more tags as necessary */
    return (
      <Text key={i} textDark medium {...(props.styledTextProps ?? {})}>
        {item}
      </Text>
    );
  }
}

const StyledHtml: React.FC<PropsType> = observer((props: PropsType) => {
  const { i18n } = useTranslation();
  const theme = useTheme();

  const { viewState, injectTooltips } = props;
  const styledTextProps = props.styledTextProps || {};

  const markdownToParse = applyTranslationIfExists(props.markdown, i18n);

  const parsed = parseCustomMarkdownToReactWithOptions(markdownToParse, {
    injectTermsAsTooltips: injectTooltips,
    tooltipTerms: viewState.terria.configParameters.helpContentTerms
  });
  const content = Array.isArray(parsed.props.children)
    ? parsed.props.children
    : [parsed.props.children];

  return (
    <div>
      {content?.map((item: any, i: number) =>
        renderContentItem(props, item, i)
      )}
    </div>
  );
});

StyledHtml.defaultProps = {
  injectTooltips: true
};

export default StyledHtml;
