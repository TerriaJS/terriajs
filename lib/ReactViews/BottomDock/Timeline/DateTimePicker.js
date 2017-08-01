import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import ObserveModelMixin from '../../ObserveModelMixin';

import Styles from './timeline.scss';

const DateTimePicker = createReactClass({
    displayName: 'DateTimePicker',
    mixins: [ObserveModelMixin],

    propTypes: {
        name: PropTypes.string,
        value: PropTypes.number,
        availableTimeStrings: PropTypes.array,
        onChange: PropTypes.func
    },

    getInitialState() {
        return {
            value: this.props.value
        };
    },

    onChange(event) {
        this.setState({value: event.target.value});
        this.props.onChange(event);
    },

    render() {
        return (
            <div className={Styles.textCell + ' ' + Styles.time} title="Selected date and time">
                <select className={Styles.field} name={this.props.name} value={this.state.value} onChange={this.onChange}>
                    {this.props.availableTimeStrings.map((title, index) => <option key={index} value={index}>{title}</option>)}
                </select>
            </div>
        );
    },
});

module.exports = DateTimePicker;
