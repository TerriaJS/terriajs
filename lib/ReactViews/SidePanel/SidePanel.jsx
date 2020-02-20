import createReactClass from "create-react-class";
import { reaction, runInAction } from "mobx";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation, Trans } from "react-i18next";
import { removeMarker } from "../../Models/LocationMarkerUtils";
import Icon from "../Icon";
import SearchBox from "../Search/SearchBox";
import SidebarSearch from "../Search/SidebarSearch";
import Workbench from "../Workbench/Workbench";
import FullScreenButton from "./FullScreenButton";
import Styles from "./side-panel.scss";

import Box from "../../Styled/Box";
import Spacing from "../../Styled/Spacing";
import Text, { TextSpan } from "../../Styled/Text";

const SidePanel = observer(
  createReactClass({
    displayName: "SidePanel",

    propTypes: {
      terria: PropTypes.object.isRequired,
      viewState: PropTypes.object.isRequired,
      t: PropTypes.func.isRequired
    },

    componentDidMount() {
      this.subscribeToProps();
    },

    componentDidUpdate() {
      this.subscribeToProps();
    },

    componentWillUnmount() {
      this.unsubscribeFromProps();
    },

    subscribeToProps() {
      this.unsubscribeFromProps();

      // Close the search results when the Now Viewing changes (so that it's visible).
      this._nowViewingChangeSubscription = reaction(
        () => this.props.terria.workbench.items,
        () => {
          this.props.viewState.searchState.showLocationSearchResults = false;
        }
      );
    },

    unsubscribeFromProps() {
      if (this._nowViewingChangeSubscription) {
        this._nowViewingChangeSubscription();
        this._nowViewingChangeSubscription = undefined;
      }
    },

    onAddDataClicked(event) {
      event.stopPropagation();
      runInAction(() => {
        this.props.viewState.topElement = "AddData";
      });
      this.props.viewState.openAddData();
    },

    onAddLocalDataClicked() {
      this.props.viewState.openUserData();
    },

    changeSearchText(newText) {
      runInAction(() => {
        this.props.viewState.searchState.locationSearchText = newText;
      });

      if (newText.length === 0) {
        removeMarker(this.props.terria);
      }
    },

    search() {
      this.props.viewState.searchState.searchLocations();
    },

    startLocationSearch() {
      runInAction(() => {
        this.props.viewState.searchState.showLocationSearchResults = true;
      });
    },

    render() {
      const { t } = this.props;
      const searchState = this.props.viewState.searchState;
      const addData = t("addData.addDataBtnText");
      const uploadText = t("models.catalog.upload");
      return (
        <div className={Styles.workBench}>
          <div className={Styles.header}>
            <FullScreenButton
              terria={this.props.terria}
              viewState={this.props.viewState}
              minified={true}
              animationDuration={250}
              btnText={t("addData.btnHide")}
            />
            <SearchBox
              onSearchTextChanged={this.changeSearchText}
              onDoSearch={this.search}
              onFocus={this.startLocationSearch}
              searchText={searchState.locationSearchText}
              placeholder={t("search.placeholder")}
            />
            <div className={Styles.addData}>
              <button
                type="button"
                onClick={this.onAddDataClicked}
                className={Styles.button}
                title={addData}
              >
                <Icon glyph={Icon.GLYPHS.add} />
                <TextSpan large nunito>
                  {addData}
                </TextSpan>
              </button>
              <button
                type="button"
                onClick={this.onAddLocalDataClicked}
                className={Styles.uploadData}
                title={t("addData.load")}
              >
                <Icon glyph={Icon.GLYPHS.upload} />
                <TextSpan large nunito>
                  {uploadText}
                </TextSpan>
              </button>
            </div>
          </div>
          <div className={Styles.body}>
            <Choose>
              <When
                condition={
                  searchState.locationSearchText.length > 0 &&
                  searchState.showLocationSearchResults
                }
              >
                <SidebarSearch
                  terria={this.props.terria}
                  viewState={this.props.viewState}
                  isWaitingForSearchToStart={
                    searchState.isWaitingToStartLocationSearch
                  }
                />
              </When>
              <When
                condition={
                  this.props.terria.workbench.items &&
                  this.props.terria.workbench.items.length > 0
                }
              >
                <Workbench
                  viewState={this.props.viewState}
                  terria={this.props.terria}
                />
              </When>
              <Otherwise>
                <Text large textLight nunito>
                  <Box
                    centered
                    css={`
                      min-height: 240px;
                    `}
                  >
                    <Text large css={"color: #88A3C1"}>
                      {t("emptyWorkbench.emptyArea")}
                    </Text>
                  </Box>
                  <Box column paddedRatio={3}>
                    <Box
                      left
                      css={`
                        svg {
                          fill: ${p => p.theme.textLight};
                          width: 13px;
                          height: 13px;
                          padding-right: 5px;
                        }
                      `}
                    >
                      <Icon glyph={Icon.GLYPHS.bulb} />
                      <Text large>{t("emptyWorkbench.helpfulHints")}</Text>
                    </Box>
                    <Spacing bottom={2} />
                    <Text large>{t("emptyWorkbench.helpfulHintsOne")}</Text>
                    <Spacing bottom={1} />
                    <Trans i18nKey="emptyWorkbench.helpfulHintsTwo">
                      <Text large>
                        Click
                        <TextSpan large bold>
                          Explore map data
                        </TextSpan>
                        above to browse the Data Catalogue or click
                        <TextSpan large bold>
                          Upload
                        </TextSpan>
                        to load your own data onto the map.
                      </Text>
                    </Trans>
                  </Box>
                </Text>
                {/* <Trans i18nKey="emptyWorkbenchMessage">
                  <div className={Styles.workbenchEmpty}>
                    <div>Your workbench is empty</div>
                    <p>
                      <strong>Click &apos;{addData}&apos; above to:</strong>
                    </p>
                    <ul>
                      <li>Browse the Data Catalogue</li>
                      <li>Load your own data onto the map</li>
                    </ul>
                    <p>
                      <strong>TIP:</strong>
                      <em>All your active data sets will be listed here</em>
                    </p>
                  </div>
                </Trans> */}
              </Otherwise>
            </Choose>
          </div>
        </div>
      );
    }
  })
);

module.exports = withTranslation()(SidePanel);
