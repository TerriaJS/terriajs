import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import React from 'react';

import ObserveModelMixin from '../../ObserveModelMixin';
import DateTimePicker from './DateTimePicker';

const CatalogItemDateTimePicker = createReactClass({
    displayName: 'CatalogItemDateTimePicker',
    mixins: [ObserveModelMixin],

    propTypes: {
        item: PropTypes.object,
        onChange: PropTypes.func
    },

    render() {
      const availableDates = this.props.item.getAvailableDates();
      const currentDate = availableDates[this.props.item.intervals.indexOf(this.props.item.clockForDisplay.currentTime)];
      return <DateTimePicker name={this.props.item.name} currentDate={currentDate} dates={availableDates} onChange={this.props.onChange}/>;
    }
});

module.exports = CatalogItemDateTimePicker;
