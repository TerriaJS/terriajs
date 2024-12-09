import { observer } from "mobx-react";
import { runInAction } from "mobx";
import PropTypes from "prop-types";
import React from "react";
import { Trans, withTranslation } from "react-i18next";
import {
  Category,
  DatatabAction
} from "../../../../Core/AnalyticEvents/analyticEvents";
import getDataType from "../../../../Core/getDataType";
import TimeVarying from "../../../../ModelMixins/TimeVarying";
import addUserCatalogMember from "../../../../Models/Catalog/addUserCatalogMember";
import addUserFiles from "../../../../Models/Catalog/addUserFiles";
import CatalogMemberFactory from "../../../../Models/Catalog/CatalogMemberFactory";
import createCatalogItemFromFileOrUrl from "../../../../Models/Catalog/createCatalogItemFromFileOrUrl";
import CommonStrata from "../../../../Models/Definition/CommonStrata";
import upsertModelFromJson from "../../../../Models/Definition/upsertModelFromJson";
import Icon from "../../../../Styled/Icon";
import Dropdown from "../../../Generic/Dropdown";
import Loader from "../../../Loader";
import Styles from "./add-data.scss";
import FileInput from "./FileInput";
import { parseCustomMarkdownToReactWithOptions } from "../../../Custom/parseCustomMarkdownToReact";
import loadJson from "../../../../Core/loadJson";
import TerriaError from "../../../../Core/TerriaError";

/**
 * Add data panel in modal window -> My data tab
 */
@observer
class AddData extends React.Component {
  static propTypes = {
    terria: PropTypes.object,
    viewState: PropTypes.object,
    resetTab: PropTypes.func,
    activeTab: PropTypes.string,
    // localDataTypes & remoteDataTypes specifies the file types to show in dropdowns for local and remote data uploads.
    // These default to the lists defined in getDataType.ts
    // Some external components use these props to customize the types shown.
    localDataTypes: PropTypes.arrayOf(PropTypes.object),
    remoteDataTypes: PropTypes.arrayOf(PropTypes.object),
    onFileAddFinished: PropTypes.func.isRequired,
    onUrlAddFinished: PropTypes.func.isRequired,
    t: PropTypes.func.isRequired
  };

  constructor(props: any) {
    super(props);

    const remoteDataTypes =
      // @ts-expect-error TS(2339): Property 'remoteDataTypes' does not exist on type ... Remove this comment to see the full error message
      this.props.remoteDataTypes ?? getDataType().remoteDataType;

    // Automatically suffix supported extension types to localDataType names
    const localDataTypes =
      // @ts-expect-error TS(2339): Property 'localDataTypes' does not exist on type '... Remove this comment to see the full error message
      (this.props.localDataTypes ?? getDataType().localDataType).map(
        (dataType: any) => {
          const extensions = dataType.extensions?.length
            ? ` (${buildExtensionsList(dataType.extensions)})`
            : "";
          return { ...dataType, name: `${dataType.name}${extensions}` };
        }
      );

    this.state = {
      remoteDataTypes,
      localDataTypes,
      localDataType: localDataTypes[0],
      remoteUrl: "", // By default there's no remote url
      isLoading: false
    };
  }

  selectLocalOption(option: any) {
    this.setState({
      localDataType: option
    });
  }

  selectRemoteOption(option: any) {
    runInAction(() => {
      // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
      this.props.viewState.remoteDataType = option;
    });
  }

  handleUploadFile(e: any) {
    this.setState({
      isLoading: true
    });
    addUserFiles(
      e.target.files,
      // @ts-expect-error TS(2339): Property 'terria' does not exist on type 'Readonly... Remove this comment to see the full error message
      this.props.terria,
      // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
      this.props.viewState,
      // @ts-expect-error TS(2339): Property 'localDataType' does not exist on type 'R... Remove this comment to see the full error message
      this.state.localDataType
    ).then((addedCatalogItems) => {
      if (addedCatalogItems && addedCatalogItems.length > 0) {
        // @ts-expect-error TS(2339): Property 'onFileAddFinished' does not exist on typ... Remove this comment to see the full error message
        this.props.onFileAddFinished(addedCatalogItems);
      }
      this.setState({
        isLoading: false
      });
      // reset active tab when file handling is done
      // @ts-expect-error TS(2339): Property 'resetTab' does not exist on type 'Readon... Remove this comment to see the full error message
      this.props.resetTab();
    });
  }

