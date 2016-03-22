'use strict';
import React from 'react';
import defaultValue from 'terriajs-cesium/Source/Core/defaultValue';
import knockout from 'terriajs-cesium/Source/ThirdParty/knockout';
import ObserveModelMixin from '../ObserveModelMixin';

const InvokeFunction = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        terria: React.PropTypes.object,
        previewed: React.PropTypes.object
    },

    componentWillMount(){

    },

    submit(){

    },

    getParams() {
        return this.props.previewed.parameters.map((param, i)=>param.name);
    },

    render() {
        return (<div>
                    <div className="invoke-function__content">
                        <div className="invoke-function__description">{this.props.previewed.description}</div>
                        {this.getParams()}
                    </div>
                    <div className="invoke-function__footer">
                        <button onClick={this.submit}>Run Analysis</button>
                    </div>
                </div>);
    }
});

module.exports = InvokeFunction;
