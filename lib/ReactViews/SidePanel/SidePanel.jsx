import createReactClass from "create-react-class";
import { reaction, runInAction } from "mobx";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import React from "react";
import { removeMarker } from "../../Models/LocationMarkerUtils";
import Icon from "../Icon";
import SearchBox from "../Search/SearchBox";
import SidebarSearch from "../Search/SidebarSearch";
import Workbench from "../Workbench/Workbench";
import FullScreenButton from "./FullScreenButton";
import Styles from "./side-panel.scss";

import { useStore } from "terrace/ViewModels/StoreContext";
import styled from "styled-components";
const Button = styled.button`
  ${props =>
    props.editorState.theme &&
    `background-color: ${props.editorState.theme.primary};`}
  ${props =>
    props.editorState.theme && `color: ${props.editorState.theme.text};`}
`;

const SidePanel = observer(
  createReactClass({
    displayName: "SidePanel",

    propTypes: {
      terria: PropTypes.object.isRequired,
      viewState: PropTypes.object.isRequired
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
      const searchState = this.props.viewState.searchState;

      const TestButton = () => {
        const store = useStore();
        return (
          <Button
            type="button"
            onClick={this.onAddDataClicked}
            className={Styles.button}
            title="Add data"
            editorState={store.editorState}
          >
            <Icon glyph={Icon.GLYPHS.add} />
            Add data
          </Button>
        );
      };
      const TestUploadButton = () => {
        const store = useStore();
        return (
          <Button
            type="button"
            onClick={this.onAddLocalDataClicked}
            className={Styles.uploadData}
            title="Load local/web data"
            editorState={store.editorState}
          >
            <Icon glyph={Icon.GLYPHS.upload} />
          </Button>
        );
      };

      return (
        <div className={Styles.workBench}>
          <div className={Styles.header}>
            <FullScreenButton
              terria={this.props.terria}
              viewState={this.props.viewState}
              minified={true}
              animationDuration={250}
              btnText="Hide"
            />
            <SearchBox
              onSearchTextChanged={this.changeSearchText}
              onDoSearch={this.search}
              onFocus={this.startLocationSearch}
              searchText={searchState.locationSearchText}
              placeholder="Search for locations"
            />
            <div className={Styles.addData}>
              <TestButton />
              <TestUploadButton />
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
                <div className={Styles.workbenchEmpty}>
                  <div>Your workbench is empty</div>
                  <p>
                    <strong>Click &apos;Add data&apos; above to:</strong>
                  </p>
                  <ul>
                    <li>Browse the Data Catalogue</li>
                    <li>Load your own data onto the map</li>
                  </ul>
                  <p>
                    <Icon glyph={Icon.GLYPHS.bulb} />
                    <strong>TIP:</strong>{" "}
                    <em>All your active data sets will be listed here</em>
                  </p>
                </div>
              </Otherwise>
            </Choose>
          </div>
        </div>
      );
    }
  })
);

module.exports = SidePanel;
