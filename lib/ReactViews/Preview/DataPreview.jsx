"use strict";
import createReactClass from "create-react-class";
import { runInAction } from "mobx";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import React from "react";
import { Helmet } from "react-helmet";
import { withTranslation } from "react-i18next";
import { withRouter } from "react-router-dom";
import CatalogFunctionMixin from "../../ModelMixins/CatalogFunctionMixin";
import ReferenceMixin from "../../ModelMixins/ReferenceMixin";
import { ROOT_ROUTE } from "../../ReactViewModels/TerriaRouting";
import Box from "../../Styled/Box";
import Button from "../../Styled/Button";
import InvokeFunction from "../Analytics/InvokeFunction";
import Loader from "../Loader";
import Styles from "./data-preview.scss";
// import Chart from "../Custom/Chart/Chart";
import Description, { getMetaDescriptionSummary } from "./Description";
import GroupPreview from "./GroupPreview";
import MappablePreview from "./MappablePreview";

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
      location: PropTypes.object.isRequired,
      t: PropTypes.func.isRequired
    },

    getInitialState() {
      return {
        // For prerendering & expanding parent catalog on first load
        loaded: false
      };
    },

    componentDidMount() {
      // Make sure our prerenderer doesn't stall waiting forever
      setTimeout(prerenderEnd, 10000);
      this.checkEnableWithParents();
    },

    componentDidUpdate() {
      this.checkEnableWithParents();
    },

    checkEnableWithParents() {
      if (
        !this.state.loaded &&
        this.props.previewed &&
        !this.props.previewed.isLoading
      ) {
        // also enable parents for the first load ever,
        // to ensure that the catalog hierarchy is visible as users can land
        // directly on a previewed item now via URL-routing only, without share link
        this.props.previewed.parent &&
          this.props.previewed.parent.enableWithParents &&
          this.props.previewed.parent.enableWithParents();

        prerenderEnd();

        this.setState({ loaded: true });
      } else if (!this.state.loaded && !this.props.previewed) {
        // we're on /catalog/ without a previewed item, immediately prerender end
        prerenderEnd();
      }
    },

    backToMap() {
      runInAction(() => {
        this.props.viewState.explorerPanelIsVisible = false;
      });
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
      const appBaseUrl = this.props.terria.configParameters.appBaseUrl;
      const pathname = this.props.location && this.props.location.pathname;
      const pathForCanonical =
        pathname && pathname.charAt(0) === "/" ? pathname.slice(1) : pathname;
      let chartData;
      if (previewed && !previewed.isMappable && previewed.tableStructure) {
        chartData = previewed.chartData();
      }
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
                <p>{t("preview.selectToPreview")}</p>
                <p>{t("preview.or")}</p>
                <Box centered>
                  <Button secondary shortMinHeight renderAsLink to={ROOT_ROUTE}>
                    {t("preview.goToTheMap")}
                  </Button>
                </Box>
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
              <div className={Styles.placeholder}>
                <h2>Unable to resolve reference</h2>
                <p>
                  {this.props.previewed.loadReferenceResult?.error
                    ? this.props.previewed.loadReferenceResult?.error?.message
                    : `This reference could not be resolved because it is invalid or
                  because it points to something that cannot be visualised.`}
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }
  })
);

module.exports = withRouter(withTranslation()(DataPreview));
