import { observer } from "mobx-react";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import { withTheme } from "styled-components";
import Spacing from "../../../../Styled/Spacing";
import Text from "../../../../Styled/Text";
import Box from "../../../../Styled/Box";
import styled from "styled-components";

const Numbers = styled(Text)`
  width: 22px;
  height: 22px;
  line-height: 22px;
  border-radius: 50%;
  background-color: ${props => props.theme.textDarker};
`;

const renderOrderedList = function(contents) {
  return (
    <For each="content" index="i" of={contents}>
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
    </For>
  );
};

@observer
class StyledHtml extends React.Component {
  static displayName = "StyledHtml";

  static propTypes = {
    content: PropTypes.array,
    theme: PropTypes.object,
    styledTextProps: PropTypes.object,
    t: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);
  }

  render() {
    const styledTextProps = this.props.styledTextProps || {};
    return (
      <div>
        {this.props.content?.map && (
          <For each="item" index="i" of={this.props.content}>
            <Choose>
              {/* Either a header or paragraph tag */}
              <When condition={/(h[0-6]|p)/i.test(item.type)}>
                <Text
                  key={i}
                  textDark
                  bold={/(h[0-6])/i.test(item.type)} // Only headers are bold
                  subHeading={item.type === "h1"}
                  medium={item.type === "p"}
                  {...styledTextProps}
                >
                  {item.props.children}
                  <Spacing bottom={3} />
                </Text>
              </When>
              <When condition={item.type === "ol"}>
                {renderOrderedList(
                  item.props.children.map(point => point.props.children)
                )}
              </When>
              <Otherwise>
                {/* If it's none of the above tags, just render as 
                  normal html but with the same text formatting.
                  We can style more tags as necessary */}
                <Text key={i} textDark medium {...styledTextProps}>
                  {item}
                </Text>
              </Otherwise>
            </Choose>
          </For>
        )}
      </div>
    );
  }
}

export default withTranslation()(withTheme(StyledHtml));
