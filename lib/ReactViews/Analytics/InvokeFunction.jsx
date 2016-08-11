import React from 'react';
import knockout from 'terriajs-cesium/Source/ThirdParty/knockout';
import ObserveModelMixin from '../ObserveModelMixin';
import ParameterEditor from './ParameterEditor';
import when from 'terriajs-cesium/Source/ThirdParty/when';
import TerriaError from '../../Core/TerriaError';
import parseCustomMarkdownToReact from '../Custom/parseCustomMarkdownToReact';
import defined from 'terriajs-cesium/Source/Core/defined';
import Styles from './invoke-function.scss';

const InvokeFunction = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        terria: React.PropTypes.object,
        previewed: React.PropTypes.object,
        viewState: React.PropTypes.object
    },

    componentWillMount() {
        this.enableContextItem(this.props);
    },

    componentWillUnmount() {
        this.removeContextItem();
    },

    componentWillReceiveProps(nextProps) {
        // This will be called when component is already mounted but props change, for example if you go from one WPS
        // item to another.
        this.enableContextItem(nextProps);
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

    enableContextItem(props) {
        this.removeContextItem();
        if (defined(props.previewed.contextItem)) {
            props.previewed.contextItem.isEnabled = true;
            this._lastContextItem = props.previewed.contextItem;
        }
    },

    removeContextItem() {
        if (defined(this._lastContextItem)) {
            this._lastContextItem.isEnabled = false;
            this._lastContextItem = undefined;
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
        return (<div className={Styles.invokeFunction}>
                    <div className={Styles.content}>
                        <h3>{this.props.previewed.name}</h3>
                        <div className={Styles.description}>{parseCustomMarkdownToReact(this.props.previewed.description, {catalogItem: this.props.previewed})}</div>
                        {this.getParams()}
                    </div>
                    <div className={Styles.footer}>
                        <button type='button' className={Styles.btn} onClick={this.submit}>Run Analysis</button>
                    </div>
                </div>);
    }
});

module.exports = InvokeFunction;
