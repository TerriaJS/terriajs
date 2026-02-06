import React, { useState, useEffect, useRef } from "react";
import { observer } from "mobx-react";
import html2canvas from "terriajs-html2canvas";
import Styles from "./query-tab-panel.scss";
import Box from "../../Styled/Box";
import QueryChart, { DataType } from "./QueryChart";
import QuerySelector from "./QuerySelector";
import Checkbox from "../../Styled/Checkbox";
import { ConstantProperty } from "terriajs-cesium";
import Button from "../../Styled/Button";
import { downloadImg } from "../Map/Panels/SharePanel/Print/PrintView";
import { SpacingSpan } from "../../Styled/Spacing";
import DataTable, { TableColumn } from "react-data-table-component";
import { TabPropsType } from "./QueryWindow";
import { useTranslation } from "react-i18next";

export enum ChartType {
  Pie = "queryTab.pie",
  BarV = "queryTab.verticalBars",
  BarH = "queryTab.horizontalBars",
  Pivot = "queryTab.pivotTable"
}

const defaultAggregationFunction = {
  key: "count",
  label: "queryTab.count",
  measureUnit: undefined,
  decimalPlaces: 0
};

const currencyFormatter = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR"
});

const QueryTabPanel: React.FC<TabPropsType> = observer(
  ({ item, terria }: TabPropsType) => {
    const { t } = useTranslation();
    const [aggregationProperty, setAggregationProperty] = useState<string>();
    const [aggregationFunction, setAggregationFunction] = useState<string>();
    const [distributionProperty, setDistributionProperty] = useState<string>();
    const [chartType, setChartType] = useState<ChartType>(ChartType.Pie);
    const [data, setData] = useState<DataType[]>();
    const [useHidden, setUseHidden] = useState<boolean>(false);
    const [randomNumber, setRandomNumber] = useState<number>(0);
    const [filterText, setFilterText] = useState<string[]>([]);
    const [columns, setColumns] = useState<TableColumn<DataType>[]>([]);

    const canvasRef = useRef<HTMLDivElement>(null);
    const aggregateFieldOptions = useRef<{ key: string; label: string }[]>();
    const aggregateFunctionOptions = useRef<
      {
        key: string;
        label: string;
        measureUnit?: string;
        decimalPlaces: number;
      }[]
    >();
    const featureProperties = useRef<{ [key: string]: any }[]>();

    useEffect(() => {
      if (item.queryProperties) {
        const featProps = item.getFeaturePropertiesByName(
          Object.entries(item.queryProperties)
            .filter(
              ([_, elem]) =>
                elem.canAggregate ||
                elem.sumOnAggregation ||
                elem.distributionOnAggregation
            )
            .map(([key, _]) => key)
        );

        if (featProps) {
          featureProperties.current = featProps;
        }

        const fields = Object.entries(item.queryProperties ?? {})
          .filter(([key, elem]) => {
            return (
              elem.canAggregate &&
              !item.queryValues?.[key].some(
                (val) => val && val !== "" && val !== item.ENUM_ALL_VALUE
              )
            );
          })
          .map(([key, elem]) => {
            return { key: key, label: elem.label };
          });
        aggregateFieldOptions.current = fields;
        if (!aggregationProperty) {
          setAggregationProperty(fields[0]?.key);
        }
        const functions = [
          ...[defaultAggregationFunction],
          ...Object.entries(item.queryProperties ?? {})
            .filter(([_, elem]) => elem.sumOnAggregation)
            .map(([key, elem]) => {
              return {
                key: key,
                label: `sum-${elem.label}`,
                measureUnit: elem.measureUnit,
                decimalPlaces: elem.decimalPlaces
              };
            })
        ];
        aggregateFunctionOptions.current = functions;
        if (!aggregationFunction) {
          setAggregationFunction(functions[0].key);
        }

        setDistributionProperty(
          Object.entries(item.queryProperties ?? {}).find(([_, elem]) => {
            return elem.distributionOnAggregation;
          })?.[0]
        );

        setFilterText(
          Object.entries(item.queryValues ?? {})
            .filter(([_, val]) =>
              val.some((elem) => elem !== "" && elem !== item.ENUM_ALL_VALUE)
            )
            .map(([key, val]) => {
              return `${item.queryProperties?.[key].label}: ${val}`;
            })
        );
      }
    }, [
      item,
      item.queryProperties,
      item.queryValues,
      aggregationProperty,
      aggregationFunction
    ]);

    useEffect(() => {
      if (
        featureProperties?.current &&
        aggregationProperty &&
        aggregationFunction
      ) {
        const functionIsCount =
          aggregationFunction === defaultAggregationFunction.key;
        const features = useHidden
          ? featureProperties.current
          : featureProperties.current.filter(
              (elem) => !!(elem.show as ConstantProperty).valueOf()
            );

        const distrib =
          !functionIsCount && distributionProperty
            ? item.queryProperties?.[
                distributionProperty
              ].dictionaryKeyProperties.find(
                (elem) => elem.queryProperty === aggregationProperty
              )
            : undefined;

        const percCount: { [key: string]: number } = {};
        const featuresPerClass: { [key: string]: number } = features.reduce(
          (obj, val) => {
            const name = val[aggregationProperty];

            if (distrib && distributionProperty) {
              const distribDictionary = val[distributionProperty][
                distrib.key
              ] as { [key: string]: any }[];
              distribDictionary.forEach((elem) => {
                const alias = elem[distrib.alias] as string;
                const distribution =
                  (elem[distrib.valueProperty] as number) * 0.01;
                obj[alias] =
                  (obj[alias] ?? 0) +
                  (functionIsCount ? 1 : val[aggregationFunction]) *
                    distribution;
              });
            } else if (Array.isArray(name)) {
              name.forEach((kk) => {
                obj[kk] =
                  (obj[kk] ?? 0) +
                  (functionIsCount ? 1 : val[aggregationFunction]);
                percCount[kk] = (percCount[kk] ?? 0) + 1 / name.length;
              });
            } else {
              obj[name] =
                (obj[name] ?? 0) +
                (functionIsCount ? 1 : val[aggregationFunction]);
              percCount[name] = (percCount[name] ?? 0) + 1;
            }
            return obj;
          },
          {}
        );

        const tot = functionIsCount
          ? features.length
          : Object.values(featuresPerClass).reduce((result, val) => {
              return result + val;
            });

        setData(
          Object.entries(featuresPerClass).map(([key, value]) => {
            return {
              name: key,
              value: value,
              valuePerc:
                Math.round(
                  ((functionIsCount ? percCount[key] : value) / tot +
                    Number.EPSILON) *
                    1000
                ) / 10
            };
          })
        );
      }
    }, [
      aggregationProperty,
      aggregationFunction,
      useHidden,
      distributionProperty,
      item.queryProperties
    ]);

    useEffect(() => {
      if (data && aggregationFunction && chartType) {
        const functionProperty =
          aggregationFunction !== defaultAggregationFunction.key
            ? item.queryProperties?.[aggregationFunction]
            : undefined;
        const measureUnit = functionProperty?.measureUnit ?? "";
        const decimalPlaces = functionProperty?.decimalPlaces ?? 0;

        setColumns([
          {
            name: "Categoria",
            selector: (row) => row.name,
            sortable: true
          },
          {
            name: "Valore",
            selector: (row) => row.value,
            sortable: true,
            format: (row) => {
              return measureUnit === "€"
                ? currencyFormatter.format(row.value)
                : `${measureUnit} ${row.value.toFixed(decimalPlaces)}`;
            },
            right: true
          },
          {
            name: "Percentuale",
            selector: (row) => row.valuePerc,
            sortable: true,
            format: (row) => `${row.valuePerc.toFixed(1)}%`,
            right: true
          }
        ]);
      }
    }, [
      aggregationFunction,
      aggregationProperty,
      chartType,
      data,
      item.queryProperties
    ]);

    const downloadScreenshot = () => {
      const promise = html2canvas(canvasRef.current, {});

      return promise
        .then((canvas: HTMLCanvasElement) => {
          return canvas.toDataURL("image/png");
        })
        .then((dataString: string) => {
          downloadImg(dataString, "chartScreenshot.png");
        });
    };

    const changeColors = () => {
      setRandomNumber(Math.random());
    };

    const renderControls = () => {
      if (
        !aggregateFieldOptions.current ||
        !aggregateFunctionOptions.current ||
        !aggregationProperty ||
        !aggregationFunction
      ) {
        return <h3>{t("queryTab.aggregationNotPossible")}</h3>;
      }

      return (
        <>
          <QuerySelector
            label="queryTab.aggregateBy"
            value={aggregationProperty}
            onSelect={(newValue) => {
              setAggregationProperty(newValue);
            }}
            options={aggregateFieldOptions.current}
          />
          <QuerySelector
            label="queryTab.represent"
            value={aggregationFunction}
            onSelect={(newValue) => {
              setAggregationFunction(newValue);
            }}
            options={aggregateFunctionOptions.current}
          />
          <QuerySelector
            label="queryTab.graphModel"
            value={chartType}
            onSelect={(newValue) => {
              setChartType(newValue as ChartType);
            }}
            options={Object.values(ChartType).map((val) => {
              return { key: val, label: val };
            })}
          />
          <Box styledMargin="12px 20px" style={{ display: "block" }}>
            {filterText.length > 0 && (
              <>
                {/*<br />
                <div>Filtri applicati:</div>
                {filterText.map((txt, index) => (
                  <div key={index}>&#x2022; {txt}</div>
                ))}
                <br />*/}
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <b>Ignora filtri</b>
                  <Checkbox
                    title={""}
                    isChecked={useHidden}
                    onChange={() => {
                      setUseHidden(!useHidden);
                    }}
                  />
                </div>
              </>
            )}
          </Box>
          <SpacingSpan bottom={/*filterText.length > 0 ? 10 : 20*/ 5} />
          {chartType !== ChartType.Pivot && (
            <Box styledMargin="12px 20px">
              <Button
                primary
                css={`
                  width: 100px;
                  border-radius: 2px;
                  margin: 5px;
                `}
                onClick={changeColors}
              >
                {t("queryTab.changeColors")}
              </Button>
              {terria?.isFeatureAllowedByProfile("DownloadQueryData") && (
                <Button
                  primary
                  css={`
                    width: 100px;
                    border-radius: 2px;
                    margin: 5px;
                  `}
                  onClick={downloadScreenshot}
                >
                  Download Screenshot
                </Button>
              )}
            </Box>
          )}
        </>
      );
    };

    const renderData = () => {
      if (data && aggregationProperty && item.queryProperties) {
        if (chartType !== ChartType.Pivot) {
          return (
            <QueryChart
              data={data}
              valueKey="value"
              valuePercKey="valuePerc"
              measureUnit={
                aggregationFunction &&
                aggregationFunction in item.queryProperties
                  ? item.queryProperties[aggregationFunction].measureUnit
                  : undefined
              }
              decimalPlaces={
                aggregationFunction &&
                aggregationFunction in item.queryProperties
                  ? item.queryProperties[aggregationFunction].decimalPlaces
                  : 0
              }
              chartType={chartType}
              randomNumber={randomNumber}
              filterText={filterText}
              useHidden={useHidden}
              ref={canvasRef}
            />
          );
        } else {
          return (
            <Box fullWidth column>
              <Box column fullWidth styledHeight="90%">
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
              </Box>
              <Box styledHeight="10%">
                {aggregationFunction !== defaultAggregationFunction.key && (
                  <h4>
                    Valore totale:{" "}
                    {currencyFormatter.format(
                      data.reduce(
                        (accumulator, current) => accumulator + current.value,
                        0
                      )
                    )}
                  </h4>
                )}
              </Box>
            </Box>
          );
        }
      }
    };

    return (
      <div className={Styles.root}>
        <Box fullHeight column>
          <Box fullHeight overflow="hidden">
            <Box className={Styles.dataExplorer} styledWidth="30%">
              {renderControls()}
            </Box>
            <Box styledWidth="70%" flexWrap>
              {renderData()}
            </Box>
          </Box>
        </Box>
      </div>
    );
  }
);

export default QueryTabPanel;
