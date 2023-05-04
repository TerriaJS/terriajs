import React from "react";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import { observer } from "mobx-react";
import DataPreviewSections from "./DataPreviewSections";
import DataPreviewUrl from "./DataPreviewUrl";
import measureElement from "../HOCs/measureElement";
import Styles from "./mappable-preview.scss";
import parseCustomMarkdownToReact from "../Custom/parseCustomMarkdownToReact";
import SharePanel from "../Map/Panels/SharePanel/SharePanel";
import { withTranslation } from "react-i18next";
import WarningBox from "./WarningBox";
import {
  addRemoveButtonClicked,
  allMappableMembersInWorkbench
} from "../DataCatalog/DisplayGroupHelper";

/**
 * A "preview" for CatalogGroup.
 */
const GroupPreview = observer(
  createReactClass({
    displayName: "GroupPreview",

    propTypes: {
      previewed: PropTypes.object.isRequired,
      terria: PropTypes.object.isRequired,
      viewState: PropTypes.object.isRequired,
      widthFromMeasureElementHOC: PropTypes.number,
      t: PropTypes.func.isRequired
    },

    backToMap() {
      this.props.viewState.explorerPanelIsVisible = false;
    },

    render() {
      const metadataItem =
        this.props.previewed.nowViewingCatalogItem || this.props.previewed;
      const { t } = this.props;
      return (
        <div>
          <div
            className={Styles.titleAndShareWrapper}
            ref={(component) => (this.refToMeasure = component)}
          >
            <h3>{this.props.previewed.name}</h3>

            <div className={Styles.shareLinkWrapper}>
              {/* If this is a display group, show the "Add/Remove All" button next to the shareLink */}
              {this.props.previewed.displayGroup === true && (
                <button
                  type="button"
                  onClick={(event) => {
                    addRemoveButtonClicked(
                      this.props.previewed,
                      this.props.viewState,
                      this.props.terria,
                      event.shiftKey || event.ctrlKey
                    );
                  }}
                  className={Styles.btnAddAll}
                >
                  {allMappableMembersInWorkbench(
                    this.props.previewed.members,
                    this.props.terria
                  )
                    ? t("models.catalog.removeAll")
                    : t("models.catalog.addAll")}
                </button>
              )}
              <SharePanel
                catalogShare
                modalWidth={this.props.widthFromMeasureElementHOC}
                terria={this.props.terria}
                viewState={this.props.viewState}
              />
            </div>
          </div>
          <If condition={this.props.previewed.loadMetadataResult?.error}>
            <WarningBox
              error={this.props.previewed.loadMetadataResult?.error}
              viewState={this.props.viewState}
            />
          </If>
          <If condition={this.props.previewed.loadMembersResult?.error}>
            <WarningBox
              error={this.props.previewed.loadMembersResult?.error}
              viewState={this.props.viewState}
            />
          </If>
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
                    <h4 className={Styles.h4}>{t("description.name")}</h4>
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
                  <h4 className={Styles.h4}>{t("preview.dataCustodian")}</h4>
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
  })
);

export default withTranslation()(measureElement(GroupPreview));
