import React from "react";
import { observer } from "mobx-react";
import classNames from "classnames";
import Icon from "../../../../Styled/Icon";
import Box from "../../../../Styled/Box";
import PropTypes from "prop-types";
import DataPreview from "../../../Preview/DataPreview.jsx";
import AddData from "./AddData.jsx";
import { withTranslation, Trans } from "react-i18next";
import Styles from "./my-data-tab.scss";
import DataCatalogMember from "../../../DataCatalog/DataCatalogMember";

// My data tab include Add data section and preview section
@observer
class MyDataTab extends React.Component {
  static propTypes = {
    terria: PropTypes.object,
    viewState: PropTypes.object,
    onFileAddFinished: PropTypes.func.isRequired,
    onUrlAddFinished: PropTypes.func.isRequired,
    localDataTypes: PropTypes.arrayOf(PropTypes.object),
    remoteDataTypes: PropTypes.arrayOf(PropTypes.object),
    className: PropTypes.string,
    t: PropTypes.func.isRequired
  };

  constructor(props: any) {
    super(props);
    this.state = {
      activeTab: null
    };
  }

  hasUserAddedData() {
    // @ts-expect-error TS(2339): Property 'terria' does not exist on type 'Readonly... Remove this comment to see the full error message
    return this.props.terria.catalog.userAddedDataGroup.members.length > 0;
  }

  changeTab(active: any) {
    this.setState({
      activeTab: active
    });
  }

  resetTab() {
    this.setState({
      activeTab: null
    });
  }

  renderTabs() {
    // @ts-expect-error TS(2339): Property 't' does not exist on type 'Readonly<{}> ... Remove this comment to see the full error message
    const { t } = this.props;
    const tabs = [
      {
        id: "local",
        caption: t("addData.localTitle")
      },
      {
        id: "web",
        caption: t("addData.webTitle")
      }
    ];
    return (
      <ul className={Styles.tabList}>
        {tabs.map((tab) => (
          <li className={Styles.tabListItem} key={tab.id}>
            <button
              type="button"
              onClick={() => this.changeTab(tab.id)}
              title={tab.caption}
              className={classNames(Styles.tabListBtn, {
                // @ts-expect-error TS(2339): Property 'isActive' does not exist on type 'IMyDat... Remove this comment to see the full error message
                [Styles.isActive]: this.state.activeTab === tab.id
              })}
              css={`
                color: ${(p: any) => p.theme.colorPrimary};
                &:hover,
                &:focus {
                  color: ${(p: any) => p.theme.grey};
                }
                svg {
                  fill: ${(p: any) => p.theme.colorPrimary};
                }
              `}
            >
              // @ts-expect-error TS(7053): Element implicitly has an 'any' type
              because expre... Remove this comment to see the full error message
              <Icon glyph={Icon.GLYPHS[tab.id]} />
              {tab.caption}
            </button>
          </li>
        ))}
      </ul>
    );
  }

  renderPromptBox() {
    if (this.hasUserAddedData()) {
      // @ts-expect-error TS(2339): Property 't' does not exist on type 'Readonly<{}> ... Remove this comment to see the full error message
      const { t } = this.props;
      return (
        <div className={Styles.dataTypeTab}>
          <div className={Styles.dndBox}>
            <Icon glyph={Icon.GLYPHS.upload} />
            {t("addData.dragDrop")}
          </div>
        </div>
      );
    }

    return (
      <div className={Styles.dataTypeTab}>
        <div className={Styles.dndBoxInfo}>
          <Trans i18nKey="addData.infoText">
            <div>Drag and drop a file here to view it locally on the map</div>
            <div>(it won’t be saved or uploaded to the internet)</div>
          </Trans>
          <div className={Styles.tabCenter}>{this.renderTabs()}</div>
        </div>
        <div className={Styles.dndBox}>
          <Icon glyph={Icon.GLYPHS.upload} />
        </div>
      </div>
    );
  }

