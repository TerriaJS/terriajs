import React, { FC } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components";

import {
  ILocalDataType,
  IRemoteDataType
} from "../../../../../Core/getDataType";
import ViewState from "../../../../../ReactViewModels/ViewState";

import Icon, { StyledIcon } from "../../../../../Styled/Icon";
import { RawButton } from "../../../../../Styled/Button";

import { BaseModel } from "../../../../../Models/Definition/Model";
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
      <RawButton
        type="button"
        onClick={goBack}
        css={`
          display: flex;
          align-items: center;
          position: absolute;
          left: 40px;
          top: 40px;
          padding: 4px 10px;
          gap: 5px;
          background-color: ${theme.textLight};
          border: 1px solid ${theme.greyLighter};
          border-radius: ${theme.radiusSmall};
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
        <StyledIcon glyph={Icon.GLYPHS.left} styledHeight="10px" />
        {t("addData.back")}
      </RawButton>
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
