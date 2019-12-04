import React from "react";

import createReactClass from "create-react-class";

import PropTypes from "prop-types";

import defined from "terriajs-cesium/Source/Core/defined";

import Collapsible from "../Custom/Collapsible/Collapsible";
import DataPreviewSections from "./DataPreviewSections";
import DataUri from "../../Core/DataUri";
import MetadataTable from "./MetadataTable";
import ObserveModelMixin from "../ObserveModelMixin";
import parseCustomMarkdownToReact from "../Custom/parseCustomMarkdownToReact";
import Styles from "./mappable-preview.scss";
import { withTranslation, Trans } from "react-i18next";
import i18next from "i18next";
/**
 * CatalogItem description.
 */
const Description = createReactClass({
  displayName: i18next.t("description.name"),
  mixins: [ObserveModelMixin],

  propTypes: {
    item: PropTypes.object.isRequired,
    printView: PropTypes.bool,
    t: PropTypes.func.isRequired
  },

  render() {
    const { t } = this.props;
    const catalogItem = this.props.item;
    const dataUrlType = catalogItem.dataUrlType;
    let hasDataUriCapability;
    let dataUri;
    let dataUriFormat;
    if (dataUrlType === "data-uri" || dataUrlType === "local") {
      hasDataUriCapability = DataUri.checkCompatibility();
      if (hasDataUriCapability) {
        dataUri = catalogItem.dataUrl;
        if (dataUri) {
          dataUriFormat = getDataUriFormat(dataUri);
        }
      }
    }
    return (
      <div className={Styles.description}>
        <If
          condition={
            catalogItem.description && catalogItem.description.length > 0
          }
        >
          <div>
            <h4 className={Styles.h4}>{t("description.name")}</h4>
            {parseCustomMarkdownToReact(catalogItem.description, {
              catalogItem: catalogItem
            })}
          </div>
        </If>

        <If condition={catalogItem.dataUrlType === "local"}>
          <p>{t("description.dataLocal")}</p>
        </If>

        <If
          condition={
            catalogItem.dataUrlType !== "local" && !catalogItem.hasDescription
          }
        >
          <p>{t("description.dataNotLocal")}</p>
        </If>

        <DataPreviewSections metadataItem={catalogItem} />

        <If
          condition={
            catalogItem.dataCustodian && catalogItem.dataCustodian.length > 0
          }
        >
          <div>
            <h4 className={Styles.h4}>{t("description.dataCustodian")}</h4>
            {parseCustomMarkdownToReact(catalogItem.dataCustodian, {
              catalogItem: catalogItem
            })}
          </div>
        </If>

        <If condition={!catalogItem.hideSource}>
          <If condition={catalogItem.url}>
            <h4 className={Styles.h4}>{catalogItem.typeName} URL</h4>
            <Choose>
              <When condition={catalogItem.type === "wms"}>
                <p key="wms-description">
                  <Trans i18nKey="description.wms">
                    This is a
                    <a
                      href="https://en.wikipedia.org/wiki/Web_Map_Service"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      WMS service
                    </a>
                    , which generates map images on request. It can be used in
                    GIS software with this URL:
                  </Trans>
                </p>
              </When>
              <When condition={catalogItem.type === "wfs"}>
                <p key="wfs-description">
                  <Trans i18nKey="description.wfs">
                    This is a{" "}
                    <a
                      href="https://en.wikipedia.org/wiki/Web_Feature_Service"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      WFS service
                    </a>
                    , which transfers raw spatial data on request. It can be
                    used in GIS software with this URL:
                  </Trans>
                </p>
              </When>
            </Choose>

            <Choose>
              <When condition={this.props.printView}>
                <code>{catalogItem.url}</code>
              </When>
              <Otherwise>
                <input
                  readOnly
                  className={Styles.field}
                  type="text"
                  value={catalogItem.url}
                  onClick={e => e.target.select()}
                />
              </Otherwise>
            </Choose>

            <Choose>
              <When
                condition={
                  catalogItem.type === "wms" ||
                  (catalogItem.type === "esri-mapServer" &&
                    defined(catalogItem.layers))
                }
              >
                <p key="wms-layers">
                  {t("description.layerName")}
                  {catalogItem.layers.split(",").length > 1 ? "s" : ""}:{" "}
                  {catalogItem.layers}
                </p>
              </When>
              <When condition={catalogItem.type === "wfs"}>
                <p key="wfs-typeNames">
                  {t("description.typeName")}
                  {catalogItem.typeNames.split(",").length > 1 ? "s" : ""}:{" "}
                  {catalogItem.typeNames}
                </p>
              </When>
            </Choose>
          </If>

          <If condition={catalogItem.metadataUrl}>
            <h4 className={Styles.h4}>{t("description.metadataUrl")}</h4>
            <p>
              <a
                href={catalogItem.metadataUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={Styles.link}
              >
                {catalogItem.metadataUrl}
              </a>
            </p>
          </If>

          <If
            condition={
              catalogItem.dataUrlType &&
              catalogItem.dataUrlType !== "none" &&
              catalogItem.dataUrl
            }
          >
            <h4 className={Styles.h4}>{t("description.dataUrl")}</h4>
            <p>
              <Choose>
                <When
                  condition={
                    catalogItem.dataUrlType.indexOf("wfs") === 0 ||
                    catalogItem.dataUrlType.indexOf("wcs") === 0
                  }
                >
                  {catalogItem.dataUrlType.indexOf("wfs") === 0 &&
                    t("description.useLinkBelow", {
                      link: (
                        <a
                          href="http://docs.geoserver.org/latest/en/user/services/wfs/reference.html"
                          target="_blank"
                          rel="noopener noreferrer"
                          key="wfs"
                        >
                          Web Feature Service (WFS) documentation
                        </a>
                      )
                    })}
                  {catalogItem.dataUrlType.indexOf("wcs") === 0 &&
                    t("description.useLinkBelow", {
                      link: (
                        <a
                          href="http://docs.geoserver.org/latest/en/user/services/wcs/reference.html"
                          target="_blank"
                          rel="noopener noreferrer"
                          key="wms"
                        >
                          Web Coverage Service (WCS) documentation
                        </a>
                      )
                    })}
                  <br />
                  <Link url={catalogItem.dataUrl} text={catalogItem.dataUrl} />
                </When>
                <When
                  condition={
                    dataUrlType === "data-uri" || dataUrlType === "local"
                  }
                >
                  <If condition={hasDataUriCapability}>
                    <Link
                      url={dataUri}
                      text={t("description.downloadInFormat", {
                        format: dataUriFormat.toUpperCase()
                      })}
                      download={getBetterFileName(
                        dataUrlType,
                        catalogItem.name,
                        dataUriFormat
                      )}
                    />
                  </If>
                  <If condition={!hasDataUriCapability}>
                    {t("description.downloadNotSupported")}
                  </If>
                </When>
                <Otherwise>
                  {t("description.useTheLinkToDownload")}
                  <br />
                  {catalogItem.dataUrl.startsWith("data:") && (
                    <Link
                      url={catalogItem.dataUrl}
                      text={t("description.downloadData")}
                    />
                  )}
                  {!catalogItem.dataUrl.startsWith("data:") && (
                    <Link
                      url={catalogItem.dataUrl}
                      text={catalogItem.dataUrl}
                    />
                  )}
                </Otherwise>
              </Choose>
            </p>
          </If>

          <If
            condition={!this.props.printView && defined(catalogItem.metadata)}
          >
            {/*
                            // By default every catalog item has an error message here, so better to ignore it.
                        <If condition={defined(catalogItem.metadata.dataSourceErrorMessage)}>
                            <div className={Styles.error}>
                                Error loading data source details: {catalogItem.metadata.dataSourceErrorMessage}
                            </div>
                        </If>
                        */}
            <If
              condition={
                defined(catalogItem.metadata.dataSourceMetadata) &&
                catalogItem.metadata.dataSourceMetadata.items.length > 0
              }
            >
              <div className={Styles.metadata}>
                <Collapsible
                  title={t("description.dataSourceDetails")}
                  isInverse={true}
                >
                  <MetadataTable
                    metadataItem={catalogItem.metadata.dataSourceMetadata}
                  />
                </Collapsible>
              </div>
            </If>

            {/*
                        <If condition={defined(catalogItem.metadata.serviceErrorMessage)}>
                            <div className={Styles.error}>
                                Error loading data service details: {catalogItem.metadata.serviceErrorMessage}
                            </div>
                        </If>
                        */}
            <If
              condition={
                defined(catalogItem.metadata.dataSourceMetadata) &&
                catalogItem.metadata.dataSourceMetadata.items.length > 0
              }
            >
              <div className={Styles.metadata}>
                <Collapsible
                  title={t("description.dataServiceDetails")}
                  isInverse={true}
                >
                  <MetadataTable
                    metadataItem={catalogItem.metadata.serviceMetadata}
                  />
                </Collapsible>
              </div>
            </If>
          </If>
        </If>
      </div>
    );
  }
});

/**
 * Read the format from the start of a data uri, eg. data:attachment/csv,...
 * @param  {String} dataUri The data URI.
 * @return {String} The format string, eg. 'csv', or undefined if none found.
 */
function getDataUriFormat(dataUri) {
  if (defined(dataUri)) {
    const slashIndex = dataUri.indexOf("/");
    const commaIndex = dataUri.indexOf(",");
    // Don't look into the data itself. Assume the format is somewhere in the first 40 chars.
    if (slashIndex < commaIndex && commaIndex < 40) {
      return dataUri.slice(slashIndex + 1, commaIndex);
    }
  }
}

/**
 * Return a nicer filename for this file.
 * @private
 */
function getBetterFileName(dataUrlType, itemName, format) {
  let name = itemName;
  const extension = "." + format;
  // Only add the extension if it's not already there.
  if (name.indexOf(extension) !== name.length - extension.length) {
    name = name + extension;
  }
  // For local files, the file already exists on the user's computer with the original name, so give it a modified name.
  if (dataUrlType === "local") {
    name = "processed " + name;
  }
  return name;
}

const Link = createReactClass({
  displayName: "Link",
  mixins: [ObserveModelMixin],

  propTypes: {
    url: PropTypes.string.isRequired,
    text: PropTypes.string.isRequired,
    download: PropTypes.string
  },

  render() {
    return (
      <a
        href={this.props.url}
        className={Styles.link}
        download={this.props.download}
        target="_blank"
        rel="noopener noreferrer"
      >
        {this.props.text}
      </a>
    );
  }
});

export default withTranslation()(Description);
