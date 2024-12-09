import { makeObservable, observable, runInAction } from "mobx";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import defined from "terriajs-cesium/Source/Core/defined";
import parseCustomMarkdownToReact from "../Custom/parseCustomMarkdownToReact";
import Loader from "../Loader";
import WarningBox from "../Preview/WarningBox";
import Styles from "./invoke-function.scss";
import ParameterEditor from "./ParameterEditor";

class FunctionViewModel {
  _parameters: any;
  catalogFunction: any;
  constructor(catalogFunction: any) {
    this.catalogFunction = catalogFunction;
    this._parameters = {};
  }

  getParameter(parameter: any) {
    let result = this._parameters[parameter.id];
    if (!result || result.parameter !== parameter) {
      result = this._parameters[parameter.id] = new ParameterViewModel(
        parameter
      );
    }
    return result;
  }
}

class ParameterViewModel {
  parameter;

  @observable
  userValue = undefined;
  @observable
  isValueValid = true;
  @observable
  wasEverBlurredWhileInvalid = false;

  constructor(parameter: any) {
    makeObservable(this);
    this.parameter = parameter;
  }
}

@observer
class InvokeFunction extends React.Component {
  static propTypes = {
    terria: PropTypes.object,
    previewed: PropTypes.object,
    viewState: PropTypes.object,
    t: PropTypes.func.isRequired
  };

  parametersViewModel: any;

  /* eslint-disable-next-line camelcase */
  UNSAFE_componentWillMount() {
    // @ts-expect-error TS(2339): Property 'previewed' does not exist on type 'Reado... Remove this comment to see the full error message
    this.parametersViewModel = new FunctionViewModel(this.props.previewed);
  }

  /* eslint-disable-next-line camelcase */
  UNSAFE_componentWillUpdate(nextProps: any, _nextState: any) {
    if (nextProps.previewed !== this.parametersViewModel.catalogFunction) {
      // Clear previous parameters view model, because this is a different catalog function.
      this.parametersViewModel = new FunctionViewModel(nextProps.previewed);
    }
  }

  submit() {
    // @ts-expect-error TS(2339): Property 'previewed' does not exist on type 'Reado... Remove this comment to see the full error message
    this.props.previewed.submitJob().catch((e: any) => {
      // @ts-expect-error TS(2339): Property 'terria' does not exist on type 'Readonly... Remove this comment to see the full error message
      this.props.terria.raiseErrorToUser(e);
    });

    runInAction(() => {
      // Close modal window
      // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
      this.props.viewState.explorerPanelIsVisible = false;
      // mobile switch to nowvewing
      // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
      this.props.viewState.switchMobileView(
        // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
        this.props.viewState.mobileViewOptions.preview
      );
    });
  }

  getParams() {
    // Key should include the previewed item identifier so that
    // components are refreshed when different previewed items are
    // displayed
    // @ts-expect-error TS(2339): Property 'previewed' does not exist on type 'Reado... Remove this comment to see the full error message
    return this.props.previewed.functionParameters.map(
      (param: any, _i: any) => (
        <ParameterEditor
          // @ts-expect-error TS(2339): Property 'previewed' does not exist on type 'Reado... Remove this comment to see the full error message
          key={param.id + this.props.previewed.uniqueId}
          // @ts-expect-error TS(2769): No overload matches this call.
          parameter={param}
          // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
          viewState={this.props.viewState}
          // @ts-expect-error TS(2339): Property 'previewed' does not exist on type 'Reado... Remove this comment to see the full error message
          previewed={this.props.previewed}
          parameterViewModel={this.parametersViewModel.getParameter(param)}
        />
      )
    );
  }

  validateParameter(parameter: any) {
    if (
      !parameter.isValid ||
      !this.parametersViewModel.getParameter(parameter).isValueValid
    ) {
      // Editor says it's not valid, so it's not valid.
      return false;
    }

    // Verify that required parameters have a value.
    if (parameter.isRequired && !defined(parameter.value)) {
      return false;
    }

    return true;
  }

  render() {
    // @ts-expect-error TS(2339): Property 'previewed' does not exist on type 'Reado... Remove this comment to see the full error message
    if (this.props.previewed.isLoading) {
      return <Loader />;
    }

    // @ts-expect-error TS(2339): Property 'previewed' does not exist on type 'Reado... Remove this comment to see the full error message
    const invalidParameters = this.props.previewed.functionParameters.some(
      (param: any) => this.validateParameter(param) !== true
    );

    // @ts-expect-error TS(2339): Property 't' does not exist on type 'Readonly<{}> ... Remove this comment to see the full error message
    const { t } = this.props;
    return (
      <div className={Styles.invokeFunction}>
        <div className={Styles.content}>
          // @ts-expect-error TS(2339): Property 'previewed' does not exist on
          type 'Reado... Remove this comment to see the full error message
          <h3>{this.props.previewed.name}</h3>
          // @ts-expect-error TS(2339): Property 'previewed' does not exist on
          type 'Reado... Remove this comment to see the full error message
          {this.props.previewed.loadMetadataResult?.error && (
            <WarningBox
              // @ts-expect-error TS(2339): Property 'previewed' does not exist on type 'Reado... Remove this comment to see the full error message
              error={this.props.previewed.loadMetadataResult?.error}
              // @ts-expect-error TS(2339): Property 'viewState' does not exist on type 'Reado... Remove this comment to see the full error message
              viewState={this.props.viewState}
            />
          )}
          <div className={Styles.description}>
            // @ts-expect-error TS(2339): Property 'previewed' does not exist on
            type 'Reado... Remove this comment to see the full error message
            {parseCustomMarkdownToReact(this.props.previewed.description, {
              // @ts-expect-error TS(2339): Property 'previewed' does not exist on type 'Reado... Remove this comment to see the full error message
              catalogItem: this.props.previewed
            })}
          </div>
          {this.getParams()}
        </div>
        <div className={Styles.footer}>
          <button
            type="button"
            className={Styles.btn}
            onClick={() => this.submit()}
            disabled={invalidParameters}
          >
            {t("analytics.runAnalysis")}
          </button>
        </div>
      </div>
    );
  }
}

export default withTranslation()(InvokeFunction);
