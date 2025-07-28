import { makeObservable, observable, runInAction } from "mobx";
import { observer } from "mobx-react";
import { FC, useMemo } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import TerriaError from "../../Core/TerriaError";
import CatalogFunctionMixin from "../../ModelMixins/CatalogFunctionMixin";
import FunctionParameter from "../../Models/FunctionParameters/FunctionParameter";
import Button from "../../Styled/Button";
import { scrollBars } from "../../Styled/mixins";
import { useViewState } from "../Context";
import parseCustomMarkdownToReact from "../Custom/parseCustomMarkdownToReact";
import Loader from "../Loader";
import WarningBox from "../Preview/WarningBox";
import ParameterEditor from "./ParameterEditor";

interface PropsType {
  previewed: CatalogFunctionMixin.Instance;
}

class FunctionViewModel {
  readonly catalogFunction: CatalogFunctionMixin.Instance;
  private _parameters: Record<string, ParameterViewModel> = {};

  constructor(catalogFunction: CatalogFunctionMixin.Instance) {
    this.catalogFunction = catalogFunction;
    this._parameters = {};
  }

  getParameter(parameter: FunctionParameter) {
    let result = this._parameters[parameter.id];
    if (!result || result.parameter !== parameter) {
      result = this._parameters[parameter.id] = new ParameterViewModel(
        parameter
      );
    }
    return result;
  }

  validateParameter(parameter: FunctionParameter) {
    if (!parameter.isValid || !this.getParameter(parameter).isValueValid) {
      // Editor says it's not valid, so it's not valid.
      return false;
    }

    // Verify that required parameters have a value.
    if (
      parameter.isRequired &&
      (parameter.value === undefined || parameter.value === null)
    ) {
      return false;
    }

    return true;
  }
}

class ParameterViewModel {
  parameter;

  @observable userValue = undefined;
  @observable isValueValid = true;
  @observable wasEverBlurredWhileInvalid = false;

  constructor(parameter: FunctionParameter) {
    makeObservable(this);
    this.parameter = parameter;
  }
}

const InvokeFunction: FC<PropsType> = observer(({ previewed }) => {
  const viewState = useViewState();
  const [t] = useTranslation();

  let functionParameters, parametersError;
  try {
    functionParameters = previewed.functionParameters;
  } catch (e) {
    // .functionParameters might throw an error. Handle it here.
    parametersError = TerriaError.from(e);
  }

  const error = previewed.loadMetadataResult?.error ?? parametersError;
  const description = previewed.description
    ? parseCustomMarkdownToReact(previewed.description, {
        catalogItem: previewed
      })
    : undefined;

  const functionViewModel = useMemo(
    () => new FunctionViewModel(previewed),
    [previewed]
  );

  const invalidParameters =
    !functionParameters ||
    functionParameters.some(
      (param) => functionViewModel.validateParameter(param) !== true
    );

  const runAnalysis = () => {
    previewed.submitJob().catch((e) => {
      viewState.terria.raiseErrorToUser(e);
    });

    runInAction(() => {
      // Close modal window
      viewState.explorerPanelIsVisible = false;
      // mobile switch to nowvewing
      viewState.switchMobileView(viewState.mobileViewOptions.preview);
    });
  };

  if (previewed.isLoading) {
    return <Loader />;
  }

  return (
    <Wrapper>
      <Content>
        <h3>{previewed.name}</h3>
        {error && <WarningBox error={error} viewState={viewState} />}
        {description && <div>{description}</div>}
        <div>
          {functionParameters &&
            functionParameters.map((param) => (
              <ParameterEditor
                key={param.id + previewed.uniqueId}
                parameter={param}
                viewState={viewState}
                previewed={previewed}
                parameterViewModel={functionViewModel.getParameter(param)}
              />
            ))}
        </div>
      </Content>
      <Footer>
        <Button
          primary
          fullWidth
          disabled={invalidParameters}
          onClick={runAnalysis}
        >
          {t("analytics.runAnalysis")}
        </Button>
      </Footer>
    </Wrapper>
  );
});

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  padding: ${(p) => p.theme.paddingSmall};
  position: relative;
  height: calc(100% - ${(p) => p.theme.paddingSmall} * 2);
  a {
    color: variables.$color-primary;
  }
`;

const Content = styled.div`
  ${(p) => scrollBars(p)}
  overflow-y: auto;
  height: calc(100% - ${(p) => p.theme.inputHeight});
  padding-right: ${(p) => p.theme.padding};
  padding-left: ${(p) => p.theme.padding};
  h3 {
    margin-top: 0;
  }
`;

const Footer = styled.div`
  background: ${(p) => p.theme.modalBg};
  padding: ${(p) => p.theme.paddingSmall};
`;

export default InvokeFunction;
