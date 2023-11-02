import createReactClass from "create-react-class";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import React from "react";
import { Trans, withTranslation } from "react-i18next";
import defined from "terriajs-cesium/Source/Core/defined";
import Box from "../../Styled/Box";
import Button from "../../Styled/Button";
import Collapsible from "../Custom/Collapsible/Collapsible";
import parseCustomMarkdownToReact from "../Custom/parseCustomMarkdownToReact";
import DataPreviewSections from "./DataPreviewSections";
import ExportData from "./ExportData";
import Styles from "./mappable-preview.scss";
import MetadataTable from "./MetadataTable";
import WarningBox from "./WarningBox";

/**
 * CatalogItem description.
 */
const Description = observer(
  createReactClass({
    displayName: "Description",

    propTypes: {
      item: PropTypes.object.isRequired,
      printView: PropTypes.bool,
      t: PropTypes.func.isRequired
    },

    render() {
      const { t } = this.props;
      const catalogItem = this.props.item;

      // Make sure all data and metadata URLs have `url` set
      const metadataUrls = catalogItem.metadataUrls?.filter((m) => m.url);
      const dataUrls = catalogItem.dataUrls?.filter((m) => m.url);

      return (
        <div
          className={Styles.description}
          css={`
            a,
            a:visited {
              color: ${(p) => p.theme.colorPrimary};
            }
          `}
        >
          <If condition={catalogItem.isExperiencingIssues}>
            <WarningBox>{t("preview.mayBeExperiencingIssues")}</WarningBox>
          </If>

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

          <If condition={catalogItem.hasLocalData}>
            <p>{t("description.dataLocal")}</p>
          </If>

          <If
            condition={!catalogItem.hasLocalData && !catalogItem.hasDescription}
          >
            <p>{t("description.dataNotLocal")}</p>
          </If>

          <If condition={metadataUrls && metadataUrls.length > 0}>
            <h4 className={Styles.h4}>{t("description.metadataUrls")}</h4>
            <For each="metadataUrl" index="i" of={metadataUrls}>
              <Box paddedVertically key={metadataUrl.url}>
                <a
                  href={metadataUrl.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${Styles.link} description-metadataUrls`}
                  css={`
                    color: ${(p) => p.theme.colorPrimary};
                  `}
                >
                  <If condition={metadataUrl.title}>
                    <Button primary={true}>{metadataUrl.title}</Button>
                  </If>
                  <If condition={!metadataUrl.title}>{metadataUrl.url}</If>
                </a>
              </Box>
            </For>
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
                      This is a
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
                    onClick={(e) => e.target.select()}
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
                    {(catalogItem.layers || "").split(",").length > 1
                      ? "s"
                      : ""}
                    : {catalogItem.layers}
                  </p>
                </When>
                <When condition={catalogItem.type === "wfs"}>
                  <p key="wfs-typeNames">
                    {t("description.typeName")}
                    {(catalogItem.typeNames || "").split(",").length > 1
                      ? "s"
                      : ""}
                    : {catalogItem.typeNames}
                  </p>
                </When>
              </Choose>
            </If>

            <If condition={dataUrls && dataUrls.length > 0}>
              <h4 className={Styles.h4}>{t("description.dataUrl")}</h4>
              <For each="dataUrl" index="i" of={dataUrls}>
                <Choose>
                  <When
                    condition={
                      dataUrl.type?.startsWith("wfs") ||
                      dataUrl.type?.startsWith("wcs")
                    }
                  >
                    {dataUrl.type?.startsWith("wfs") &&
                      parseCustomMarkdownToReact(
                        t("description.useLinkBelow", {
                          link: `
                          <a
                            href="http://docs.geoserver.org/latest/en/user/services/wfs/reference.html"
                            target="_blank"
                            rel="noopener noreferrer"
                            key="wfs"
                          >
                            Web Feature Service (WFS) documentation
                          </a>
                        `
                        })
                      )}
                    {dataUrl.type?.startsWith("wcs") &&
                      parseCustomMarkdownToReact(
                        t("description.useLinkBelow", {
                          link: `
                          <a
                            href="http://docs.geoserver.org/latest/en/user/services/wcs/reference.html"
                            target="_blank"
                            rel="noopener noreferrer"
                            key="wms"
                          >
                            Web Coverage Service (WCS) documentation
                          </a>
                        `
                        })
                      )}
                  </When>
                </Choose>
                <Box paddedVertically key={dataUrl.url}>
                  <a
                    href={dataUrl.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${Styles.link} description-dataUrls`}
                    css={`
                      color: ${(p) => p.theme.colorPrimary};
                    `}
                  >
                    <If condition={dataUrl.title}>
                      <Button primary={true}>{dataUrl.title}</Button>
                    </If>
                    <If condition={!dataUrl.title}>{dataUrl.url}</If>
                  </a>
                </Box>
              </For>
            </If>

            <If
              condition={!this.props.printView && defined(catalogItem.metadata)}
            >
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
          {!this.props.printView ? (
            <ExportData item={catalogItem}></ExportData>
          ) : null}
        </div>
      );
    }
  })
);

export default withTranslation()(Description);
