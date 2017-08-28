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
        dates: PropTypes.array,
        currentDate: PropTypes.object,
        availableTimeObjects: PropTypes.array,
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

    renderYearGrid(objectifiedDates) {
      const years = Object.keys(objectifiedDates);
      const monthOfYear = Array.apply(null, {length: 12}).map(Number.call, Number);
      return (
        <div className={Styles.grid}>
          <div className={Styles.gridHeading}>Select a year</div>
          <div className={Styles.gridBody}>{years.map(y => <div className={Styles.gridRow} key={y} onClick={() => this.setState({year: y, month: null, day: null, time: null})}>
          <span className={Styles.gridLabel}>{y}</span>
          <span className={Styles.gridRowInner12}>{monthOfYear.map(m => <span className={objectifiedDates[y][m] ? Styles.activeGrid : ''} key={m} ></span>)}</span></div>)}
        </div>
        </div>
      );
    },

    renderMonthGrid(objectifiedDates) {
      const year = this.state.year;
      return (
        <div className={Styles.grid}>
          <div className={Styles.gridHeading}>
            <button className={Styles.backbtn} onClick={()=>{this.setState({year: null, month: null, day: null, time: null});}}>{this.state.year}</button>
          </div>
          <div className={Styles.gridBody}>{monthNames.map((m, i) => <div className={classNames(Styles.gridRow, {[Styles.activeGridRow]: objectifiedDates[year][i]})} key={m} onClick={() => defined(objectifiedDates[year][i]) && this.setState({month: i, day: null, time: null})}>
          <span className={Styles.gridLabel}>{m}</span>
          <span className={Styles.gridRowInner31}>{daysInMonth(i + 1, year).map(d => <span className={ defined(objectifiedDates[year][i]) && defined(objectifiedDates[year][i][d + 1]) ? Styles.activeGrid : ''} key={d} ></span>)}</span></div>)}
        </div>
        </div>
      );
    },

    renderDayView(objectifiedDates) {
      // Create one date object per day, using an arbitrary time. This does it via Object.keys and moment().
      const days = Object.keys(objectifiedDates[this.state.year][this.state.month]);
      const daysToDisplay = days.map(d => moment().date(d).month(this.state.month).year(this.state.year));
      const selected = defined(this.state.day) ? moment().date(this.state.day).month(this.state.month).year(this.state.year) : null;
      // Aside: You might think this implementation is clearer - use the first date available on each day.
      // However it fails because react-datepicker actually requires a moment() object for selected, not a Date object.
      // const monthObject = this.props.objectifiedDates[this.state.year][this.state.month];
      // const daysToDisplay = Object.keys(monthObject).map(dayNumber => monthObject[dayNumber][0]);
      // const selected = defined(this.state.day) ? this.props.objectifiedDates[this.state.year][this.state.month][this.state.day][0] : null;
      return (
        <div className={Styles.dayPicker}>
          <div>
            <button className={Styles.backbtn} onClick={() => {this.setState({year: null, month: null, day: null, time: null}); }}>{this.state.year}</button>
            <button className={Styles.backbtn} onClick={() => {this.setState({month: null, day: null, time: null}); }}>{monthNames[this.state.month]}</button>
          </div>
            <DatePicker
                inline
                onChange={(value) => this.setState({day: value.date(), time: null})}
                includeDates={daysToDisplay}
                selected={selected}
            />
        </div>
      );
    },

    utsTimeDisplay(m) {
      const hour = m.getUTCHours() < 10 ? `0${m.getUTCHours()}` : m.getUTCHours();
      const minute = m.getUTCMinutes() < 10 ? `0${m.getUTCMinutes()}` : m.getUTCMinutes();
      const second = m.getUTCSeconds() < 10 ? `0${m.getUTCSeconds()}` : m.getUTCSeconds();
      return `${hour}:${minute}:${second}`;
    },

    renderHourView(objectifiedDates) {
      const timeOptions = objectifiedDates[this.state.year][this.state.month][this.state.day].map((m) => ({
        value: m,
        label: this.utsTimeDisplay(m)
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

    renderDateSummary(time) {
      const m = new Date(time);
        return (
          <span>
            <span>{m.getUTCFullYear()} / {m.getUTCMonth() + 1} / {m.getUTCDate()}</span>
            <span>{this.utsTimeDisplay(m)}</span>
          </span>
        );
    },

    render() {
      if (this.props.dates) {
        const objectifiedDates = objectifyDates(this.props.dates);
        return (
            <div className={Styles.timelineDatePicker} onClick={(event) => { event.stopPropagation(); }}>
              <button className={Styles.togglebutton} onClick={() => { this.toggleDatePicker(); }}>
              {this.state.time ? this.renderDateSummary(this.state.time) : <Icon glyph={Icon.GLYPHS.calendar}/>}</button>
              {this.state.isOpen && <div className={Styles.datePicker}>
              <button className={Styles.backbutton} disabled={!this.state.year} type='button' onClick={() => this.goBack()}><Icon glyph={Icon.GLYPHS.left}/></button>
                {!defined(this.state.year) && this.renderYearGrid(objectifiedDates)}
                {defined(this.state.year) && !defined(this.state.month) && this.renderMonthGrid(objectifiedDates)}
                {(defined(this.state.year) && defined(this.state.month)) && this.renderDayView(objectifiedDates)}
                {(defined(this.state.year) && defined(this.state.month) && defined(this.state.day)) && this.renderHourView(objectifiedDates)}
              </div>}
            </div>
          );
      } else {
        return null;
      }
    }
});

function getOneYear(year, dates) {
  // al data from a given year
  return dates.filter(d => d.getUTCFullYear() === year);
}

function getOneMonth(yearData, monthIndex) {
  // all data from certain month of that year
  return yearData.filter(y => y.getUTCMonth() === monthIndex);
}

function getOneDay(monthData, dayIndex) {
  return monthData.filter(m => m.getUTCDate() === dayIndex);
}

function getMonthForYear(yearData) {
  // get available months for a given year
  return uniq(yearData.map(d => d.getUTCMonth()));
}

function getDaysForMonth(monthData) {
  // get all available days given a month in a year
  // start from 1, so we need to change to 0 based
  return uniq(monthData.map(m => m.getUTCDate()));
}

/**
 * Process an array of dates into layered objects of years, months and days.
 * @param  {Date[]} An array of dates.
 * @return {Object} Returns an object whose keys are years, whose values are objects whose keys are months (0=Jan),
 *   whose values are objects whose keys are days, whose values are arrays of all the datetimes on that day.
 */
function objectifyDates(dates) {
  const years = uniq(dates.map(d => d.getUTCFullYear()));
  const result = {};

  years.forEach(y => {
    const yearData = getOneYear(y, dates);
    const monthInYear = {};
    getMonthForYear(yearData).forEach(monthIndex => {
      const monthData = getOneMonth(yearData, monthIndex);
      const daysInMonth = {};

      getDaysForMonth(monthData).forEach(dayIndex => {
        daysInMonth[dayIndex] = getOneDay(monthData, dayIndex);
      });
      monthInYear[monthIndex] = daysInMonth;
    });
    result[y] = monthInYear;
  });
  return result;
}

module.exports = DateTimePicker;
