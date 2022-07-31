import React, { ChangeEvent, FC, useState, useEffect } from "react";

import { Trans, useTranslation } from "react-i18next";
import styled from "styled-components";

import getDataType, { ILocalDataType } from "../../../../../Core/getDataType";
import addUserFiles from "../../../../../Models/Catalog/addUserFiles";
import { BaseModel } from "../../../../../Models/Definition/Model";
import ViewState from "../../../../../ReactViewModels/ViewState";
import Box from "../../../../../Styled/Box";
import { parseCustomMarkdownToReactWithOptions } from "../../../../Custom/parseCustomMarkdownToReact";
import Loader from "../../../../Loader";
import { FileInput } from "./FileInput";
import Text from "../../../../../Styled/Text";
import Spacing from "../../../../../Styled/Spacing";
import { SelectDataType } from "./SelectDataType";

interface IAddLocalDataProps {
  viewState: ViewState;
  goBack: () => void;
  dataTypes?: ILocalDataType[];
  onFileAddFinished: (item: BaseModel[]) => void;
}

export const AddLocalData: FC<IAddLocalDataProps> = ({
  viewState,
  goBack,
  dataTypes,
  onFileAddFinished
}) => {
  const { t } = useTranslation();

  const localDataTypes = dataTypes ?? getDataType().localDataType;
  const [selectedLocalDataType, setSelectedLocalDataType] = useState<
    ILocalDataType
  >(localDataTypes[0]);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setIsLoading(true);
    addUserFiles(
      e.target.files,
      viewState.terria,
      viewState,
      selectedLocalDataType
    ).then(addedCatalogItems => {
      if (addedCatalogItems && addedCatalogItems.length > 0) {
        onFileAddFinished?.(addedCatalogItems);
      }
      setIsLoading(false);
      // reset active tab when file handling is done
      goBack();
    });
  };

  const fileExtensions = localDataTypes.reduce(
    (result: string[], currentFileType) => {
      if (currentFileType.extensions) {
        return result.concat(
          currentFileType.extensions.map(extension => `.${extension}`)
        );
      } else {
        return result;
      }
    },
    []
  );

  return (
    <Box
      column
      styledWidth="50%"
      styledMaxWidth="600px"
      fullHeight
      css={`
        justify-content: center;
      `}
    >
      <Text
        textDark
        extraLarge
        styledLineHeight="2"
        css={`
          display: flex;
          align-self: flex-start;
          border-bottom: 1px solid black;
        `}
      >
        {t("addData.localAdd")}
      </Text>
      <Spacing bottom={2} />
      <Text medium textDark>
        <Trans i18nKey="addData.localFileType">
          <strong>Step 1:</strong> Select file type (optional)
        </Trans>
      </Text>
      <Spacing bottom={2} />
      <Text medium>
        <SelectDataType
          options={localDataTypes}
          onChange={setSelectedLocalDataType}
          selectedValue={selectedLocalDataType}
        />
      </Text>
      {selectedLocalDataType?.description ? (
        <StyledDescription textDark small>
          <Spacing bottom={1} />
          {parseCustomMarkdownToReactWithOptions(
            selectedLocalDataType?.description
          )}
        </StyledDescription>
      ) : null}
      <Spacing bottom={2} />
      <Text medium textDark>
        <Trans i18nKey="addData.localFile">
          <strong>Step 2:</strong> Select file
        </Trans>
      </Text>
      <Spacing bottom={2} />
      <FileInput
        accept={fileExtensions.join(",")}
        onChange={handleFileUpload}
      />
      {isLoading && <Loader />}
    </Box>
  );
};

const StyledDescription = styled(Text)`
  & p {
    margin: 0;
  }
`;
