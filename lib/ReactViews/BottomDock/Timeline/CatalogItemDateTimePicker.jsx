import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import React from 'react';

import JulianDate from 'terriajs-cesium/Source/Core/JulianDate';

import ObserveModelMixin from '../../ObserveModelMixin';
import DateTimePicker from './DateTimePicker';

const CatalogItemDateTimePicker = createReactClass({
    displayName: 'CatalogItemDateTimePicker',
    mixins: [ObserveModelMixin],

    propTypes: {
        item: PropTypes.object,
        currentTime: PropTypes.object,  // pass this if you are using the item's own clock.
        onChange: PropTypes.func,
        openDirection: PropTypes.string
    },

    componentWillMount() {
      // Maintain a state that contains the timeline's currently shown JulianDate, which updates when the timeline changes.
      // If we didn't maintain this, when you open the DateTimePicker, it would show the last time you
      // selected from it - which may not be relevant any more, if the time was updated on the timeline afterwards.
      const item = this.props.item;
      this.removeTickEvent = item.terria.clock.onTick.addEventListener(clock => {
          if (!item.useOwnClock && !JulianDate.equals(clock.currentTime, this.state.currentTime)) {
              this.setStateToCurrentTime();
          }
      });
    },

    componentWillUnmount() {
      this.removeTickEvent();
    },

    setStateToCurrentTime() {
      this.setState(this.getInitialState());
    },

    getInitialState() {
      return {
          currentTime: this.props.item.clockForDisplay && this.props.item.clockForDisplay.currentTime
      };
    },

    render() {
      const item = this.props.item;
      const availableDates = item.availableDates;
      // The initial state often has currentTime: undefined, even though item.clockForDisplay.currentTime is available.
      // If the item is using its own clock, then the state is irrelevant - it's only set by the terria clock.
      const currentTime = this.props.currentTime || this.state.currentTime || item.clockForDisplay.currentTime;
      const currentDate = availableDates[item.intervals.indexOf(currentTime)];
      return <DateTimePicker currentDate={currentDate} dates={availableDates} onChange={this.props.onChange} openDirection={this.props.openDirection}/>;
    }
});

module.exports = CatalogItemDateTimePicker;
