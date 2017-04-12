import React from 'react';
import PropTypes from 'prop-types';
import Icon from '../Icon.jsx';
import ObserveModelMixin from '../ObserveModelMixin';

import Styles from './parameter-editors.scss';

const BooleanParameterEditor = React.createClass({
    mixins: [ObserveModelMixin],
    propTypes: {
        previewed: PropTypes.object,
        parameter: PropTypes.object
    },

    onClick() {
        this.props.parameter.value = !this.props.parameter.value;
    },

    renderCheckbox() {
        const value = this.props.parameter.value;
        const name = this.props.parameter.name;
        const description = this.props.parameter.description;

        return (
            <div>
                <button type='button'
                        className={Styles.btnRadio}
                        title={description}
                        onClick={this.onClick}>
                    {value && <Icon glyph={Icon.GLYPHS.checkboxOn}/>}
                    {!value && <Icon glyph={Icon.GLYPHS.checkboxOff}/>}
                    {name}
                </button>
            </div>
        );
    },

    renderRadio(state) {
        let name;
        let description;
        const value = this.props.parameter.value === state;
        if (state === true) {
            name = this.props.parameter.trueName || this.props.parameter.name;
            description = this.props.parameter.trueDescription || this.props.parameter.description;
        } else {
            name = this.props.parameter.falseName || this.props.parameter.name;
            description = this.props.parameter.falseDescription || this.props.parameter.description;
        }
        return (
            <div>
                <button type='button'
                        className={Styles.btnRadio}
                        title={description}
                        onClick={this.onClick}>
                    {value && <Icon glyph={Icon.GLYPHS.radioOn}/>}
                    {!value && <Icon glyph={Icon.GLYPHS.radioOff}/>}
                    {name}
                </button>
            </div>
        );
    },

    render() {
        return (
            <div>
                {!this.props.parameter.hasNamedStates && this.renderCheckbox()}
                {this.props.parameter.hasNamedStates && <div>{this.renderRadio(true)}{this.renderRadio(false)}</div>}
            </div>
        );
    }
});

module.exports = BooleanParameterEditor;
