import React, { FC, useState, MouseEvent as ReactMouseEvent } from "react";

import { Trans, useTranslation } from "react-i18next";
import styled, { useTheme } from "styled-components";

import {
  Category,
  DatatabAction
} from "../../../../../Core/AnalyticEvents/analyticEvents";
import getDataType, { IRemoteDataType } from "../../../../../Core/getDataType";
import TimeVarying from "../../../../../ModelMixins/TimeVarying";
import addUserCatalogMember from "../../../../../Models/Catalog/addUserCatalogMember";
import CatalogMemberFactory from "../../../../../Models/Catalog/CatalogMemberFactory";
import createCatalogItemFromFileOrUrl from "../../../../../Models/Catalog/createCatalogItemFromFileOrUrl";
import CommonStrata from "../../../../../Models/Definition/CommonStrata";
import { BaseModel } from "../../../../../Models/Definition/Model";
import upsertModelFromJson from "../../../../../Models/Definition/upsertModelFromJson";
import ViewState from "../../../../../ReactViewModels/ViewState";
import Box from "../../../../../Styled/Box";
import Spacing from "../../../../../Styled/Spacing";
import Text from "../../../../../Styled/Text";
import { parseCustomMarkdownToReactWithOptions } from "../../../../Custom/parseCustomMarkdownToReact";
import Loader from "../../../../Loader";
import CatalogMemberMixin from "../../../../../ModelMixins/CatalogMemberMixin";
import { SelectDataType } from "./SelectDataType";
import Input from "../../../../../Styled/Input";
import { Button } from "../../../../../Styled/Button";

interface IAddWebDataProps {
  viewState: ViewState;
  goBack: () => void;
  dataTypes?: IRemoteDataType[];
  onDataAddFinished: (item: BaseModel[]) => void;
}

export const AddWebData: FC<IAddWebDataProps> = ({
  viewState,
  goBack,
  dataTypes,
  onDataAddFinished
}) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const remoteDataTypes = dataTypes ?? getDataType().remoteDataType;
  const [selectedRemoteDataType, setSelectedRemoteDataType] = useState<
    IRemoteDataType
  >(remoteDataTypes[0]);
  const [remoteUrl, setRemoteUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAdd = async (
    e: ReactMouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    if (!remoteUrl || remoteUrl === "") {
      return;
    }
    const { terria } = viewState;

    const url = remoteUrl;
    terria.analytics?.logEvent(Category.dataTab, DatatabAction.addDataUrl, url);
    setIsLoading(true);
    let promise;
    if (selectedRemoteDataType.value === "auto") {
      promise = createCatalogItemFromFileOrUrl(
        terria,
        viewState,
        remoteUrl,
        selectedRemoteDataType.value
      );
    } else {
      try {
        const newItem = upsertModelFromJson(
          CatalogMemberFactory,
          terria,
          "",
          CommonStrata.defaults,
          { type: selectedRemoteDataType.value, name: url },
          {}
        ).throwIfUndefined({
          message: `An error occurred trying to add data from URL: ${url}`
        });
        newItem.setTrait(CommonStrata.user, "url", url);
        if (!CatalogMemberMixin.isMixedInto(newItem)) {
          throw new Error(`${newItem.type} is not a CatalogMemberMixin`);
        }
        console.log(newItem);
        // @ts-ignore
        promise = newItem.loadMetadata().then(result => {
          if (result.error) {
            return Promise.reject(result.error);
          }

          return Promise.resolve(newItem);
        });
      } catch (e) {
        promise = Promise.reject(e);
      }
    }
    addUserCatalogMember(terria, promise).then(addedItem => {
      if (addedItem) {
        onDataAddFinished([addedItem]);
        if (TimeVarying.is(addedItem)) {
          viewState.terria.timelineStack.addToTop(addedItem);
        }
      }

      // FIXME: Setting state here might result in a react warning if the
      // component unmounts before the promise finishes
      setIsLoading(false);
      goBack();
    });
  };

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
        {t("addData.webAdd")}
      </Text>
      <Spacing bottom={2} />
      <Text medium textDark>
        <Trans i18nKey="addData.webFileType">
          <strong>Step 1:</strong> Select file type (optional)
        </Trans>
      </Text>
      <Spacing bottom={2} />
      <Text medium>
        <SelectDataType
          options={remoteDataTypes}
          onChange={setSelectedRemoteDataType}
          selectedValue={selectedRemoteDataType}
        />
      </Text>
      {selectedRemoteDataType?.description ? (
        <StyledDescription textDark small>
          <Spacing bottom={1} />
          {parseCustomMarkdownToReactWithOptions(
            selectedRemoteDataType?.description
          )}
        </StyledDescription>
      ) : null}
      <Spacing bottom={2} />
      <Text medium textDark>
        <Trans i18nKey="addData.webFile">
          <strong>Step 2:</strong> Enter the URL of the data file or web service
        </Trans>
      </Text>
      <Spacing bottom={2} />
      <Box>
        <Input
          value={remoteUrl}
          onChange={e => setRemoteUrl(e.target.value)}
          type="text"
          placeholder="e.g. http://data.gov.au/geoserver/wms"
          css={`
            border-radius: ${theme.radiusLarge} 0 0 ${theme.radiusLarge};
            border: 1px solid ${theme.greyLighter};
            border-right: 0;
            font-size: 14px;
          `}
        />
        <Button
          onClick={handleAdd}
          primary
          css={`
            border-radius: 0 ${theme.radiusLarge} ${theme.radiusLarge} 0;
          `}
        >
          {t("addData.urlInputBtn")}
        </Button>
      </Box>
      {isLoading && <Loader />}
    </Box>
  );
};

const StyledDescription = styled(Text)`
  & p {
    margin: 0;
  }
`;
