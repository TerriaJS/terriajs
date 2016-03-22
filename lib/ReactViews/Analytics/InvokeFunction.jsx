'use strict';
import React from 'react';
import defaultValue from 'terriajs-cesium/Source/Core/defaultValue';
import knockout from 'terriajs-cesium/Source/ThirdParty/knockout';
import ObserveModelMixin from '../ObserveModelMixin';
import ParameterEditor from './ParameterEditor';
import when from 'terriajs-cesium/Source/ThirdParty/when';
import TerriaError from '../../Core/TerriaError';

const dummyParameters = [
    {
        id: 'LonLatPosition',
        name: 'Long and Lat',
        type: 'point',
        defaultValue: '150.86114449300467,-44.5532602467681'
    },

    {
        id: 'target-type',
        name: 'Output Format',
        type: 'enumeration',
        posibleValues: ['image', 'mpld3', 'bokeh', 'pdf'],
        defaultValue: 'image'
    },
];

const InvokeFunction = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        terria: React.PropTypes.object,
        previewed: React.PropTypes.object
    },

    getInitialState() {
        return {
            parameterValues: {},
            parameterNames: []
        };
    },

    componentWillMount() {
       this.setParams();
    },

    componentWillReceiveProps() {
       this.setParams();
    },

    onChange(i, param, event) {
        this.state.parameterValues[param.id] = event.target.value;
        this.setState(this.state);
    },

    submit() {
      const that = this;
      console.log(this.state);
      try {
          const promise = when(this.props.previewed.invoke(this.state.parameterValues)).otherwise(function(terriaError) {
              if (terriaError instanceof TerriaError) {
                  that.props.previewed.terria.error.raiseEvent(terriaError);
              }
          });
          // Show the Now Viewing panel
          that.props.previewed.terria.nowViewing.showNowViewingRequested.raiseEvent();

          return promise;
      } catch (e) {
          if (e instanceof TerriaError) {
              that.props.previewed.terria.error.raiseEvent(e);
          }
          return undefined;
      }
    },

    setParams() {
        //const parameters = this.props.previewed.parameters;
        const parameters = dummyParameters;
        this.state.parameterNames = [];
        this.state.parameterValues = {};
        for (let i = 0; i < parameters.length; ++i) {
            const parameter = parameters[i];
            this.state.parameterNames.push(parameter.id);
            this.state.parameterValues[parameter.id] = parameter.defaultValue;
        }
        this.setState(this.state);
    },

    getParams() {
       return dummyParameters.map((param, i)=><ParameterEditor key={i}
                                                               parameter={param}
                                                               onChange={this.onChange.bind(this, i, param)}
                                              />);
    },

    render() {
        return (<div>
                    <div className="invoke-function__content">
                        <div className="invoke-function__description">{this.props.previewed.description}</div>
                        {this.getParams()}
                    </div>
                    <div className="invoke-function__footer">
                        <button className='btn btn-primary' onClick={this.submit}>Run Analysis</button>
                    </div>
                </div>);
    }
});

module.exports = InvokeFunction;
