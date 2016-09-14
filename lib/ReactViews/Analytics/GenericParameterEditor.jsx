import React from 'react';
import ObserveModelMixin from '../ObserveModelMixin';

import Styles from './parameter-editors.scss';

const GenericParameterEditor = React.createClass({
    mixins: [ObserveModelMixin],
    propTypes: {
        previewed: React.PropTypes.object,
        parameter: React.PropTypes.object
    },

    onChange(e) {
        this.props.previewed.setParameterValues(this.props.parameter.id, e.target.value);
    },

    render() {
        const patternConstraint = this.props.parameter.constraints && this.props.parameter.constraints.pattern;
        return (
            <div className="constrainedTextField">
                <If condition={patternConstraint}>
                    <input className={Styles.field}
                                       type="text"
                                       onChange={this.onChange}
                                       pattern={patternConstraint}
                                       value={this.props.previewed.parameterValues[this.props.parameter.id]}
                    />
                </If>
                <If condition={!patternConstraint}>
                    <input className={Styles.field}
                                       type="text"
                                       onChange={this.onChange}
                                       value={this.props.previewed.parameterValues[this.props.parameter.id]}
                    />
                </If>
            </div>
        );
    }
});

module.exports = GenericParameterEditor;
