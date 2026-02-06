import React, { useEffect, useState, useRef } from "react";
import { observer } from "mobx-react";
import DataTable, { TableColumn } from "react-data-table-component";
import QueryableCatalogItemMixin from "../../ModelMixins/QueryableCatalogItemMixin";
import { TabPropsType } from "./QueryWindow";
import { ConstantProperty } from "terriajs-cesium";
import CesiumResource from "terriajs-cesium/Source/Core/Resource";
import Box from "../../Styled/Box";
import Button from "../../Styled/Button";
import DataUri from "../../Core/DataUri";
import MappableMixin from "../../ModelMixins/MappableMixin";
import GeoJsonMixin from "../../ModelMixins/GeojsonMixin";
import { Geometry } from "@turf/helpers";

const QueryTabTable: React.FC<TabPropsType> = observer(
  ({ item, terria }: TabPropsType) => {
    const [columns, setColumns] = useState<TableColumn<Map<string, any>>[]>([]);
    const [data, setData] = useState<Map<string, any>[]>([]);

    const featureProperties = useRef<{ [key: string]: any }[]>();

    const downloadFile = (href: string, name: string) => {
      const link = document.createElement("a");
      link.href = href;
      link.download = name;
      link.click();
    };

    const exportTable = () => {
      const rows = [Array.from(data[0].keys()).join(",")];
      rows.push(...data.map((elem) => Array.from(elem.values()).join(",")));
      const csvString = rows.join("\n");
      const href = DataUri.make("csv", csvString);
      if (href) downloadFile(href, "download.csv");
    };

    const exportData = async () => {
      if (
        item &&
        MappableMixin.isMixedInto(item) &&
        GeoJsonMixin.isMixedInto(item) &&
        item.featureInfoTemplate.webServiceUrlProfileCheck
      ) {
        const proxiedUrl = terria.corsProxy.getURL(
          item.featureInfoTemplate.webServiceUrlProfileCheck
        );
        try {
          const result = await CesiumResource.fetchJson({
            url: proxiedUrl,
            queryParameters: {
              authToken: terria.userAuthToken
            }
          });

          if (result && result.status === 200) {
            const idList: string[] = result.ids;

            if (item.readyData?.features) {
              const filteredIdList = item
                .getFeaturePropertiesByName(["id", "show"])
                .filter((elem) => elem.show === true)
                .map((elem) => (elem.id as ConstantProperty).toString())
                .filter((elem) => idList.includes(elem));

              const filteredFeatures = item.readyData.features.filter(
                (elem) => {
                  return (
                    elem.properties &&
                    "id" in elem.properties &&
                    filteredIdList.includes(elem.properties["id"]) &&
                    elem.geometry.type === "Point"
                  );
                }
              );

              const output = JSON.stringify({
                type: "FeatureCollection",
                features: filteredFeatures
              });
              const jsonUri = DataUri.make("json", output);
              if (jsonUri) {
                downloadFile(jsonUri, "interventi.json");
              }

              if (filteredFeatures && filteredFeatures.length > 0) {
                const first = filteredFeatures[0];
                if (first.properties) {
                  const header = [
                    ...Object.keys(first.properties),
                    "lat",
                    "lon"
                  ].join(";");
                  const values = filteredFeatures.map((elem) =>
                    [
                      ...Object.values(elem.properties!),
                      (elem.geometry as Geometry).coordinates[1],
                      (elem.geometry as Geometry).coordinates[0]
                    ].join(";")
                  );
                  const rows = [header, ...values];

                  const csv = rows.join("\n");
                  const csvUri = DataUri.make("csv", csv);
                  if (csvUri) {
                    downloadFile(csvUri, "interventi.csv");
                  }
                }
              } else {
                const csvUri = DataUri.make("csv", "0 features\n");
                if (csvUri) {
                  downloadFile(csvUri, "interventi.csv");
                }
              }
            }
          } else {
            throw "Request failed";
          }
        } catch (error) {
          console.log(error);
          terria.userProfile = "undefined";
          terria.userAuthToken = undefined;
        }
      }
    };

    useEffect(() => {
      if (
        data &&
        item &&
        QueryableCatalogItemMixin.isMixedInto(item) &&
        item.queryProperties
      ) {
        const fields = Object.entries(item.queryProperties ?? {})
          .filter(([_, elem]) => {
            return elem.canAggregate || elem.sumOnAggregation;
          })
          .map(([key, elem]) => {
            return {
              key: key,
              label: elem.label,
              sumOnAggregation: elem.sumOnAggregation
            };
          });

        const currencyFormatter = new Intl.NumberFormat("it-IT", {
          style: "currency",
          currency: "EUR",
          maximumFractionDigits: 0
        });

        setColumns(
          fields?.map((field) => {
            return {
              name: field.label,
              selector: (row) => row.get(field.key),
              sortable: true,
              format: (row) => {
                return field.sumOnAggregation
                  ? currencyFormatter.format(row.get(field.key))
                  : row.get(field.key).toString();
              },
              right: field.sumOnAggregation
            };
          }) ?? []
        );
      }
    }, [data, item]);

    useEffect(() => {
      if (
        item &&
        QueryableCatalogItemMixin.isMixedInto(item) &&
        item.queryProperties
      ) {
        const featProps = item
          .getFeaturePropertiesByName(
            Object.entries(item.queryProperties)
              .filter(([_, elem]) => elem.canAggregate || elem.sumOnAggregation)
              .map(([key, _]) => key)
          )
          ?.filter((elem) => !!(elem.show as ConstantProperty).valueOf());

        if (featProps) {
          featureProperties.current = featProps;
          setData(
            featProps.map(
              (elem) => new Map<string, any>(Object.entries(elem))
            ) ?? []
          );
        }
      }
    }, [item]);

    return (
      <>
        <DataTable
          columns={columns}
          data={data}
          pagination
          paginationPerPage={15}
          paginationComponentOptions={{ noRowsPerPage: true }}
          dense
          striped
          highlightOnHover
        />
        {terria?.isFeatureAllowedByProfile("DownloadQueryData") && (
          <Box>
            <Button
              primary
              css={`
                width: 100px;
                border-radius: 2px;
                margin: 10px;
              `}
              onClick={exportTable}
            >
              Salva tabella
            </Button>
            <Button
              primary
              css={`
                width: 100px;
                border-radius: 2px;
                margin: 10px;
              `}
              onClick={exportData}
            >
              Esporta dati
            </Button>
          </Box>
        )}
      </>
    );
  }
);

export default QueryTabTable;
