import { observer } from "mobx-react";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import parseCustomMarkdownToReact from "../Custom/parseCustomMarkdownToReact";
import {
  addRemoveButtonClicked,
  allMappableMembersInWorkbench
} from "../DataCatalog/DisplayGroupHelper";
import measureElement from "../HOCs/measureElement";
import SharePanel from "../Map/Panels/SharePanel/SharePanel";
import DataPreviewSections from "./DataPreviewSections";
import DataPreviewUrl from "./DataPreviewUrl";
import Styles from "./mappable-preview.scss";
import WarningBox from "./WarningBox";

/**
 * A "preview" for CatalogGroup.
 */
@observer
class GroupPreview extends React.Component {
  static propTypes = {
    previewed: PropTypes.object.isRequired,
    terria: PropTypes.object.isRequired,
    viewState: PropTypes.object.isRequired,
    widthFromMeasureElementHOC: PropTypes.number,
    t: PropTypes.func.isRequired
  };

  refToMeasure: any;

  backToMap() {
    // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
    this.props.viewState.explorerPanelIsVisible = false;
  }

  render() {
    const metadataItem =
      // @ts-expect-error TS(2339): Property 'previewed' does not exist on type 'Reado... Remove this comment to see the full error message
      this.props.previewed.nowViewingCatalogItem || this.props.previewed;
    // @ts-expect-error TS(2339): Property 't' does not exist on type 'Readonly<{}> ... Remove this comment to see the full error message
    const { t } = this.props;
    return (
      <div>
        <div
          className={Styles.titleAndShareWrapper}
          ref={(component) => (this.refToMeasure = component)}
        >
          // @ts-expect-error TS(2339): Property 'previewed' does not exist on type 'Reado... Remove this comment to see the full error message
          <h3>{this.props.previewed.name}</h3>

          <div className={Styles.shareLinkWrapper}>
            {/* If this is a display group, show the "Add/Remove All" button next to the shareLink */}
            // @ts-expect-error TS(2339): Property 'previewed' does not exist on type 'Reado... Remove this comment to see the full error message
            {this.props.previewed.displayGroup === true && (
              <button
                type="button"
                onClick={(event) => {
                  addRemoveButtonClicked(
                    // @ts-expect-error TS(2339): Property 'previewed' does not exist on type 'Reado... Remove this comment to see the full error message
                    this.props.previewed,
                    // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
                    this.props.viewState,
                    // @ts-expect-error TS(2339): Property 'terria' does not exist on type 'Readonly... Remove this comment to see the full error message
                    this.props.terria,
                    event.shiftKey || event.ctrlKey
                  );
                }}
                className={Styles.btnAddAll}
              >
                {allMappableMembersInWorkbench(
                  // @ts-expect-error TS(2339): Property 'previewed' does not exist on type 'Reado... Remove this comment to see the full error message
                  this.props.previewed.members,
                  // @ts-expect-error TS(2339): Property 'terria' does not exist on type 'Readonly... Remove this comment to see the full error message
                  this.props.terria
                )
                  ? t("models.catalog.removeAll")
                  : t("models.catalog.addAll")}
              </button>
            )}
            // @ts-expect-error TS(2739): Remove this comment to see the full error message
            <SharePanel
              catalogShare
              // @ts-expect-error TS(2339): Property 'widthFromMeasureElementHOC' does not exi... Remove this comment to see the full error message
              modalWidth={this.props.widthFromMeasureElementHOC}
              // @ts-expect-error TS(2339): Property 'terria' does not exist on type 'Readonly... Remove this comment to see the full error message
              terria={this.props.terria}
              // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
              viewState={this.props.viewState}
            />
          </div>
        </div>
        // @ts-expect-error TS(2339): Property 'previewed' does not exist on type 'Reado... Remove this comment to see the full error message
        {this.props.previewed.loadMetadataResult?.error && (
          <WarningBox
            // @ts-expect-error TS(2339): Property 'previewed' does not exist on type 'Reado... Remove this comment to see the full error message
            error={this.props.previewed.loadMetadataResult?.error}
            // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
            viewState={this.props.viewState}
          />
        )}
        // @ts-expect-error TS(2339): Property 'previewed' does not exist on type 'Reado... Remove this comment to see the full error message
        {this.props.previewed.loadMembersResult?.error && (
          <WarningBox
            // @ts-expect-error TS(2339): Property 'previewed' does not exist on type 'Reado... Remove this comment to see the full error message
            error={this.props.previewed.loadMembersResult?.error}
            // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
            viewState={this.props.viewState}
          />
        )}
        <div className={Styles.previewedInfo}>
          // @ts-expect-error TS(2339): Property 'url' does not exist on type 'IMappablePr... Remove this comment to see the full error message
          <div className={Styles.url}>
            // @ts-expect-error TS(2339): Property 'previewed' does not exist on type 'Reado... Remove this comment to see the full error message
            {this.props.previewed.description &&
              // @ts-expect-error TS(2339): Property 'previewed' does not exist on type 'Reado... Remove this comment to see the full error message
              this.props.previewed.description.length > 0 && (
                <div>
                  <h4 className={Styles.h4}>{t("description.name")}</h4>
                  {parseCustomMarkdownToReact(
                    // @ts-expect-error TS(2339): Property 'previewed' does not exist on type 'Reado... Remove this comment to see the full error message
                    this.props.previewed.description,
                    // @ts-expect-error TS(2339): Property 'previewed' does not exist on type 'Reado... Remove this comment to see the full error message
                    { catalogItem: this.props.previewed }
                  )}
                </div>
              )}
            <DataPreviewSections metadataItem={metadataItem} />

            {metadataItem.dataCustodian && (
              <div>
                <h4 className={Styles.h4}>{t("preview.dataCustodian")}</h4>
                {parseCustomMarkdownToReact(metadataItem.dataCustodian, {
                  catalogItem: metadataItem
                })}
              </div>
            )}

            {metadataItem.url &&
              metadataItem.url.length &&
              !metadataItem.hideSource && (
                // @ts-expect-error TS(2769): No overload matches this call.
                <DataPreviewUrl metadataItem={metadataItem} />
              )}
          </div>
        </div>
      </div>
    );
  }
}

// @ts-expect-error TS(2345): Argument of type 'typeof GroupPreview' is not assi... Remove this comment to see the full error message
export default withTranslation()(measureElement(GroupPreview));
