// import Chart from "../Custom/Chart/Chart";
import { runInAction } from "mobx";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import React from "react";
import { Trans, withTranslation } from "react-i18next";
import CatalogFunctionMixin from "../../ModelMixins/CatalogFunctionMixin";
import ReferenceMixin from "../../ModelMixins/ReferenceMixin";
import { Icon } from "../../Styled/Icon";
import InvokeFunction from "../Analytics/InvokeFunction";
import Loader from "../Loader";
import Description from "./Description";
import GroupPreview from "./GroupPreview";
import MappablePreview from "./MappablePreview";
import WarningBox from "./WarningBox";
import Styles from "./data-preview.scss";

/**
 * Data preview section, for the preview map see DataPreviewMap
 */
@observer
class DataPreview extends React.Component {
  static propTypes = {
    terria: PropTypes.object.isRequired,
    viewState: PropTypes.object,
    previewed: PropTypes.object,
    t: PropTypes.func.isRequired
  };

  backToMap() {
    runInAction(() => {
      // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
      this.props.viewState.explorerPanelIsVisible = false;
    });
  }

  renderInner() {
    // @ts-expect-error TS(2339): Property 't' does not exist on type 'Readonly<{}> ... Remove this comment to see the full error message
    const { t } = this.props;
    // @ts-expect-error TS(2339): Property 'previewed' does not exist on type 'Reado... Remove this comment to see the full error message
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

    if (previewed && previewed.isLoadingMetadata) {
      return (
        <div className={Styles.previewInner}>
          <h3 className={Styles.h3}>{previewed.name}</h3>
          <Loader />
        </div>
      );
    } else if (previewed && previewed.isMappable) {
      return (
        <div className={Styles.previewInner}>
          <MappablePreview
            // @ts-expect-error TS(2322): Type '{ previewed: any; terria: any; viewState: an... Remove this comment to see the full error message
            previewed={previewed}
            // @ts-expect-error TS(2339): Property 'terria' does not exist on type 'Readonly... Remove this comment to see the full error message
            terria={this.props.terria}
            // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
            viewState={this.props.viewState}
          />
        </div>
      );
    } else if (chartData) {
      return (
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
      );
    } else if (previewed && CatalogFunctionMixin.isMixedInto(previewed)) {
      return (
        <InvokeFunction
          previewed={previewed}
          // @ts-expect-error TS(2339): Property 'terria' does not exist on type 'Readonly... Remove this comment to see the full error message
          terria={this.props.terria}
          // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
          viewState={this.props.viewState}
        />
      );
    } else if (previewed && previewed.isGroup) {
      return (
        <div className={Styles.previewInner}>
          <GroupPreview
            // @ts-expect-error TS(2322): Type '{ previewed: any; terria: any; viewState: an... Remove this comment to see the full error message
            previewed={previewed}
            // @ts-expect-error TS(2339): Property 'terria' does not exist on type 'Readonly... Remove this comment to see the full error message
            terria={this.props.terria}
            // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
            viewState={this.props.viewState}
          />
        </div>
      );
    } else {
      return (
        <div className={Styles.placeholder}>
          <p>{t("preview.selectToPreviewDataset")}</p>
          <p>
            <Trans i18nKey="preview.selectMultipleDatasets">
              <span>
                Press <strong>Shift</strong> and click
              </span>
              <Icon
                // @ts-expect-error TS(2339): Property 'GLYPHS' does not exist on type 'FC<IconP... Remove this comment to see the full error message
                glyph={Icon.GLYPHS.add}
                css={{
                  height: "20px",
                  width: "20px",
                  margin: "0px 5px",
                  verticalAlign: "middle",
                  fill: `${(p: any) => p.theme.charcoalGrey}`
                }}
              />
              <span>to add multiple datasets</span>
            </Trans>
          </p>
          <p>- {t("preview.selectToPreviewSeparator")} -</p>
          <button
            className={Styles.btnBackToMap}
            onClick={() => this.backToMap()}
          >
            {t("preview.goToTheMap")}
          </button>
        </div>
      );
    }
  }

  render() {
    return <div className={Styles.preview}>{this.renderInner()}</div>;
  }

  renderUnloadedReference() {
    // @ts-expect-error TS(2339): Property 'previewed' does not exist on type 'Reado... Remove this comment to see the full error message
    const isLoading = this.props.previewed.isLoadingReference;
    // @ts-expect-error TS(2339): Property 'previewed' does not exist on type 'Reado... Remove this comment to see the full error message
    const hasTarget = this.props.previewed.target !== undefined;
    return (
      <div className={Styles.preview}>
        <div className={Styles.previewInner}>
          {isLoading && <Loader />}
          {!isLoading && !hasTarget && (
            <>
              <div className={Styles.placeholder}>
                <h2>Unable to resolve reference</h2>
                // @ts-expect-error TS(2339): Property 'previewed' does not
                exist on type 'Reado... Remove this comment to see the full
                error message
                {!this.props.previewed.loadReferenceResult?.error ? (
                  <p>
                    This reference could not be resolved because it is invalid
                    or because it points to something that cannot be visualised.
                  </p>
                ) : null}
              </div>
              // @ts-expect-error TS(2339): Property 'previewed' does not exist
              on type 'Reado... Remove this comment to see the full error
              message
              {this.props.previewed.loadReferenceResult?.error ? (
                <WarningBox
                  // @ts-expect-error TS(2339): Property 'previewed' does not exist on type 'Reado... Remove this comment to see the full error message
                  error={this.props.previewed.loadReferenceResult?.error}
                  // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
                  viewState={this.props.viewState}
                />
              ) : null}
            </>
          )}
        </div>
      </div>
    );
  }
}

export default withTranslation()(DataPreview);
