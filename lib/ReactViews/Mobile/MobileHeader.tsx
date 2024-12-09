import classNames from "classnames";
import { runInAction } from "mobx";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import styled, { withTheme } from "styled-components";
import { applyTranslationIfExists } from "../../Language/languageHelpers";
import { removeMarker } from "../../Models/LocationMarkerUtils";
import Box from "../../Styled/Box";
import { RawButton } from "../../Styled/Button";
import Icon, { StyledIcon } from "../../Styled/Icon";
import SearchBox from "../Search/SearchBox";
import Branding from "../SidePanel/Branding";
import { withViewState } from "../Context";
import Styles from "./mobile-header.scss";
import MobileMenu from "./MobileMenu";
import MobileModalWindow from "./MobileModalWindow";

@observer
class MobileHeader extends React.Component {
  static displayName = "MobileHeader";

  showSearch() {
    // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
    const viewState = this.props.viewState;
    const mobileView = viewState.mobileView;
    const mobileViewOptions = viewState.mobileViewOptions;
    const searchState = viewState.searchState;
    runInAction(() => {
      if (
        mobileView === mobileViewOptions.data ||
        mobileView === mobileViewOptions.preview
      ) {
        searchState.showMobileCatalogSearch = true;
      } else {
        searchState.showMobileLocationSearch = true;
        this.showLocationSearchResults();
      }
    });
  }

  closeLocationSearch() {
    runInAction(() => {
      // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
      this.props.viewState.searchState.showMobileLocationSearch = false;
      // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
      this.props.viewState.explorerPanelIsVisible = false;
      // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
      this.props.viewState.switchMobileView(null);
    });
  }

  closeCatalogSearch() {
    runInAction(() => {
      // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
      this.props.viewState.searchState.showMobileCatalogSearch = false;
      // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
      this.props.viewState.searchState.catalogSearchText = "";
    });
  }

  onMobileDataCatalogClicked() {
    // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
    this.props.viewState.setTopElement("DataCatalog");
    // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
    this.toggleView(this.props.viewState.mobileViewOptions.data);
  }

  onMobileNowViewingClicked() {
    // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
    this.props.viewState.setTopElement("NowViewing");
    // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
    this.toggleView(this.props.viewState.mobileViewOptions.nowViewing);
  }

  changeLocationSearchText(newText: any) {
    runInAction(() => {
      // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
      this.props.viewState.searchState.locationSearchText = newText;
    });

    if (newText.length === 0) {
      // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
      removeMarker(this.props.viewState.terria);
    }

    this.showLocationSearchResults();
  }

  showLocationSearchResults() {
    runInAction(() => {
      // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
      const text = this.props.viewState.searchState.locationSearchText;
      if (text && text.length > 0) {
        // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
        this.props.viewState.explorerPanelIsVisible = true;
        // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
        this.props.viewState.mobileView =
          // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
          this.props.viewState.mobileViewOptions.locationSearchResults;
      } else {
        // TODO: return to the preview mobileView, rather than dropping back to the map
        // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
        this.props.viewState.explorerPanelIsVisible = false;
        // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
        this.props.viewState.mobileView = null;
      }
    });
  }

  changeCatalogSearchText(newText: any) {
    runInAction(() => {
      // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
      this.props.viewState.searchState.catalogSearchText = newText;
    });
  }

  searchLocations() {
    // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
    this.props.viewState.searchState.searchLocations();
  }

  searchCatalog() {
    // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
    this.props.viewState.searchState.searchCatalog();
  }

  toggleView(viewname: any) {
    runInAction(() => {
      // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
      if (this.props.viewState.mobileView !== viewname) {
        // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
        this.props.viewState.explorerPanelIsVisible = true;
        // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
        this.props.viewState.switchMobileView(viewname);
      } else {
        // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
        this.props.viewState.explorerPanelIsVisible = false;
        // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
        this.props.viewState.switchMobileView(null);
      }
    });
  }

  onClickFeedback(e: any) {
    e.preventDefault();
    runInAction(() => {
      // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
      this.props.viewState.feedbackFormIsVisible = true;
    });
    this.setState({
      menuIsOpen: false
    });
  }

  renderSearch() {
    // @ts-expect-error TS(2339): Property 't' does not exist on type 'Readonly<{}> ... Remove this comment to see the full error message
    const { t, viewState } = this.props;
    const searchState = viewState.searchState;
    return (
      <div className={Styles.formSearchData}>
        {searchState.showMobileLocationSearch && (
          <SearchBox
            searchText={searchState.locationSearchText}
            onSearchTextChanged={this.changeLocationSearchText.bind(this)}
            onDoSearch={this.searchLocations.bind(this)}
            placeholder={applyTranslationIfExists(
              viewState.terria.searchBarModel.placeholder,
              // @ts-expect-error TS(2339): Property 'i18n' does not exist on type 'Readonly<{... Remove this comment to see the full error message
              this.props.i18n
            )}
            alwaysShowClear
            onClear={this.closeLocationSearch.bind(this)}
            autoFocus
          />
        )}
        {searchState.showMobileCatalogSearch && (
          <SearchBox
            searchText={searchState.catalogSearchText}
            onSearchTextChanged={this.changeCatalogSearchText.bind(this)}
            onDoSearch={this.searchCatalog.bind(this)}
            placeholder={t("search.searchCatalogue")}
            onClear={this.closeCatalogSearch.bind(this)}
            autoFocus
          />
        )}
      </div>
    );
  }

