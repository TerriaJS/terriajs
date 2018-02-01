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
        onChange: PropTypes.func,
        openDirection: PropTypes.string
    },

    render() {
      const item = this.props.item;
      return <DateTimePicker currentDate={item.discreteTime} dates={item.availableDates} onChange={this.props.onChange} openDirection={this.props.openDirection}/>;
    }
});

module.exports = CatalogItemDateTimePicker;
