import React, { FC } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components";

import {
  ILocalDataType,
  IRemoteDataType
} from "../../../../../Core/getDataType";
import ViewState from "../../../../../ReactViewModels/ViewState";
import Icon from "../../../../../Styled/Icon";

import { BaseModel } from "../../../../../Models/Definition/Model";
import Styles from "../my-data-tab.scss";
import { AddLocalData } from "./AddLocalData";
import { MyDataTabContainer } from "../MyDataTabContainer";
import { AddWebData } from "./AddWebData";

interface IAddDataSectionProps {
  viewState: ViewState;
  goBack: () => void;
  activeTabId: string;
  localDataTypes?: ILocalDataType[];
  remoteDataTypes?: IRemoteDataType[];
  onFileAddFinished: (item: BaseModel[]) => void;
}

export const AddDataSection: FC<IAddDataSectionProps> = ({
  viewState,
  activeTabId,
  localDataTypes,
  remoteDataTypes,
  onFileAddFinished,
  goBack
}) => {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <MyDataTabContainer>
      <button
        type="button"
        onClick={goBack}
        className={Styles.btnBackToMyData}
        css={`
          color: ${theme.colorPrimary};
          &:hover,
          &:focus {
            border: 1px solid ${theme.colorPrimary};
          }
          svg {
            fill: ${theme.colorPrimary};
          }
        `}
      >
        <Icon glyph={Icon.GLYPHS.left} />
        {t("addData.back")}
      </button>
      {activeTabId === "local" && (
        <AddLocalData
          viewState={viewState}
          goBack={goBack}
          dataTypes={localDataTypes}
          onFileAddFinished={onFileAddFinished}
        />
      )}
      {activeTabId === "web" && (
        <AddWebData
          viewState={viewState}
          goBack={goBack}
          dataTypes={remoteDataTypes}
          onDataAddFinished={onFileAddFinished}
        />
      )}
    </MyDataTabContainer>
  );
};
