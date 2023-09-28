import i18next from "i18next";
import * as React from "react";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import CatalogMemberMixin from "../../../ModelMixins/CatalogMemberMixin";
import AnimatedSpinnerIcon from "../../../Styled/AnimatedSpinnerIcon";
import { useViewState } from "../../Context";
import RaiseToUserErrorBoundary from "../../Errors/RaiseToUserErrorBoundary";
import { Frame, Main } from "../ToolModal";
import { PropsType } from "./ItemSearchTool";

const ItemSearchTool = React.lazy(() => import("./ItemSearchTool"));

/**
 * Lazily loads the item search tool while showing a the search window and an animated spinner.
 */
const LazyItemSearchTool: React.FC<PropsType> = (props) => {
  const { item } = props;
  const viewState = useViewState();
  const itemName = CatalogMemberMixin.isMixedInto(item) ? item.name : "Item";
  const [t] = useTranslation();

  return (
    <Suspense
      fallback={
        <Frame title={t("itemSearchTool.title", { itemName })}>
          <Wrapper>
            <AnimatedSpinnerIcon light styledWidth="25px" styledHeight="25px" />
          </Wrapper>
        </Frame>
      }
    >
      <RaiseToUserErrorBoundary
        viewState={viewState}
        terriaErrorOptions={{
          title: i18next.t("itemSearchTool.toolLoadError")
        }}
      >
        <ItemSearchTool {...props} />
      </RaiseToUserErrorBoundary>
    </Suspense>
  );
};

const Wrapper = styled(Main)`
  align-items: center;
  justify-content: center;
`;

export default LazyItemSearchTool;
