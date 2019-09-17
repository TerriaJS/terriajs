import React from "react";

import createReactClass from "create-react-class";

import PropTypes from "prop-types";

import defined from "terriajs-cesium/Source/Core/defined";

import Collapsible from "../Custom/Collapsible/Collapsible";
import DataPreviewSections from "./DataPreviewSections";
import DataUri from "../../Core/DataUri";
import MetadataTable from "./MetadataTable";
import parseCustomMarkdownToReact from "../Custom/parseCustomMarkdownToReact";
import Styles from "./mappable-preview.scss";
import { observer } from "mobx-react";

/**
 * CatalogItem description.
 */
const Description = observer(
  createReactClass({
    displayName: "Description",

    propTypes: {
      item: PropTypes.object.isRequired,
      printView: PropTypes.bool
    },

    render() {
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
              <h4 className={Styles.h4}>Description</h4>
              {parseCustomMarkdownToReact(catalogItem.description, {
                catalogItem: catalogItem
              })}
            </div>
          </If>

          <If condition={catalogItem.dataUrlType === "local"}>
            <p>
              This file only exists in your browser. To share it, you must load
              it onto a public web server.
            </p>
          </If>

          <If
            condition={
              catalogItem.dataUrlType !== "local" && !catalogItem.hasDescription
            }
          >
            <p>
              Please contact the provider of this data for more information,
              including information about usage rights and constraints.
            </p>
          </If>

          <DataPreviewSections metadataItem={catalogItem} />

          <If
            condition={
              catalogItem.dataCustodian && catalogItem.dataCustodian.length > 0
            }
          >
            <div>
              <h4 className={Styles.h4}>Data Custodian</h4>
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
                    This is a{" "}
                    <a
                      href="https://en.wikipedia.org/wiki/Web_Map_Service"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      WMS service
                    </a>
                    , which generates map images on request. It can be used in
                    GIS software with this URL:
                  </p>
                </When>
                <When condition={catalogItem.type === "wfs"}>
                  <p key="wfs-description">
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
                    Layer name
                    {(catalogItem.layers || "").split(",").length > 1
                      ? "s"
                      : ""}
                    : {catalogItem.layers}
                  </p>
                </When>
                <When condition={catalogItem.type === "wfs"}>
                  <p key="wfs-typeNames">
                    Type name
                    {(catalogItem.typeNames || "").split(",").length > 1
                      ? "s"
                      : ""}
                    : {catalogItem.typeNames}
                  </p>
                </When>
              </Choose>
            </If>

            <If condition={catalogItem.metadataUrl}>
              <h4 className={Styles.h4}>Metadata URL</h4>
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
              <h4 className={Styles.h4}>Data URL</h4>
              <p>
                <Choose>
                  <When
                    condition={
                      catalogItem.dataUrlType.indexOf("wfs") === 0 ||
                      catalogItem.dataUrlType.indexOf("wcs") === 0
                    }
                  >
                    Use the link below to download the data. See the{" "}
                    {catalogItem.dataUrlType.indexOf("wfs") === 0 && (
                      <a
                        href="http://docs.geoserver.org/latest/en/user/services/wfs/reference.html"
                        target="_blank"
                        rel="noopener noreferrer"
                        key="wfs"
                      >
                        Web Feature Service (WFS) documentation
                      </a>
                    )}
                    {catalogItem.dataUrlType.indexOf("wcs") === 0 && (
                      <a
                        href="http://docs.geoserver.org/latest/en/user/services/wcs/reference.html"
                        target="_blank"
                        rel="noopener noreferrer"
                        key="wms"
                      >
                        Web Coverage Service (WCS) documentation
                      </a>
                    )}{" "}
                    for more information on customising URL query parameters.
                    <br />
                    <Link
                      url={catalogItem.dataUrl}
                      text={catalogItem.dataUrl}
                    />
                  </When>
                  <When
                    condition={
                      dataUrlType === "data-uri" || dataUrlType === "local"
                    }
                  >
                    <If condition={hasDataUriCapability}>
                      <Link
                        url={dataUri}
                        text={
                          "Download the currently selected data in " +
                          dataUriFormat.toUpperCase() +
                          " format"
                        }
                        download={getBetterFileName(
                          dataUrlType,
                          catalogItem.name,
                          dataUriFormat
                        )}
                      />
                    </If>
                    <If condition={!hasDataUriCapability}>
                      Unfortunately your browser does not support the
                      functionality needed to download this data as a file.
                      Please use Chrome, Firefox or Safari to download this
                      data.
                    </If>
                  </When>
                  <Otherwise>
                    Use the link below to download the data directly.
                    <br />
                    <Link
                      url={catalogItem.dataUrl}
                      text={catalogItem.dataUrl}
                    />
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
                  <Collapsible title="Data Source Details" isInverse={true}>
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
                  <Collapsible title="Data Service Details" isInverse={true}>
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
  })
);

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

const Link = observer(
  createReactClass({
    displayName: "Link",

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
  })
);

export default Description;