  async handleUrl(e: any) {
    // @ts-expect-error TS(2339): Property 'remoteUrl' does not exist on type 'Reado... Remove this comment to see the full error message
    const url = this.state.remoteUrl;
    e.preventDefault();
    // @ts-expect-error TS(2339): Property 'terria' does not exist on type 'Readonly... Remove this comment to see the full error message
    this.props.terria.analytics?.logEvent(
      Category.dataTab,
      DatatabAction.addDataUrl,
      url
    );
    this.setState({
      isLoading: true
    });
    let promise;
    if (
      // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
      !this.props.viewState.remoteDataType ||
      // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
      this.props.viewState.remoteDataType.value === "auto"
    ) {
      promise = createCatalogItemFromFileOrUrl(
        // @ts-expect-error TS(2339): Property 'terria' does not exist on type 'Readonly... Remove this comment to see the full error message
        this.props.terria,
        // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
        this.props.viewState,
        // @ts-expect-error TS(2339): Property 'remoteUrl' does not exist on type 'Reado... Remove this comment to see the full error message
        this.state.remoteUrl,
        // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
        this.props.viewState.remoteDataType?.value
      );
      // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
    } else if (this.props.viewState.remoteDataType.value === "json") {
      // @ts-expect-error TS(2339): Property 'remoteUrl' does not exist on type 'Reado... Remove this comment to see the full error message
      promise = loadJson(this.state.remoteUrl)
        .then((data) => {
          if (data.error) {
            return Promise.reject(data.error);
          }
          // @ts-expect-error TS(2339): Property 'terria' does not exist on type 'Readonly... Remove this comment to see the full error message
          this.props.terria.catalog.group
            .addMembersFromJson(CommonStrata.user, data.catalog)
            // @ts-expect-error TS(2339): Property 'terria' does not exist on type 'Readonly... Remove this comment to see the full error message
            .raiseError(this.props.terria, "Failed to load catalog from file");
        })
        .then(() => {
          // @ts-expect-error TS(2339): Property 'onUrlAddFinished' does not exist on type... Remove this comment to see the full error message
          this.props.onUrlAddFinished();
        })
        .catch((error) =>
          TerriaError.from(error).raiseError(
            // @ts-expect-error TS(2339): Property 'terria' does not exist on type 'Readonly... Remove this comment to see the full error message
            this.props.terria,
            // @ts-expect-error TS(2339): Property 'remoteUrl' does not exist on type 'Reado... Remove this comment to see the full error message
            `An error occurred trying to add data from URL: ${this.state.remoteUrl}`
          )
        )
        .finally(() => {
          this.setState({
            isLoading: false
          });
        });
    } else {
      try {
        const newItem = upsertModelFromJson(
          CatalogMemberFactory,
          // @ts-expect-error TS(2339): Property 'terria' does not exist on type 'Readonly... Remove this comment to see the full error message
          this.props.terria,
          "",
          CommonStrata.defaults,
          // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
          { type: this.props.viewState.remoteDataType.value, name: url },
          {}
        ).throwIfUndefined({
          message: `An error occurred trying to add data from URL: ${url}`
        });
        newItem.setTrait(CommonStrata.user, "url", url);
        // @ts-expect-error TS(2339): Property 'loadMetadata' does not exist on type 'Ba... Remove this comment to see the full error message
        promise = newItem.loadMetadata().then((result: any) => {
          if (result.error) {
            return Promise.reject(result.error);
          }

          return Promise.resolve(newItem);
        });
      } catch (e) {
        promise = Promise.reject(e);
      }
    }
    // @ts-expect-error TS(2339): Property 'terria' does not exist on type 'Readonly... Remove this comment to see the full error message
    addUserCatalogMember(this.props.terria, promise).then((addedItem) => {
      if (addedItem) {
        // @ts-expect-error TS(2339): Property 'onFileAddFinished' does not exist on typ... Remove this comment to see the full error message
        this.props.onFileAddFinished([addedItem]);
        if (TimeVarying.is(addedItem)) {
          // @ts-expect-error TS(2339): Property 'terria' does not exist on type 'Readonly... Remove this comment to see the full error message
          this.props.terria.timelineStack.addToTop(addedItem);
        }
      }

      // FIXME: Setting state here might result in a react warning if the
      // component unmounts before the promise finishes
      this.setState({
        isLoading: false
      });
      // @ts-expect-error TS(2339): Property 'resetTab' does not exist on type 'Readon... Remove this comment to see the full error message
      this.props.resetTab();
    });
  }

  onRemoteUrlChange(event: any) {
    this.setState({
      remoteUrl: event.target.value
    });
  }

