import { observer } from "mobx-react";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import { withTheme } from "styled-components";
import Box from "../../Styled/Box";
import { getParentGroups } from "../../Core/getPath";
import Text, { TextSpan } from "../../Styled/Text";
import Icon, { StyledIcon } from "../../Styled/Icon";
import Spacing from "../../Styled/Spacing";
import { RawButton } from "../../Styled/Button";
import styled from "styled-components";
import getAncestors from "../../Models/getAncestors";
import getDereferencedIfExists from "../../Core/getDereferencedIfExists";
import { runInAction } from "mobx";
import CommonStrata from "../../Models/Definition/CommonStrata";

const RawButtonAndUnderline = styled(RawButton)`
  ${(props) => `
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
  };

  async openInCatalog(items: any) {
    items.forEach((item: any) => {
      runInAction(() => {
        item.setTrait(CommonStrata.user, "isOpen", true);
      });
    });
    // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
    (await this.props.viewState.viewCatalogMember(items[0])).raiseError(
      // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
      this.props.viewState.terria
    );
    // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
    this.props.viewState.changeSearchState("");
  }

  renderCrumb(parent: any, i: any, parentGroups: any) {
    // @ts-expect-error TS(2339): Property 'previewed' does not exist on type 'Reado... Remove this comment to see the full error message
    const ancestors = getAncestors(this.props.previewed).map((ancestor) =>
      getDereferencedIfExists(ancestor)
    );

    /* No link when it's the current member */
    if (i === parentGroups.length - 1) {
      return (
        <Text small textDark>
          {parent}
        </Text>
      );
      /* The first and last two groups use the full name */
    } else if (i <= 1 || i >= parentGroups.length - 2) {
      return (
        <RawButtonAndUnderline
          type="button"
          onClick={() => this.openInCatalog(ancestors.slice(i, i + 1))}
        >
          <TextSpan small textDark>
            {parent}
          </TextSpan>
        </RawButtonAndUnderline>
      );
      /* The remainder are just '..' to prevent/minimise overflowing */
    } else if (i > 1 && i < parentGroups.length - 2) {
      return (
        <Text small textDark>
          {"..."}
        </Text>
      );
    }

    return null;
  }

  render() {
    // @ts-expect-error TS(2339): Property 'previewed' does not exist on type 'Reado... Remove this comment to see the full error message
    const parentGroups = this.props.previewed
      ? // @ts-expect-error TS(2339): Property 'previewed' does not exist on type 'Reado... Remove this comment to see the full error message
        getParentGroups(this.props.previewed)
      : undefined;

    return (
      // Note: should it reset the text if a person deletes current search and starts a new search?
      <Box
        left
        styledMinHeight={"32px"}
        fullWidth
        // @ts-expect-error TS(2339): Property 'theme' does not exist on type 'Readonly<... Remove this comment to see the full error message
        backgroundColor={this.props.theme.greyLighter}
        paddedHorizontally={2.4}
        paddedVertically={1}
        wordBreak="break-all"
      >
        <StyledIcon
          styledWidth={"16px"}
          // @ts-expect-error TS(2339): Property 'theme' does not exist on type 'Readonly<... Remove this comment to see the full error message
          fillColor={this.props.theme.textDark}
          glyph={Icon.GLYPHS.globe}
        />
        <Spacing right={1.2} />
        <Box flexWrap>
          {parentGroups &&
            parentGroups.map((parent, i) => (
              <React.Fragment key={i}>
                {this.renderCrumb(parent, i, parentGroups)}
                {i !== parentGroups.length - 1 && (
                  <Box paddedHorizontally={1}>
                    <Text small textDark>
                      {">"}
                    </Text>
                  </Box>
                )}
              </React.Fragment>
            ))}
        </Box>
      </Box>
    );
  }
}

export default withTranslation()(withTheme(Breadcrumbs));
