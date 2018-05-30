import defined from 'terriajs-cesium/Source/Core/defined';
import Loader from '../Loader';
import ObserveModelMixin from '../ObserveModelMixin';
import ParameterEditor from './ParameterEditor';
import parseCustomMarkdownToReact from '../Custom/parseCustomMarkdownToReact';
import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import Styles from './invoke-function.scss';
import TerriaError from '../../Core/TerriaError';
import when from 'terriajs-cesium/Source/ThirdParty/when';

const InvokeFunction = createReactClass({
    displayName: 'InvokeFunction',
    mixins: [ObserveModelMixin],

    propTypes: {
        terria: PropTypes.object,
        previewed: PropTypes.object,
        viewState: PropTypes.object
    },

    submit() {
        try {
            const promise = when(this.props.previewed.invoke())
                .otherwise(terriaError => {
                    if (terriaError instanceof TerriaError) {
                        this.props.previewed.terria.error.raiseEvent(terriaError);
                    }
                });
            // Show the Now Viewing panel
            this.props.previewed.terria.nowViewing.showNowViewingRequested.raiseEvent();
            // Close modal window
            this.props.viewState.explorerPanelIsVisible = false;
            // mobile switch to nowvewing
            this.props.viewState.switchMobileView(this.props.viewState.mobileViewOptions.preview);

            return promise;
        } catch (e) {
            if (e instanceof TerriaError) {
                this.props.previewed.terria.error.raiseEvent(e);
            }
            return undefined;
        }
    },

    getParams() {
        // Key should include the previewed item identifier so that
        // components are refreshed when different previewed items are
        // displayed
        return this.props.previewed.parameters.map((param, i)=>
            <ParameterEditor key={param.id + this.props.previewed.uniqueId}
                             parameter={param}
                             viewState={this.props.viewState}
                             previewed={this.props.previewed}
            />);
    },

    validateParamter(parameter)
    {
        if (defined(parameter.isValid) && (!parameter.isValid())) {
            return false;
        }

        // Dummy function to trigger update...
        if (defined(parameter.value) && (parameter.value === true || parameter.value !== true)) {
            return true;
        }

        return true;
    },

    render() {
        if (this.props.previewed.isLoading) {
            return <Loader />;
        }
        var invalidParameters = false;
        if (defined(this.props.previewed.parameters)) {
            invalidParameters = !this.props.previewed.parameters.every(this.validateParamter);
        }

        return (<div className={Styles.invokeFunction}>
                    <div className={Styles.content}>
                        <h3>{this.props.previewed.name}</h3>
                        <div className={Styles.description}>{parseCustomMarkdownToReact(this.props.previewed.description, {catalogItem: this.props.previewed})}</div>
                        {this.getParams()}
                    </div>
                    <div className={Styles.footer}>
                        <button type='button' className={Styles.btn} onClick={this.submit} disabled={invalidParameters}>Run Analysis</button>
                    </div>
                </div>);
    },
});

module.exports = InvokeFunction;