  render() {
    // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
    const searchState = this.props.viewState.searchState;
    // @ts-expect-error TS(2339): Property 't' does not exist on type 'Readonly<{}> ... Remove this comment to see the full error message
    const { t } = this.props;
    const nowViewingLength =
      // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
      this.props.viewState.terria.workbench.items !== undefined
        ? // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
          this.props.viewState.terria.workbench.items.length
        : 0;

    return (
      <div className={Styles.ui}>
        <Box
          justifySpaceBetween
          fullWidth
          fullHeight
          paddedRatio={1}
          // @ts-expect-error TS(2339): Property 'theme' does not exist on type 'Readonly<... Remove this comment to see the full error message
          backgroundColor={this.props.theme.dark}
        >
          {!searchState.showMobileLocationSearch &&
          !searchState.showMobileCatalogSearch ? (
            <>
              <Box
                position="absolute"
                css={`
                  left: 5px;
                `}
              >
                <HamburgerButton
                  type="button"
                  // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
                  onClick={this.props.viewState.toggleMobileMenu.bind(
                    // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
                    this.props.viewState
                  )}
                  title={t("mobile.toggleNavigation")}
                >
                  <StyledIcon
                    light
                    glyph={Icon.GLYPHS.menu}
                    styledWidth="20px"
                    styledHeight="20px"
                  />
                </HamburgerButton>
                <Branding
                  // @ts-expect-error TS(2322): Type '{ terria: any; viewState: any; version: any;... Remove this comment to see the full error message
                  terria={this.props.viewState.terria}
                  // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
                  viewState={this.props.viewState}
                  // @ts-expect-error TS(2339): Property 'version' does not exist on type 'Readonl... Remove this comment to see the full error message
                  version={this.props.version}
                />
              </Box>
              <div
                className={Styles.groupRight}
                css={`
                  background-color: ${(p: any) => p.theme.dark};
                `}
              >
                <button
                  type="button"
                  className={Styles.btnAdd}
                  onClick={this.onMobileDataCatalogClicked.bind(this)}
                >
                  {t("mobile.addDataBtnText")}
                  <StyledIcon
                    glyph={Icon.GLYPHS.increase}
                    styledWidth="20px"
                    styledHeight="20px"
                  />
                </button>
                {nowViewingLength > 0 && (
                  <button
                    type="button"
                    className={Styles.btnNowViewing}
                    onClick={this.onMobileNowViewingClicked.bind(this)}
                  >
                    <Icon glyph={Icon.GLYPHS.eye} />
                    <span
                      className={classNames(Styles.nowViewingCount, {
                        [Styles.doubleDigit]: nowViewingLength > 9
                      })}
                    >
                      {nowViewingLength}
                    </span>
                  </button>
                )}
                <button
                  className={Styles.btnSearch}
                  type="button"
                  onClick={this.showSearch.bind(this)}
                >
                  <StyledIcon
                    glyph={Icon.GLYPHS.search}
                    styledWidth="20px"
                    styledHeight="20px"
                  />
                </button>
              </div>
            </>
          ) : (
            this.renderSearch()
          )}
        </Box>
        <MobileMenu
          // @ts-expect-error TS(2339): Property 'menuItems' does not exist on type 'Reado... Remove this comment to see the full error message
          menuItems={this.props.menuItems}
          // @ts-expect-error TS(2339): Property 'menuLeftItems' does not exist on type 'R... Remove this comment to see the full error message
          menuLeftItems={this.props.menuLeftItems}
          // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
          viewState={this.props.viewState}
          // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
          terria={this.props.viewState.terria}
          showFeedback={
            // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
            !!this.props.viewState.terria.configParameters.feedbackUrl
          }
        />
        {/* Don't show mobile modal window if user is currently interacting
              with map - like picking a point or drawing shapes
           */}
        // @ts-expect-error TS(2339): Property 'viewState' does not exist on
        type 'Reado... Remove this comment to see the full error message
        {!this.props.viewState.isMapInteractionActive && (
          <MobileModalWindow
            // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
            terria={this.props.viewState.terria}
            // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
            viewState={this.props.viewState}
          />
        )}
      </div>
    );
  }
}

const HamburgerButton = styled(RawButton)`
  border-radius: 4px;
  padding: 0 5px;
  margin-right: 3px;
  background: ${(p) => p.theme.darkLighter};
  width: 50px;
  height: 38px;
  box-sizing: content-box;
  display: flex;
  justify-content: center;
  align-items: center;
  &:hover,
  &:focus,
  & {
    border: 1px solid ${(p) => p.theme.textLightTranslucent};
  }
`;

// @ts-expect-error TS(2339): Property 'propTypes' does not exist on type 'typeo... Remove this comment to see the full error message
MobileHeader.propTypes = {
  viewState: PropTypes.object.isRequired,
  version: PropTypes.string,
  menuLeftItems: PropTypes.array,
  menuItems: PropTypes.array,
  theme: PropTypes.object,
  t: PropTypes.func.isRequired,
  i18n: PropTypes.object
};

// @ts-expect-error TS(2345): Argument of type 'FC<Omit<WithViewState, "viewStat... Remove this comment to see the full error message
export default withTranslation()(withTheme(withViewState(MobileHeader)));
