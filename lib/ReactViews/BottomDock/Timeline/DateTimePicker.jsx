import React from 'react';
import createReactClass from 'create-react-class';
import DatePicker from 'react-datepicker';
import moment from 'moment';
import PropTypes from 'prop-types';
import uniq from 'lodash.uniq';
import classNames from 'classnames';

import defined from 'terriajs-cesium/Source/Core/defined';

import ObserveModelMixin from '../../ObserveModelMixin';
import Styles from './timeline.scss';
import Icon from '../../Icon.jsx';
import {formatDateTime} from './DateFormats';

function daysInMonth(month,year) {
  const n = new Date(year, month, 0).getDate();
  return Array.apply(null, {length: n}).map(Number.call, Number);
}

const monthNames = [ "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" ];

const DateTimePicker = createReactClass({
    displayName: 'DateTimePicker',
    mixins: [ObserveModelMixin],

    propTypes: {
        name: PropTypes.string,
        dates: PropTypes.object,
        currentDate: PropTypes.object,
        onChange: PropTypes.func
    },

    getInitialState() {
        return {
          isOpen: false,
          year: null,
          month: null,
          day: null,
          time: null
        };
    },

    componentWillMount() {
      const currentDate = this.props.currentDate;
      if (currentDate) {
        this.setState({
          year: currentDate.getUTCFullYear(),
          month: currentDate.getUTCMonth(),
          day: currentDate.getUTCDate(),
          time: currentDate
        });
      }
      window.addEventListener('click', this.closePicker);
    },

    componentWillUnmount: function() {
    window.removeEventListener('click', this.closePicker);
   },

    closePicker() {
      this.setState({isOpen: false});
    },

    renderYearGrid(dates) {
      const years = Object.keys(dates);
      const monthOfYear = Array.apply(null, {length: 12}).map(Number.call, Number);
      return (
        <div className={Styles.grid}>
          <div className={Styles.gridHeading}>Select a year</div>
          <div className={Styles.gridBody}>{years.map(y => <div className={Styles.gridRow} key={y} onClick={() => this.setState({year: y, month: null, day: null, time: null})}>
            <span className={Styles.gridLabel}>{y}</span>
            <span className={Styles.gridRowInner12}>{monthOfYear.map(m => <span className={dates[y][m] ? Styles.activeGrid : ''} key={m} ></span>)}</span></div>)}
          </div>
        </div>
      );
    },

    renderMonthGrid(dates) {
      const year = this.state.year;
      return (
        <div className={Styles.grid}>
          <div className={Styles.gridHeading}>
            <button className={Styles.backbtn} onClick={()=>{this.setState({year: null, month: null, day: null, time: null});}}>{this.state.year}</button>
          </div>
          <div className={Styles.gridBody}>{monthNames.map((m, i) => <div className={classNames(Styles.gridRow, {[Styles.inactiveGridRow]: !defined(dates[year][i])})} key={m} onClick={() => defined(dates[year][i]) && this.setState({month: i, day: null, time: null})}>
            <span className={Styles.gridLabel}>{m}</span>
            <span className={Styles.gridRowInner31}>{daysInMonth(i + 1, year).map(d => <span className={ defined(dates[year][i]) && defined(dates[year][i][d + 1]) ? Styles.activeGrid : ''} key={d} ></span>)}</span></div>)}
          </div>
        </div>
      );
    },

    renderDayView(dates) {
      // Create one date object per day, using an arbitrary time. This does it via Object.keys and moment().
      const days = Object.keys(dates[this.state.year][this.state.month]);
      const daysToDisplay = days.map(d => moment().date(d).month(this.state.month).year(this.state.year));
      const selected = defined(this.state.day) ? moment().date(this.state.day).month(this.state.month).year(this.state.year) : null;
      // Aside: You might think this implementation is clearer - use the first date available on each day.
      // However it fails because react-datepicker actually requires a moment() object for selected, not a Date object.
      // const monthObject = this.props.dates[this.state.year][this.state.month];
      // const daysToDisplay = Object.keys(monthObject).map(dayNumber => monthObject[dayNumber][0]);
      // const selected = defined(this.state.day) ? this.props.dates[this.state.year][this.state.month][this.state.day][0] : null;

      return (
        <div className={Styles.dayPicker}>
          <div>
            <button className={Styles.backbtn} onClick={() => {this.setState({year: null, month: null, day: null, time: null}); }}>{this.state.year}</button>
            <button className={Styles.backbtn} onClick={() => {this.setState({month: null, day: null, time: null}); }}>{monthNames[this.state.month]}</button>
          </div>
            <DatePicker
                inline
                onChange={this.selectDay.bind(this, dates)}
                includeDates={daysToDisplay}
                selected={selected}
            />
        </div>
      );
    },

    selectDay(dates, value) {
      const selectedTime = dates[this.state.year][this.state.month][value.date()][0];
      this.setState({day: value.date(), time: selectedTime});
      this.props.onChange(selectedTime);
    },

    renderHourView(dates) {
      const timeOptions = dates[this.state.year][this.state.month][this.state.day].map((m) => ({
        value: m,
        label: formatDateTime(m)
      }));

      return (
        <div className={Styles.hourview}>
          <select onChange={(event) => {this.setState({time: event.target.value}); this.props.onChange(event.target.value); }} value={this.state.time ? this.state.time: ''}>
            <option value=''>Select a time</option>
            {timeOptions.map(t => <option key={t.label} value={t.value}>{t.label}</option>)}
          </select>
        </div>
      );
    },

    goBack() {
      if (defined(this.state.time)) {
        this.setState({
          month: null,
          time: null,
          day: null
        });
      } else if (defined(this.state.day)) {
        this.setState({
          month: null,
          time: null,
          day: null
        });
      } else if (defined(this.state.month)) {
        this.setState({
          month: null,
          time: null,
          day: null
        });
      } else if (defined(this.state.year)) {
        this.setState({
          year: null,
          month: null,
          time: null,
          day: null
        });
      }
    },

    toggleDatePicker() {
      this.setState({
        isOpen: !this.state.isOpen
      });
    },

    render() {
      if (this.props.dates) {
        const dates = this.props.dates;
        return (
            <div className={Styles.timelineDatePicker} onClick={(event) => { event.stopPropagation(); }}>
              <button className={Styles.togglebutton} onClick={() => { this.toggleDatePicker(); }}><Icon glyph={Icon.GLYPHS.calendar}/></button>
              {this.state.isOpen && <div className={Styles.datePicker}>
              <button className={Styles.backbutton} disabled={!this.state.year} type='button' onClick={() => this.goBack()}><Icon glyph={Icon.GLYPHS.left}/></button>
                {!defined(this.state.year) && this.renderYearGrid(dates)}
                {defined(this.state.year) && !defined(this.state.month) && this.renderMonthGrid(dates)}
                {(defined(this.state.year) && defined(this.state.month)) && this.renderDayView(dates)}
                {(defined(this.state.year) && defined(this.state.month) && defined(this.state.day)) && this.renderHourView(dates)}
              </div>}
            </div>
          );
      } else {
        return null;
      }
    }
});



module.exports = DateTimePicker;
