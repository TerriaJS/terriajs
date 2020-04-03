import { observer } from "mobx-react";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import { withTheme } from "styled-components";
import Box from "../../Styled/Box";
import { getParentGroups } from "../../Core/getPath";
import Text from "../../Styled/Text";
import Icon, { StyledIcon } from "../Icon";
import Spacing from "../../Styled/Spacing";
import { RawButton } from "../../Styled/Button";
import styled from "styled-components";
import getAncestors from "../../Models/getAncestors";
import getDereferencedIfExists from "../../Core/getDereferencedIfExists";
import { runInAction } from "mobx";
import CommonStrata from "../../Models/CommonStrata";

const RawButtonAndUnderline = styled(RawButton)`
  ${props => `
  &:hover, &:focus {
    text-decoration: underline ${props.theme.textDark};
  }`}
`;

@observer
class Breadcrumbs extends React.Component {
  static propTypes = {
    terria: PropTypes.object,
    viewState: PropTypes.object,
    previewed: PropTypes.object,
    theme: PropTypes.object,
    t: PropTypes.func.isRequired
  }

  openInCatalog(items) {
    items.forEach(item => {
      runInAction(() => {
        item.setTrait(CommonStrata.user, "isOpen", true);
      });
    });
    this.props.viewState.changeSearchState("");
    this.props.viewState.showBreadcrumbs(false);
  }

  render() {
    console.log(this.props.theme);
    const parentGroups = this.props.previewed ? getParentGroups(this.props.previewed) : undefined;
    const ancestors = getAncestors(this.props.previewed).map(ancestor => getDereferencedIfExists(ancestor));
    return (
      // Note: should it reset the text if a person deletes current search and starts a new search?
      <Box
        left
        styledHeight={"32px"}
        bgColor={this.props.theme.greyLighter}
        paddedHorizontally={2.4}
        paddedVertically={1}
      >
        <StyledIcon
          styledWidth={"16px"}
          fillColor={this.props.theme.textDark}
          glyph={Icon.GLYPHS.globe}
        />
        <Spacing right={1.2} />
        {parentGroups && (
          <For each="parent" index="i" of={parentGroups}>
            {/* The first and last two groups use the full name */}
            <If condition={i <= 1 || i >= parentGroups.length - 2}>
              <RawButtonAndUnderline
                type="button"
                onClick={() => this.openInCatalog(ancestors.slice(0, i+1))}
              >
                <Text small textDark>
                  {parent}
                </Text>
              </RawButtonAndUnderline>
            </If>
            {/* The remainder are just '..' to prevent/minimise overflowing */}
            <If condition={i > 1 && i < parentGroups.length - 2}>
              <Text small textDark>
                {"..."}
              </Text>
            </If>

            <If condition={i !== parentGroups.length - 1}>
              <Box paddedHorizontally={1}>
                <Text small textDark>
                  {">"}
                </Text>
              </Box>
            </If>
          </For>
        )}
      </Box>
    )
  }
}

export default withTranslation()(withTheme(Breadcrumbs));