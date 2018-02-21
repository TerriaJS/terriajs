'use strict';

import React from 'react';
import createReactClass from 'create-react-class';
import classNames from 'classnames';
import PropTypes from 'prop-types';

import defined from 'terriajs-cesium/Source/Core/defined';
import JulianDate from 'terriajs-cesium/Source/Core/JulianDate';

import DateTimePicker from '../../BottomDock/Timeline/DateTimePicker';
import ObserveModelMixin from '../../ObserveModelMixin';
import {formatDateTime} from '../../BottomDock/Timeline/DateFormats';
import Styles from './datetime-selector-section.scss';
import Icon from '../../Icon.jsx';

const DateTimeSelectorSection = createReactClass({
    displayName: 'DateTimeSelectorSection',

    mixins: [ObserveModelMixin],

    propTypes: {
        item: PropTypes.object.isRequired
    },

    changeDateTime(time) {
        // Set the time on the item, set it to use its own clock, update the imagery and repaint.
        const item = this.props.item;
        const targetJulianDate = JulianDate.fromDate(new Date(time));
        item.updateCurrentTime(targetJulianDate);
        item.terria.currentViewer.notifyRepaintRequired();
    },

    onTimelineButtonClicked() {
        const item = this.props.item;
        item.useOwnClock = !item.useOwnClock;
        item.useClock(); // Adds this item to the timeline.
        item.terria.currentViewer.notifyRepaintRequired();
    },

    render() {
        const item = this.props.item;
        const discreteTime = item.discreteTime;

        if (!item.canUseOwnClock || !defined(discreteTime) || !defined(item.availableDates)) {
            return null;
        }
        return (
            <div className={Styles.datetimeSelector}>
                <div className={Styles.title}>Time:</div>
                <div className={Styles.datetimeSelectorInner}>
                  <div className={Styles.datetimeAndPicker}>
                      <button className={Styles.datetimePrevious} disabled={!item.isPreviousTimeAvaliable()} onClick={item.moveToPreviousTime.bind(item)} title='Previous time'><Icon glyph={Icon.GLYPHS.previous}/></button>
                      <span className={Styles.currentDate}>{defined(discreteTime) && formatDateTime(discreteTime)}</span>
                      <button className={Styles.datetimeNext} disabled={!item.isNextTimeAvaliable()} onClick={item.moveToNextTime.bind(item)} title='Next time'><Icon glyph={Icon.GLYPHS.next}/></button>
                  </div>
                  <div className={Styles.picker} title='Select a time'>
                      <DateTimePicker currentDate={discreteTime} dates={item.availableDates} onChange={this.changeDateTime} openDirection='down'/>
                  </div>
                  <button className={classNames(Styles.timelineButton, {[Styles.timelineActive]: !item.useOwnClock})} type='button' onClick={this.onTimelineButtonClicked} title='Use timeline'>
                      <Icon glyph={Icon.GLYPHS.timeline}/>
                  </button>
                </div>
            </div>
        );
    },
});

module.exports = DateTimeSelectorSection;
