'use strict';

/*global require*/
import React from 'react';
import ObserveModelMixin from '../ObserveModelMixin';

const BooleanParameterEditor = React.createClass({
    mixins: [ObserveModelMixin],
    propTypes: {
        previewed: React.PropTypes.object,
        parameter: React.PropTypes.object,
        parameterValues: React.PropTypes.object
    },

    onClick() {
        this.props.parameterValues[this.props.parameter.id] = !this.props.parameterValues[this.props.parameter.id];
    },

    renderRadio(state) {
        let name;
        let description;
        let classNames;
        if(state === true) {
            name = this.props.parameter.trueName || this.props.parameter.name;
            description = this.props.parameter.trueDescription || this.props.parameter.description;
            classNames = this.props.parameterValues[this.props.parameter.id] ? 'btn--radio-on' : 'btn--radio-off';
        } else {
            name = this.props.parameter.falseName || this.props.parameter.name;
            description = this.props.parameter.falseDescription || this.props.parameter.description;
            classNames = this.props.parameterValues[this.props.parameter.id] ? 'btn--radio-off' : 'btn--radio-on';

        }
        return (<div className='radio'>
                    <button className={`btn btn--radio ${classNames}`}
                            title={description}
                            onClick={this.onClick}
                    >
                    {name}
                    </button>
                </div>);
    },

    render() {
        return (<div>
                {!this.props.parameter.hasNamedStates && this.renderRadio(true)}
                {this.props.parameter.hasNamedStates && <div>{this.renderRadio(true)}{this.renderRadio(false)}</div>}
                </div>);
    }
});

module.exports = BooleanParameterEditor;
