import i18next from "i18next";
import React, { ErrorInfo, Suspense } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import CatalogMemberMixin from "../../../ModelMixins/CatalogMemberMixin";
import ViewState from "../../../ReactViewModels/ViewState";
import AnimatedSpinnerIcon from "../../../Styled/AnimatedSpinnerIcon";
import { Frame, Main } from "../ToolModal";
import { PropsType } from "./ItemSearchTool";

const ItemSearchTool = React.lazy(() => import("./ItemSearchTool"));

/**
 * Lazily loads the item search tool.
 */
const LazyItemSearchTool: React.FC<PropsType> = props => {
  const { viewState, item } = props;
  const itemName = CatalogMemberMixin.isMixedInto(item) ? item.name : "Item";
  const [t] = useTranslation();

  return (
    <Suspense
      fallback={
        <Frame
          viewState={viewState}
          title={t("itemSearchTool.title", { itemName })}
        >
          <Wrapper>
            <AnimatedSpinnerIcon light styledWidth="25px" styledHeight="25px" />
          </Wrapper>
        </Frame>
      }
    >
      <LazyLoadErrorBoundary viewState={viewState}>
        <ItemSearchTool {...props} />
      </LazyLoadErrorBoundary>
    </Suspense>
  );
};

const Wrapper = styled(Main)`
  align-items: center;
  justify-content: center;
`;

class LazyLoadErrorBoundary extends React.Component<{ viewState: ViewState }> {
  state = { hasError: false };

  static getDerivedStateFromError(error: any) {
    return {
      hasError: true
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const newError = new Error(i18next.t("itemSearchTool.toolLoadError"));
    newError.name = error.name;
    newError.stack = error.stack;
    this.props.viewState.terria.raiseErrorToUser(newError);
  }

  render() {
    return this.state.hasError ? null : this.props.children;
  }
}

export default LazyItemSearchTool;
