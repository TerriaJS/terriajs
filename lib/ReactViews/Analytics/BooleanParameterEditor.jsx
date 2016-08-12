import React from 'react';
import ObserveModelMixin from '../ObserveModelMixin';

import Styles from './parameter-editors.scss';

const BooleanParameterEditor = React.createClass({
    mixins: [ObserveModelMixin],
    propTypes: {
        previewed: React.PropTypes.object,
        parameter: React.PropTypes.object
    },

    onClick() {
        const value = this.props.previewed.parameterValues[this.props.parameter.id];
        this.props.previewed.setParameterValue(this.props.parameter.id, !value);
    },

    renderRadio(state) {
        let name;
        let description;
        let classNames;
        const value = this.props.previewed.parameterValues[this.props.parameter.id];
        if (state === true) {
            name = this.props.parameter.trueName || this.props.parameter.name;
            description = this.props.parameter.trueDescription || this.props.parameter.description;
            classNames = value && value === true ? Styles.btnRadioOn : Styles.btnRadioOff;
        } else {
            name = this.props.parameter.falseName || this.props.parameter.name;
            description = this.props.parameter.falseDescription || this.props.parameter.description;
            classNames = value && value === true ? Styles.btnRadioOff : Styles.btnRadioOn;

        }
        return (
            <div className={Styles.radio}>
                <button type='button'
                        className={`${Styles.btnRadio} ${classNames}`}
                        title={description}
                        onClick={this.onClick}>
                    {name}
                </button>
            </div>
        );
    },

    render() {
        return (
            <div>
                {!this.props.parameter.hasNamedStates && this.renderRadio(true)}
                {this.props.parameter.hasNamedStates && <div>{this.renderRadio(true)}{this.renderRadio(false)}</div>}
            </div>
        );
    }
});

module.exports = BooleanParameterEditor;
