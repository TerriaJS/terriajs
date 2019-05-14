import React from "react";

import createReactClass from "create-react-class";

import PropTypes from "prop-types";

import DataPreviewSections from "./DataPreviewSections";
import DataPreviewUrl from "./DataPreviewUrl.jsx";
import measureElement from "../measureElement";
import ObserveModelMixin from "../ObserveModelMixin";
import Styles from "./mappable-preview.scss";
import parseCustomMarkdownToReact from "../Custom/parseCustomMarkdownToReact";
import SharePanel from "../Map/Panels/SharePanel/SharePanel.jsx";

/**
 * A "preview" for CatalogGroup.
 */
const GroupPreview = createReactClass({
  displayName: "GroupPreview",
  mixins: [ObserveModelMixin],

  propTypes: {
    previewed: PropTypes.object.isRequired,
    terria: PropTypes.object.isRequired,
    viewState: PropTypes.object.isRequired,
    widthFromMeasureElementHOC: PropTypes.number
  },

  backToMap() {
    this.props.viewState.explorerPanelIsVisible = false;
  },

  render() {
    const metadataItem =
      this.props.previewed.nowViewingCatalogItem || this.props.previewed;

    return (
      <div>
        <div
          className={Styles.titleAndShareWrapper}
          ref={component => (this.refToMeasure = component)}
        >
          <h3>{this.props.previewed.name}</h3>
          <div className={Styles.shareLinkWrapper}>
            <SharePanel
              catalogShare
              modalWidth={this.props.widthFromMeasureElementHOC}
              terria={this.props.terria}
              viewState={this.props.viewState}
            />
          </div>
        </div>
        <div className={Styles.previewedInfo}>
          <div className={Styles.url}>
            <Choose>
              <When
                condition={
                  this.props.previewed.description &&
                  this.props.previewed.description.length > 0
                }
              >
                <div>
                  <h4 className={Styles.h4}>Description</h4>
                  {parseCustomMarkdownToReact(
                    this.props.previewed.description,
                    { catalogItem: this.props.previewed }
                  )}
                </div>
              </When>
            </Choose>

            <DataPreviewSections metadataItem={metadataItem} />

            <If condition={metadataItem.dataCustodian}>
              <div>
                <h4 className={Styles.h4}>Data Custodian</h4>
                {parseCustomMarkdownToReact(metadataItem.dataCustodian, {
                  catalogItem: metadataItem
                })}
              </div>
            </If>

            <If
              condition={
                metadataItem.url &&
                metadataItem.url.length &&
                !metadataItem.hideSource
              }
            >
              <DataPreviewUrl metadataItem={metadataItem} />
            </If>
          </div>
        </div>
      </div>
    );
  }
});

export default measureElement(GroupPreview);
