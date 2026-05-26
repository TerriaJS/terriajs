import { observer } from "mobx-react";
import React, { useEffect, useState } from "react";
import { runInAction } from "mobx";
import { BaseModel } from "../../../Models/Definition/Model";
import Box from "../../../Styled/Box";
import Select from "../../../Styled/Select";
import styled from "styled-components";
import Text, { TextSpan } from "../../../Styled/Text";
import Spacing from "../../../Styled/Spacing";
import QueryableCatalogItemMixin from "../../../ModelMixins/QueryableCatalogItemMixin";
import Input from "../../../Styled/Input";
import { GLYPHS, StyledIcon } from "../../../Styled/Icon";
import Button, { RawButton } from "../../../Styled/Button";
import Hr from "../../../Styled/Hr";
import ViewState from "../../../ReactViewModels/ViewState";
import { RER_POI_CATALOG_ITEM_TYPE } from "../../../ModelMixins/RerPoiHelpers";

interface PropsType {
  item: BaseModel;
  viewState: ViewState;
}

const FilterFeaturesSection: React.FC<PropsType> = observer(
  ({ item, viewState }: PropsType) => {
    const [showQuerySection, setShowQuerySection] = useState<boolean>(false);
    const isRerPoiCatalogItem = item.type === RER_POI_CATALOG_ITEM_TYPE;

    const toggleQuerySection = () => {
      setShowQuerySection((prevState) => !prevState);
    };

    useEffect(() => {
      if (
        showQuerySection &&
        item &&
        QueryableCatalogItemMixin.isMixedInto(item) &&
        item.queryableProperties &&
        item.queryableProperties.length &&
        !item.queryValues
      ) {
        item.initQueryValues();
      }
    }, [showQuerySection, item]);

    /*useEffect(() => {
      return () => {
        if (QueryableCatalogItemMixin.isMixedInto(item) && !item.queryValues) {
          item.resetQueryValues();
        }
      };
    }, []);*/

    if (
      !QueryableCatalogItemMixin.isMixedInto(item) ||
      !item.queryableProperties ||
      item.queryableProperties.length === 0
    )
      return null;

    const queryableItem = item as QueryableCatalogItemMixin.Instance;

    return (
      <Box column>
        <MydHr borderBottomColor="lightGray" />
        <RawButton
          onClick={toggleQuerySection}
          css={`
            display: flex;
            align-items: center;
          `}
        >
          <TextSpan
            fullWidth
            medium
            css={`
              display: flex;
            `}
          >
            Filtro
          </TextSpan>
          {showQuerySection ? (
            <AdvanceOptionsIcon glyph={GLYPHS.opened} />
          ) : (
            <AdvanceOptionsIcon glyph={GLYPHS.closed} />
          )}
        </RawButton>
        {showQuerySection && item.queryValues && item.queryProperties && (
          <>
            <Spacing bottom={3} />
            <Box displayInlineBlock fullWidth>
              {Object.entries(item.queryProperties)
                .filter(([_, property]) => {
                  return !(
                    property.sumOnAggregation ||
                    property.distributionOnAggregation
                  );
                })
                .map(([propertyName, property]) => {
                  const enumValues = (
                    queryableItem.enumValues?.[propertyName] ?? []
                  )
                    .slice()
                    .sort();
                  const enumRows = queryableItem.queryValues?.[
                    propertyName
                  ] ?? [""];

                  return (
                    <Box key={propertyName} styledMargin="0 0 10px 0">
                      <StyledLabel small htmlFor="opacity">
                        {property.label}
                      </StyledLabel>
                      <Spacing right={3} />
                      {property.type === "enum" && isRerPoiCatalogItem && (
                        <Box column>
                          {enumRows.map((rowValue, rowIndex) => {
                            const selectedValue =
                              rowValue.trim().length > 0
                                ? rowValue
                                : queryableItem.ENUM_ALL_VALUE;
                            const isLastRow = rowIndex === enumRows.length - 1;
                            const showAddButton =
                              isLastRow &&
                              selectedValue !== queryableItem.ENUM_ALL_VALUE;
                            const showRemoveButton = rowIndex > 0;

                            return (
                              <Box
                                key={`${propertyName}-${rowIndex}`}
                                styledMargin={
                                  rowIndex < enumRows.length - 1
                                    ? "0 0 8px 0"
                                    : "0"
                                }
                                style={{
                                  display: "flex",
                                  alignItems: "center"
                                }}
                              >
                                <Select
                                  boxProps={{
                                    fullWidth: false,
                                    flex: 1,
                                    styledMinWidth: "0"
                                  }}
                                  name={`${propertyName}-${rowIndex}`}
                                  value={selectedValue}
                                  onChange={(
                                    e: React.ChangeEvent<HTMLSelectElement>
                                  ) => {
                                    runInAction(() => {
                                      const nextValues = enumRows.slice();
                                      nextValues[rowIndex] =
                                        e.target.value ===
                                        queryableItem.ENUM_ALL_VALUE
                                          ? ""
                                          : e.target.value;
                                      item.setQuery(propertyName, nextValues);
                                    });
                                  }}
                                >
                                  {enumValues.map((value) => {
                                    return (
                                      <option key={value} value={value}>
                                        {value}
                                      </option>
                                    );
                                  })}
                                </Select>
                                {(showAddButton || showRemoveButton) && (
                                  <Box
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      marginLeft: "6px"
                                    }}
                                  >
                                    {showAddButton && (
                                      <Button
                                        primary
                                        title="Aggiungi un altro filtro della stessa categoria"
                                        css={`
                                          min-width: 32px;
                                          height: 34px;
                                          border-radius: 2px;
                                          padding: 0 8px;
                                          display: flex;
                                          align-items: center;
                                          justify-content: center;
                                          font-weight: bold;
                                        `}
                                        onClick={() =>
                                          runInAction(() => {
                                            item.setQuery(propertyName, [
                                              ...enumRows,
                                              ""
                                            ]);
                                          })
                                        }
                                      >
                                        +
                                      </Button>
                                    )}
                                    {showRemoveButton && (
                                      <Button
                                        primary
                                        title="Rimuovi questo filtro"
                                        css={`
                                          min-width: 32px;
                                          height: 34px;
                                          border-radius: 2px;
                                          padding: 0 8px;
                                          display: flex;
                                          align-items: center;
                                          justify-content: center;
                                          font-weight: bold;
                                          margin-left: ${showAddButton
                                            ? "6px"
                                            : "0"};
                                        `}
                                        onClick={() =>
                                          runInAction(() => {
                                            const nextValues = enumRows.slice();
                                            nextValues.splice(rowIndex, 1);
                                            item.setQuery(
                                              propertyName,
                                              nextValues.length > 0
                                                ? nextValues
                                                : [""]
                                            );
                                          })
                                        }
                                      >
                                        -
                                      </Button>
                                    )}
                                  </Box>
                                )}
                              </Box>
                            );
                          })}
                        </Box>
                      )}
                      {property.type === "enum" && !isRerPoiCatalogItem && (
                        <Select
                          name={propertyName}
                          value={item.queryValues?.[propertyName]?.[0]}
                          onChange={(
                            e: React.ChangeEvent<HTMLSelectElement>
                          ) => {
                            runInAction(() => {
                              item.setQuery(propertyName, [e.target.value]);
                            });
                          }}
                        >
                          {enumValues.map((value) => {
                            return (
                              <option key={value} value={value}>
                                {value}
                              </option>
                            );
                          })}
                        </Select>
                      )}
                      {(property.type === "string" ||
                        property.type === "number") && (
                        <Input
                          type="text"
                          id="name"
                          name="name"
                          value={item.queryValues?.[propertyName]?.[0]}
                          onChange={(
                            e: React.ChangeEvent<HTMLInputElement>
                          ) => {
                            runInAction(() => {
                              item.setQuery(propertyName, [e.target.value]);
                            });
                          }}
                        />
                      )}
                      {property.type === "date" && (
                        <Box column>
                          <Input
                            type="date"
                            id="start"
                            name="trip-start"
                            value={item.queryValues?.[propertyName]?.[0]}
                            onChange={(
                              e: React.ChangeEvent<HTMLInputElement>
                            ) => {
                              runInAction(() => {
                                const oldValue =
                                  item.queryValues?.[propertyName];
                                if (oldValue) {
                                  item.setQuery(propertyName, [
                                    e.target.value,
                                    oldValue[1]
                                  ]);
                                }
                              });
                            }}
                          />
                          <Input
                            type="date"
                            id="end"
                            name="trip-end"
                            value={item.queryValues?.[propertyName]?.[1]}
                            onChange={(
                              e: React.ChangeEvent<HTMLInputElement>
                            ) => {
                              runInAction(() => {
                                const oldValue =
                                  item.queryValues?.[propertyName];
                                if (oldValue) {
                                  item.setQuery(propertyName, [
                                    oldValue[0],
                                    e.target.value
                                  ]);
                                }
                              });
                            }}
                          />
                        </Box>
                      )}
                    </Box>
                  );
                })}
            </Box>
            <Spacing bottom={3} />
            <StyledLabel small htmlFor="opacity">
              {item.numberOfVisibleElements === item.numberOfTotalElements ||
              !item.numberOfVisibleElements
                ? `Numero di elementi: ${item.numberOfTotalElements}`
                : `Numero di elementi filtrati: ${item.numberOfVisibleElements} (su ${item.numberOfTotalElements})`}
            </StyledLabel>
            <Spacing bottom={3} />
            <Box style={{ display: "flex", flexDirection: "row-reverse" }}>
              {viewState.terria.isFeatureAllowedByProfile("QueryData") &&
                !viewState.useSmallScreenInterface &&
                item.type !== RER_POI_CATALOG_ITEM_TYPE && (
                  <Button
                    primary
                    title="Mostra i dati come grafici e tabelle"
                    css={`
                      width: 14px;
                      border-radius: 2px;
                      margin: 2px;
                    `}
                    onClick={() =>
                      runInAction(() => viewState.openQueryData(item))
                    }
                  >
                    <StyledIcon
                      light
                      glyph={GLYPHS.chartTable}
                      styledWidth="30px"
                    />
                  </Button>
                )}
              <Button
                primary
                title="Cancella i filtri"
                css={`
                  width: 14px;
                  border-radius: 2px;
                  margin: 2px;
                `}
                onClick={() => runInAction(() => item.cleanQueryValues())}
              >
                <StyledIcon light glyph={GLYPHS.cancel} styledWidth="18px" />
              </Button>
            </Box>
          </>
        )}
        <MydHr borderBottomColor="lightGray" />
      </Box>
    );
  }
);

const StyledLabel = styled(Text).attrs({ as: "label" })<{ htmlFor: string }>`
  white-space: nowrap;
  flex-basis: 50%;
`;

const AdvanceOptionsIcon = styled(StyledIcon).attrs({
  styledWidth: "10px",
  light: true
})``;

const MydHr = styled(Hr).attrs(() => ({
  size: 1
}))`
  margin: 10px -10px;
`;

export default FilterFeaturesSection;
