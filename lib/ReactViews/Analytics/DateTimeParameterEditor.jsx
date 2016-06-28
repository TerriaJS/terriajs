import React from 'react';
import ObserveModelMixin from '../ObserveModelMixin';

import Styles from './parameter-editors.scss';

const DateTimeParameterEditor = React.createClass({
    mixins: [ObserveModelMixin],
    propTypes: {
        previewed: React.PropTypes.object,
        parameter: React.PropTypes.object,
        parameterValues: React.PropTypes.object
    },

    getInitialState() {
        return this.getDateTime();
    },

    getDateTime() {
        const dateTimeBreakOut = {};
        const timeDate = this.props.parameterValues[this.props.parameter.id];
        if (timeDate !== undefined) {
            const splits = timeDate.split('T');
            dateTimeBreakOut.date = splits[0];
            if (splits[1].length === 0) {
                dateTimeBreakOut.time = '00:00';
            } else {
                dateTimeBreakOut.time = splits[1];
            }
        } else {
            dateTimeBreakOut.date = '';
            dateTimeBreakOut.time = '00:00';
        }

        this.setDateTime(dateTimeBreakOut);

        return dateTimeBreakOut;
    },

    setDateTime(dateTime) {
        if (dateTime.date && dateTime.time) {
            this.props.parameterValues[this.props.parameter.id] = dateTime.date + 'T' + dateTime.time;
        } else {
            this.props.parameterValues[this.props.parameter.id] = undefined;
        }
    },

    onChangeDate(e) {
        const dateTimeBreakOut = this.getDateTime();
        dateTimeBreakOut.date = e.target.value;
        this.setDateTime(dateTimeBreakOut);
        this.setState(dateTimeBreakOut);
    },

    onChangeTime(e) {
        const dateTimeBreakOut = this.getDateTime();
        dateTimeBreakOut.time = e.target.value;
        this.setDateTime(dateTimeBreakOut);
        this.setState(dateTimeBreakOut);
    },

    render() {
        return (<div>
            <input className={Styles.field}
                   type="date"
                   placeholder="YYYY-MM-DD"
                   onChange={this.onChangeDate}
                   value={this.state.date}/>
            <input className={Styles.field}
                   type="time"
                   placeholder="HH:mm:ss.sss"
                   onChange={this.onChangeTime}
                   value={this.state.time}/>
        </div>);
    }
});

module.exports = DateTimeParameterEditor;
