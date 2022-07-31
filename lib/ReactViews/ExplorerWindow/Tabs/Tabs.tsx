import { runInAction } from "mobx";
import { observer } from "mobx-react";
import React, { FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import styled, { useTheme } from "styled-components";
import defined from "terriajs-cesium/Source/Core/defined";
import { DataCatalogTab } from "./DataCatalogTab/DataCatalogTab";
import { MyDataTab } from "./MyDataTab/MyDataTab";
import { RawButton } from "../../../Styled/Button";
import Box from "../../../Styled/Box";
import { TextSpan } from "../../../Styled/Text";
import Terria from "../../../Models/Terria";
import ViewState from "../../../ReactViewModels/ViewState";
import Ul, { Li } from "../../../Styled/List";
import GroupMixin from "../../../ModelMixins/GroupMixin";
import CatalogMemberMixin from "../../../ModelMixins/CatalogMemberMixin";
import { BaseModel } from "../../../Models/Definition/Model";
import MappableMixin from "../../../ModelMixins/MappableMixin";

interface ITabsProps {
  viewState: ViewState;
  onClose: () => void;
}

export const Tabs: FC<ITabsProps> = observer(({ viewState, onClose }) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const [tabs, setTabs] = useState<any[]>([]);

  const { terria } = viewState;

  useEffect(() => {
    const myDataTab = {
      title: "my-data",
      name: t("addData.myData"),
      category: "my-data",
      panel: (
        <MyDataTab
          viewState={viewState}
          onFileAddFinished={onFileAddFinished}
        />
      )
    };

    if (terria.configParameters.tabbedCatalog) {
      setTabs(
        ([] as any[]).concat(
          terria.catalog.group.memberModels
            .filter(
              member =>
                member !== terria.catalog.userAddedDataGroup &&
                CatalogMemberMixin.isMixedInto(member)
            )
            .map((member, i) => ({
              //@ts-ignore
              name: member.nameInCatalog,
              //@ts-ignore
              title: `data-catalog-${member.name}`,
              category: "data-catalog",
              idInCategory: member.uniqueId,
              panel: (
                <DataCatalogTab
                  terria={terria}
                  viewState={viewState}
                  items={
                    GroupMixin.isMixedInto(member)
                      ? member.memberModels
                      : [member]
                  }
                  searchPlaceholder={t("addData.searchPlaceholderWhole")}
                />
              )
            })),
          [myDataTab]
        )
      );
      return;
    } else {
      setTabs([
        {
          name: t("addData.dataCatalogue"),
          title: "data-catalog",
          category: "data-catalog",
          panel: (
            <DataCatalogTab
              terria={terria}
              viewState={viewState}
              items={terria.catalog.group.memberModels}
              searchPlaceholder={t("addData.searchPlaceholder")}
            />
          )
        },
        myDataTab
      ]);
    }
  }, []);

  const onFileAddFinished = async (files: BaseModel[]) => {
    const file = (files.find(f =>
      MappableMixin.isMixedInto(f)
    ) as unknown) as MappableMixin.Instance;
    if (file) {
      const result = await viewState.viewCatalogMember(file);
      if (result.error) {
        result.raiseError(terria);
      } else {
        terria.currentViewer.zoomTo(file, 1);
      }
    }
    viewState.myDataIsUploadView = false;
  };

  const activateTab = async (category: string, idInCategory: string) => {
    runInAction(() => {
      viewState.activeTabCategory = category;
      if (terria.configParameters.tabbedCatalog) {
        viewState.activeTabIdInCategory = idInCategory;
        if (category === "data-catalog") {
          const member = terria.catalog.group.memberModels.filter(
            m => m.uniqueId === idInCategory
          )[0];
          // If member was found and member can be opened, open it (causes CkanCatalogGroups to fetch etc.)
          if (defined(member)) {
            viewState.viewCatalogMember(member);
          }
        }
      }
    });
  };

  const sameCategory = tabs.filter(
    t => t.category === viewState.activeTabCategory
  );
  const currentTab =
    sameCategory.filter(
      t => t.idInCategory === viewState.activeTabIdInCategory
    )[0] ||
    sameCategory[0] ||
    tabs[0];

  return (
    <Box flex="1" column>
      <Box
        fullWidth
        justifySpaceBetween
        backgroundColor={theme.colorPrimary}
        paddedRatio={2}
        css={`
          border-radius: ${theme.radiusLarge} ${theme.radiusLarge} 0 0;
        `}
      >
        <Ul role="tablist" gap={2}>
          {tabs.map((item, i) => (
            <Li
              key={i}
              id={"tablist--" + item.title}
              role="tab"
              aria-controls={"panel--" + item.title}
              aria-selected={item === currentTab}
              css={`
                display: flex;
              `}
            >
              <ButtonTab
                type="button"
                onClick={() => activateTab(item.category, item.idInCategory)}
                isCurrent={item === currentTab}
              >
                {item.name}
              </ButtonTab>
            </Li>
          ))}
        </Ul>
        <DoneButton
          type="button"
          onClick={onClose}
          title={t("addData.closeDataPanel")}
          data-target="close-modal"
        >
          <TextSpan textLight bold medium>
            {t("addData.done")}
          </TextSpan>{" "}
        </DoneButton>
      </Box>

      <Section
        key={currentTab?.title}
        id={"panel--" + currentTab?.title}
        aria-labelledby={"tablist--" + currentTab?.title}
        role="tabpanel"
      >
        {currentTab?.panel}
      </Section>
    </Box>
  );
});

const Section = styled(Box).attrs(props => ({
  as: "section",
  fullWidth: true,
  styledHeight: props.theme.modalContentHeight,
  backgroundColor: props.theme.modalBg
}))``;

const ButtonTab = styled(RawButton)<{ isCurrent: boolean }>`
  ${props => `
    line-height: 20px;
    background: transparent;
    color: ${props.theme.textLight};
    padding: 5px;
    border-radius: ${props.theme.radiusLarge};
    &:hover,
    &:focus {
      background: ${props.theme.textLight};
      color: ${props.theme.colorPrimary};
    }
    ${props.isCurrent &&
      `
      background: ${props.theme.textLight};
      color: ${props.theme.colorPrimary};
    `}

  `}
`;

const DoneButton = styled(RawButton)`
  line-height: 20px;
  padding: 3px 10px;
  border: 2px solid ${props => props.theme.textLight};
  border-radius: ${props => props.theme.radiusLarge};
`;
