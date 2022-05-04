"use strict";
// import Chart from "../Custom/Chart/Chart";
import createReactClass from "create-react-class";
import { runInAction, when } from "mobx";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import React from "react";
import { Helmet } from "react-helmet";
import { Trans, withTranslation } from "react-i18next";
import CatalogFunctionMixin from "../../ModelMixins/CatalogFunctionMixin";
import ReferenceMixin from "../../ModelMixins/ReferenceMixin";
import InvokeFunction from "../Analytics/InvokeFunction";
import Loader from "../Loader";
import Styles from "./data-preview.scss";
import Description, { getMetaDescriptionSummary } from "./Description";
import GroupPreview from "./GroupPreview";
import MappablePreview from "./MappablePreview";
import WarningBox from "./WarningBox";

const prerenderEnd = () => {
  if (document && document.dispatchEvent) {
    document.dispatchEvent(new Event("prerender-end"));
  }
};

/**
 * Data preview section, for the preview map see DataPreviewMap
 */
const DataPreview = observer(
  createReactClass({
    displayName: "DataPreview",

    propTypes: {
      terria: PropTypes.object.isRequired,
      viewState: PropTypes.object,
      previewed: PropTypes.object,
      t: PropTypes.func.isRequired
    },

    backToMap() {
      runInAction(() => {
        this.props.viewState.explorerPanelIsVisible = false;
      });
    },

    componentDidMount() {
      const timeoutMs = 10000;
      setTimeout(prerenderEnd, timeoutMs);
      // Reactive to props change (in case previewed doesn't immediately get set to the correct item)
      when(this.itemLoaded, { timeout: timeoutMs }).then(prerenderEnd);
    },

    itemLoaded() {
      return Boolean(this.props.previewed && !this.props.previewed.isLoading);
    },

    render() {
      const { t } = this.props;
      let previewed = this.props.previewed;
      if (previewed !== undefined && ReferenceMixin.isMixedInto(previewed)) {
        // We are loading the nested target because we could be dealing with a nested reference here
        if (previewed.nestedTarget === undefined) {
          // Reference is not available yet.
          return this.renderUnloadedReference();
        }
        previewed = previewed.nestedTarget;
      }

      let chartData;
      if (previewed && !previewed.isMappable && previewed.tableStructure) {
        chartData = previewed.chartData();
      }

      const appBaseUrl = this.props.terria.appBaseHref;
      const pathForCanonical = `catalog/${encodeURIComponent(
        previewed?.uniqueId
      )}`;

      return (
        <div className={Styles.preview}>
          <If condition={previewed}>
            <Helmet>
              <title>
                {previewed.name} - {this.props.terria.appName}
              </title>
              <meta
                name="description"
                content={getMetaDescriptionSummary(previewed)}
              />
              <If condition={appBaseUrl && pathForCanonical}>
                <link
                  rel="canonical"
                  href={`${appBaseUrl}${pathForCanonical}`}
                />
              </If>
            </Helmet>
          </If>
          <Choose>
            <When condition={previewed && previewed.isLoadingMetadata}>
              <div className={Styles.previewInner}>
                <h3 className={Styles.h3}>{previewed.name}</h3>
                <Loader />
              </div>
            </When>
            <When condition={previewed && previewed.isMappable}>
              <div className={Styles.previewInner}>
                <MappablePreview
                  previewed={previewed}
                  terria={this.props.terria}
                  viewState={this.props.viewState}
                />
              </div>
            </When>
            <When condition={chartData}>
              <div className={Styles.previewInner}>
                <h3 className={Styles.h3}>{previewed.name}</h3>
                <p>{t("preview.doesNotContainGeospatialData")}</p>
                <div className={Styles.previewChart}>
                  {/* TODO: Show a preview chart
                      <Chart
                         data={chartData}
                         axisLabel={{ x: previewed.xAxis.units, y: undefined }}
                         height={250 - 34}
                         />
                  */}
                </div>
                <Description item={previewed} />
              </div>
            </When>
            <When
              condition={
                previewed && CatalogFunctionMixin.isMixedInto(previewed)
              }
            >
              <InvokeFunction
                previewed={previewed}
                terria={this.props.terria}
                viewState={this.props.viewState}
              />
            </When>
            <When condition={previewed && previewed.isGroup}>
              <div className={Styles.previewInner}>
                <GroupPreview
                  previewed={previewed}
                  terria={this.props.terria}
                  viewState={this.props.viewState}
                />
              </div>
            </When>
            <Otherwise>
              <div className={Styles.placeholder}>
                <Trans i18nKey="preview.selectToPreview">
                  <p>Select a dataset to see a preview</p>
                  <p>- OR -</p>
                  <button
                    className={Styles.btnBackToMap}
                    onClick={this.backToMap}
                  >
                    Go to the map
                  </button>
                </Trans>
              </div>
            </Otherwise>
          </Choose>
        </div>
      );
    },

    renderUnloadedReference() {
      const isLoading = this.props.previewed.isLoadingReference;
      const hasTarget = this.props.previewed.target !== undefined;
      return (
        <div className={Styles.preview}>
          <div className={Styles.previewInner}>
            {isLoading && <Loader />}
            {!isLoading && !hasTarget && (
              <>
                <div className={Styles.placeholder}>
                  <h2>Unable to resolve reference</h2>
                  {!this.props.previewed.loadReferenceResult?.error ? (
                    <p>
                      This reference could not be resolved because it is invalid
                      or because it points to something that cannot be
                      visualised.
                    </p>
                  ) : null}
                </div>
                {this.props.previewed.loadReferenceResult?.error ? (
                  <WarningBox
                    error={this.props.previewed.loadReferenceResult?.error}
                    viewState={this.props.viewState}
                  />
                ) : null}
              </>
            )}
          </div>
        </div>
      );
    }
  })
);

module.exports = withTranslation()(DataPreview);
