import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import ObserveModelMixin from '../../ObserveModelMixin';
import DatePicker from 'react-datepicker';
// import 'react-datepicker/dist/react-datepicker.css';
import moment from 'moment';
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
        const index = this.props.availableTimeStrings.findIndex(s=>moment(s).format() === event.format());
        this.setState({value: index});
        this.props.onChange(index);
    },

    onSelect(event){
      console.log(event);
    },

    render() {
      // we need to have a
      const dates = this.props.availableTimeStrings.map(s=>moment(s))
        return (
            <div className={Styles.textCell + ' ' + Styles.time} title="Selected date and time">
            <DatePicker
                peekNextMonth
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
                includeDates={dates}
                placeholderText="select date"
                selected={moment(this.props.availableTimeStrings[this.props.value])}
                onChange={this.onChange}
                onSelect={this.onSelect}
            />
            </div>
        );
    }
});

module.exports = DateTimePicker;
