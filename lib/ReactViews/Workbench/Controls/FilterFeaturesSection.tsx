import { observer } from "mobx-react";
import React, { useEffect, useState, useRef } from "react";
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
import Checkbox from "../../../Styled/Checkbox";

interface PropsType {
  item: BaseModel;
  viewState: ViewState;
}

const FilterFeaturesSection: React.FC<PropsType> = observer(
  ({ item, viewState }: PropsType) => {
    const [showQuerySection, setShowQuerySection] = useState<boolean>(false);
    const [openSelectDropdown, setOpenSelectDropdown] = useState<string | null>(
      null
    );
    const dropdownRef = useRef<HTMLDivElement>(null);

    const isRerPoiCatalogItem = item.type === RER_POI_CATALOG_ITEM_TYPE;

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node)
        ) {
          setOpenSelectDropdown(null);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, []);

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
                        <Box
                          column
                          position="relative"
                          style={{ flex: 1 }}
                          ref={
                            openSelectDropdown === propertyName
                              ? dropdownRef
                              : undefined
                          }
                        >
                          <Button
                            css={`
                              background: ${(p: any) => p.theme.darkLighter};
                              border: 1px solid ${(p: any) => p.theme.dark};
                              border-radius: 2px;
                              color: ${(p: any) => p.theme.textLight};
                              display: flex;
                              align-items: center;
                              min-height: 34px;
                              padding: 5px 10px;
                              text-align: left;
                              justify-content: space-between;
                              width: 100%;
                            `}
                            onClick={() =>
                              setOpenSelectDropdown(
                                openSelectDropdown === propertyName
                                  ? null
                                  : propertyName
                              )
                            }
                          >
                            <TextSpan>
                              {enumRows.filter(
                                (v: string) =>
                                  v &&
                                  v !== queryableItem.ENUM_ALL_VALUE &&
                                  v.toLowerCase() !== "--tutto" &&
                                  v.toLowerCase() !== "--tutti"
                              ).length > 0
                                ? `${
                                    enumRows.filter(
                                      (v: string) =>
                                        v &&
                                        v !== queryableItem.ENUM_ALL_VALUE &&
                                        v.toLowerCase() !== "--tutto" &&
                                        v.toLowerCase() !== "--tutti"
                                    ).length
                                  } selezionati`
                                : "Tutti"}
                            </TextSpan>
                            <StyledIcon
                              glyph={
                                openSelectDropdown === propertyName
                                  ? GLYPHS.opened
                                  : GLYPHS.closed
                              }
                              styledWidth="10px"
                              light
                            />
                          </Button>

                          {openSelectDropdown === propertyName && (
                            <Box
                              column
                              css={`
                                position: absolute;
                                top: 100%;
                                left: 0;
                                min-width: 100%;
                                width: max-content;
                                z-index: 99;
                                background: ${(p: any) => p.theme.darkLighter};
                                border: 1px solid ${(p: any) => p.theme.dark};
                                max-height: 250px;
                                overflow-y: auto;
                                margin-top: 2px;
                                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
                                border-radius: 2px;
                              `}
                            >
                              {enumValues.map((value) => {
                                const isAllValue =
                                  value === queryableItem.ENUM_ALL_VALUE ||
                                  value.toLowerCase() === "--tutto" ||
                                  value.toLowerCase() === "--tutti";
                                const hasActiveFilters =
                                  enumRows.filter(
                                    (v: string) =>
                                      v &&
                                      v !== queryableItem.ENUM_ALL_VALUE &&
                                      v.toLowerCase() !== "--tutto" &&
                                      v.toLowerCase() !== "--tutti"
                                  ).length > 0;

                                const isChecked = isAllValue
                                  ? !hasActiveFilters
                                  : enumRows.includes(value);

                                return (
                                  <Box
                                    key={value}
                                    css={`
                                      padding: 0;
                                      &:hover {
                                        background: ${(p: any) =>
                                          p.theme.colorPrimary};
                                      }
                                    `}
                                  >
                                    <Checkbox
                                      title={value}
                                      isChecked={isChecked}
                                      onChange={() => {
                                        runInAction(() => {
                                          if (isAllValue) {
                                            item.setQuery(propertyName, [""]);
                                          } else {
                                            const nextValues = new Set(
                                              enumRows.filter(
                                                (v: string) =>
                                                  v &&
                                                  v !==
                                                    queryableItem.ENUM_ALL_VALUE &&
                                                  v.toLowerCase() !==
                                                    "--tutto" &&
                                                  v.toLowerCase() !== "--tutti"
                                              )
                                            );
                                            if (isChecked) {
                                              nextValues.delete(value);
                                            } else {
                                              nextValues.add(value);
                                            }
                                            const valuesArr =
                                              Array.from(nextValues);
                                            item.setQuery(
                                              propertyName,
                                              valuesArr.length > 0
                                                ? valuesArr
                                                : [""]
                                            );
                                          }
                                        });
                                      }}
                                      textProps={{
                                        css: `
                                          color: ${(p: any) =>
                                            p.theme.textLight};
                                          margin-left: 0;
                                          padding: 8px 10px;
                                          width: 100%;
                                        `
                                      }}
                                    >
                                      {value}
                                    </Checkbox>
                                  </Box>
                                );
                              })}
                            </Box>
                          )}
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