  render() {
    // @ts-expect-error TS(2339): Property 'activeTab' does not exist on type 'Reado... Remove this comment to see the full error message
    const showTwoColumn = !!(this.hasUserAddedData() && !this.state.activeTab);
    // @ts-expect-error TS(2339): Property 't' does not exist on type 'Readonly<{}> ... Remove this comment to see the full error message
    const { t, className } = this.props;
    return (
      <Box
        className={classNames(Styles.root, {
          [className]: className !== undefined
        })}
      >
        <div
          className={classNames({
            [Styles.leftCol]: showTwoColumn,
            [Styles.oneCol]: !showTwoColumn
          })}
        >
          // @ts-expect-error TS(2339): Property 'activeTab' does not exist on
          type 'Reado... Remove this comment to see the full error message
          {this.state.activeTab && (
            <>
              <button
                type="button"
                onClick={() => this.resetTab()}
                className={Styles.btnBackToMyData}
                css={`
                  color: ${(p: any) => p.theme.colorPrimary};
                  &:hover,
                  &:focus {
                    border: 1px solid ${(p: any) => p.theme.colorPrimary};
                  }
                  svg {
                    fill: ${(p: any) => p.theme.colorPrimary};
                  }
                `}
              >
                <Icon glyph={Icon.GLYPHS.left} />
                {t("addData.back")}
              </button>
              <AddData
                // @ts-expect-error TS(2339): Property 'terria' does not exist on type 'Readonly... Remove this comment to see the full error message
                terria={this.props.terria}
                // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
                viewState={this.props.viewState}
                // @ts-expect-error TS(2339): Property 'activeTab' does not exist on type 'Reado... Remove this comment to see the full error message
                activeTab={this.state.activeTab}
                resetTab={() => this.resetTab()}
                // @ts-expect-error TS(2339): Property 'onFileAddFinished' does not exist on typ... Remove this comment to see the full error message
                onFileAddFinished={this.props.onFileAddFinished}
                // @ts-expect-error TS(2339): Property 'onUrlAddFinished' does not exist on type... Remove this comment to see the full error message
                onUrlAddFinished={this.props.onUrlAddFinished}
                // @ts-expect-error TS(2339): Property 'localDataTypes' does not exist on type '... Remove this comment to see the full error message
                localDataTypes={this.props.localDataTypes}
                // @ts-expect-error TS(2339): Property 'remoteDataTypes' does not exist on type ... Remove this comment to see the full error message
                remoteDataTypes={this.props.remoteDataTypes}
              />
            </>
          )}
          {showTwoColumn && (
            <Box flexShrinkZero column>
              <p className={Styles.explanation}>
                <Trans i18nKey="addData.note">
                  <strong>Note: </strong>Data added in this way is not saved or
                  made visible to others.
                </Trans>
              </p>
              <div className={Styles.tabLeft}>{this.renderTabs()}</div>

              <ul className={Styles.dataCatalog}>
                // @ts-expect-error TS(2339): Property 'terria' does not exist
                on type 'Readonly... Remove this comment to see the full error
                message
                {this.props.terria.catalog.userAddedDataGroup.memberModels.map(
                  (item: any) => (
                    <DataCatalogMember
                      // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
                      viewState={this.props.viewState}
                      member={item}
                      key={item.uniqueId}
                      removable
                      // @ts-expect-error TS(2339): Property 'terria' does not exist on type 'Readonly... Remove this comment to see the full error message
                      terria={this.props.terria}
                      isTopLevel
                    />
                  )
                )}
              </ul>
            </Box>
          )}
          // @ts-expect-error TS(2339): Property 'activeTab' does not exist on
          type 'Reado... Remove this comment to see the full error message
          {!this.state.activeTab && this.renderPromptBox()}
        </div>
        {showTwoColumn && (
          <Box styledWidth="60%">
            <DataPreview
              // @ts-expect-error TS(2339): Property 'terria' does not exist on type 'Readonly... Remove this comment to see the full error message
              terria={this.props.terria}
              // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
              viewState={this.props.viewState}
              // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
              previewed={this.props.viewState.userDataPreviewedItem}
            />
          </Box>
        )}
      </Box>
    );
  }
}

export default withTranslation()(MyDataTab);
