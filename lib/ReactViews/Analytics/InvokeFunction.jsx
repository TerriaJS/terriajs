import React from 'react';
import ReactDOM from 'react-dom';
import ObserveModelMixin from '../ObserveModelMixin';
import ParameterEditor from './ParameterEditor';
import when from 'terriajs-cesium/Source/ThirdParty/when';
import TerriaError from '../../Core/TerriaError';
import parseCustomMarkdownToReact from '../Custom/parseCustomMarkdownToReact';
import Styles from './invoke-function.scss';

const InvokeFunction = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        terria: React.PropTypes.object,
        previewed: React.PropTypes.object,
        viewState: React.PropTypes.object
    },

    // Thanks https://gist.github.com/ashblue/7759368
    hasHtml5Validation() {
        return typeof document.createElement('input').checkValidity === 'function';
    },

    submit(e) {
        e.preventDefault();
        debugger;

        if (this.hasHtml5Validation()) {
            if (!ReactDOM.findDOMNode(this).checkValidity()) {
                console.log("NOT VALID");
            } else {
                console.log("VALID");
            }
        } else {
            console.log("No validation");
        }

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
        />
    );},

    render() {
        return (<form className={Styles.invokeFunction} onSubmit={this.submit}>
                    <div className={Styles.content}>
                        <h3>{this.props.previewed.name}</h3>
                        <div className={Styles.description}>{parseCustomMarkdownToReact(this.props.previewed.description, {catalogItem: this.props.previewed})}</div>
                        {this.getParams()}
                    </div>
                    <div className={Styles.footer}>
                        <input type='submit' className={Styles.btn} value="Run Analysis"/>
                    </div>
                </form>);
    }
});

module.exports = InvokeFunction;
