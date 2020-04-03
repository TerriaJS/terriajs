import { computed, runInAction } from "mobx";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import { withTheme } from "styled-components";
import DataCatalog from "../../DataCatalog/DataCatalog";
import DataPreview from "../../Preview/DataPreview";
import SearchBox, { DEBOUNCE_INTERVAL } from "../../Search/SearchBox.jsx";
import Styles from "./data-catalog-tab.scss";
import Box from "../../../Styled/Box";
import { getParentGroups } from "../../../Core/getPath";
import Text from "../../../Styled/Text";
import Icon, { StyledIcon } from "../../Icon";
import Spacing from "../../../Styled/Spacing";
import { RawButton } from "../../../Styled/Button";
import styled from "styled-components";

// The DataCatalog Tab
@observer
class DataCatalogTab extends React.Component {
  static propTypes = {
    terria: PropTypes.object,
    viewState: PropTypes.object,
    items: PropTypes.array,
    searchPlaceholder: PropTypes.string,
    overrideState: PropTypes.string,
    onActionButtonClicked: PropTypes.func,
    theme: PropTypes.object,
    t: PropTypes.func.isRequired
  };

  @computed
  get searchPlaceholder() {
    const { t } = this.props;
    return this.props.searchPlaceholder || t("addData.searchPlaceholder");
  }

  changeSearchText(newText) {
    runInAction(() => {
      this.props.viewState.searchState.catalogSearchText = newText;
    });
  }

  search() {
    this.props.viewState.searchState.searchCatalog();
  }

  render() {
    console.log(this.props.theme);
    const terria = this.props.terria;
    const searchState = this.props.viewState.searchState;
    const previewed = this.props.viewState.previewedItem;
    const showBreadcrumb =
      searchState.catalogSearchText.length > 0 && previewed;
    const parentGroups = previewed ? getParentGroups(previewed) : undefined;
    return (
      <div className={Styles.root}>
        <div
          className={Styles.dataExplorer}
          css={`
            height: ${showBreadcrumb ? `calc(100% - 32px)` : `100%`};
          `}
        >
          {/* ~TODO: Put this back once we add a MobX DataCatalogSearch Provider~ */}
          {/* TODO2: Implement a more generic MobX DataCatalogSearch */}
          {searchState.catalogSearchProvider && (
            <SearchBox
              searchText={searchState.catalogSearchText}
              onSearchTextChanged={val => this.changeSearchText(val)}
              onDoSearch={() => this.search()}
              placeholder={this.searchPlaceholder}
              debounceDuration={
                terria.catalogReferencesLoaded &&
                searchState.catalogSearchProvider
                  ? searchState.catalogSearchProvider.debounceDurationOnceLoaded
                  : DEBOUNCE_INTERVAL
              }
            />
          )}
          <DataCatalog
            terria={this.props.terria}
            viewState={this.props.viewState}
            overrideState={this.props.overrideState}
            onActionButtonClicked={this.props.onActionButtonClicked}
            items={this.props.items}
          />
        </div>
        <DataPreview
          terria={terria}
          viewState={this.props.viewState}
          previewed={this.props.viewState.previewedItem}
        />
        {showBreadcrumb && (
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
                  <RawButtonAndUnderline>
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
        )}
      </div>
    );
  }
}

const RawButtonAndUnderline = styled(RawButton)`
  ${props => `
  &:hover, &:focus {
    text-decoration: underline ${props.theme.textDark};
  }`}
`;

module.exports = withTranslation()(withTheme(DataCatalogTab));