  renderPanels() {
    // @ts-expect-error TS(2339): Property 't' does not exist on type 'Readonly<{}> ... Remove this comment to see the full error message
    const { t } = this.props;
    const dropdownTheme = {
      // @ts-expect-error TS(2339): Property 'dropdown' does not exist on type 'IAddDa... Remove this comment to see the full error message
      dropdown: Styles.dropdown,
      list: Styles.dropdownList,
      // @ts-expect-error TS(2339): Property 'dropdownListIsOpen' does not exist on ty... Remove this comment to see the full error message
      isOpen: Styles.dropdownListIsOpen,
      icon: <Icon glyph={Icon.GLYPHS.opened} />
    };

    // @ts-expect-error TS(2339): Property 'localDataTypes' does not exist on type '... Remove this comment to see the full error message
    const dataTypes = this.state.localDataTypes.reduce(function (
      result: any,
      currentDataType: any
    ) {
      if (currentDataType.extensions) {
        return result.concat(
          currentDataType.extensions.map((extension: any) => "." + extension)
        );
      } else {
        return result;
      }
    },
    []);

    const remoteDataType =
      // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
      this.props.viewState.remoteDataType ?? this.state.remoteDataTypes[0];

    return (
      <div className={Styles.tabPanels}>
        // @ts-expect-error TS(2339): Property 'activeTab' does not exist on
        type 'Reado... Remove this comment to see the full error message
        {this.props.activeTab === "local" && (
          <>
            <div className={Styles.tabHeading}>{t("addData.localAdd")}</div>
            <section className={Styles.tabPanel}>
              <label className={Styles.label}>
                <Trans i18nKey="addData.localFileType">
                  <strong>Step 1:</strong> Select file type
                </Trans>
              </label>
              <Dropdown
                // @ts-expect-error TS(2339): Property 'localDataTypes' does not exist on type '... Remove this comment to see the full error message
                options={this.state.localDataTypes}
                // @ts-expect-error TS(2339): Property 'localDataType' does not exist on type 'R... Remove this comment to see the full error message
                selected={this.state.localDataType}
                // @ts-expect-error TS(2769): No overload matches this call.
                selectOption={this.selectLocalOption.bind(this)}
                matchWidth
                theme={dropdownTheme}
              />
              // @ts-expect-error TS(2339): Property 'localDataType' does not
              exist on type 'R... Remove this comment to see the full error
              message
              {this.state.localDataType?.description
                ? parseCustomMarkdownToReactWithOptions(
                    // @ts-expect-error TS(2339): Property 'localDataType' does not exist on type 'R... Remove this comment to see the full error message
                    this.state.localDataType?.description
                  )
                : null}
              <label className={Styles.label}>
                <Trans i18nKey="addData.localFile">
                  <strong>Step 2:</strong> Select file
                </Trans>
              </label>
              <FileInput
                // @ts-expect-error TS(2322): Type '{ accept: any; onChange: (e: any) => void; }... Remove this comment to see the full error message
                accept={dataTypes.join(",")}
                onChange={this.handleUploadFile.bind(this)}
              />
              // @ts-expect-error TS(2339): Property 'isLoading' does not exist
              on type 'Reado... Remove this comment to see the full error
              message
              {this.state.isLoading && <Loader />}
            </section>
          </>
        )}
        // @ts-expect-error TS(2339): Property 'activeTab' does not exist on
        type 'Reado... Remove this comment to see the full error message
        {this.props.activeTab === "web" && (
          <>
            <div className={Styles.tabHeading}>{t("addData.webAdd")}</div>
            <section className={Styles.tabPanel}>
              <label className={Styles.label}>
                <Trans i18nKey="addData.webFileType">
                  <strong>Step 1:</strong> Select file or web service type
                </Trans>
              </label>
              <Dropdown
                // @ts-expect-error TS(2339): Property 'remoteDataTypes' does not exist on type ... Remove this comment to see the full error message
                options={this.state.remoteDataTypes}
                selected={remoteDataType}
                // @ts-expect-error TS(2769): No overload matches this call.
                selectOption={this.selectRemoteOption.bind(this)}
                matchWidth
                theme={dropdownTheme}
              />
              {remoteDataType?.description
                ? parseCustomMarkdownToReactWithOptions(
                    remoteDataType?.description
                  )
                : null}
              {remoteDataType?.customComponent
                ? this.renderCustomComponent(remoteDataType?.customComponent)
                : this.renderDefaultForWebDataType(t)}
            </section>
          </>
        )}
      </div>
    );
  }

  renderCustomComponent(CustomComponent: any) {
    return <CustomComponent />;
  }

  renderDefaultForWebDataType(t: any) {
    return (
      <>
        <label className={Styles.label}>
          <Trans i18nKey="addData.webFile">
            <strong>Step 2:</strong> Enter the URL of the data file or web
            service
          </Trans>
        </label>
        <form className={Styles.urlInput}>
          <input
            // @ts-expect-error TS(2339): Property 'remoteUrl' does not exist on type 'Reado... Remove this comment to see the full error message
            value={this.state.remoteUrl}
            onChange={this.onRemoteUrlChange.bind(this)}
            className={Styles.urlInputTextBox}
            type="text"
            placeholder="e.g. http://data.gov.au/geoserver/wms"
          />
          <button
            // @ts-expect-error TS(2339): Property 'remoteUrl' does not exist on type 'Reado... Remove this comment to see the full error message
            disabled={this.state.remoteUrl.length === 0}
            type="submit"
            onClick={this.handleUrl.bind(this)}
            className={Styles.urlInputBtn}
          >
            {t("addData.urlInputBtn")}
          </button>
          // @ts-expect-error TS(2339): Property 'isLoading' does not exist on
          type 'Reado... Remove this comment to see the full error message
          {this.state.isLoading && <Loader />}
        </form>
      </>
    );
  }

  render() {
    return <div className={Styles.inner}>{this.renderPanels()}</div>;
  }
}

/**
 * @param extensions - string[]
 * @returns Comma separated string of extensions
 */
function buildExtensionsList(extensions: any) {
  return extensions.map((ext: any) => `.${ext}`).join(", ");
}

export default withTranslation()(AddData);
