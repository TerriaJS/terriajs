import React from "react";
import createReactClass from "create-react-class";
import dateFormat from "dateformat";
import DatePicker from "react-datepicker";
import moment from "moment";
import PropTypes from "prop-types";
import classNames from "classnames";
import uniq from "lodash.uniq";
import defined from "terriajs-cesium/Source/Core/defined";
import { formatDateTime } from "./DateFormats";
import Icon from "../../Icon.jsx";
import ObserveModelMixin from "../../ObserveModelMixin";
import Styles from "./timeline.scss";
import combine from "terriajs-cesium/Source/Core/combine";

function daysInMonth(month, year) {
  const n = new Date(year, month, 0).getDate();
  return Array.apply(null, { length: n }).map(Number.call, Number);
}

const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec"
];

const DateTimePicker = createReactClass({
  displayName: "DateTimePicker",
  mixins: [ObserveModelMixin],

  propTypes: {
    dates: PropTypes.array.isRequired, // Array of JS Date objects.
    currentDate: PropTypes.object, // JS Date object - must be an element of props.dates, or null/undefined.
    onChange: PropTypes.func.isRequired,
    openDirection: PropTypes.string,
    isOpen: PropTypes.bool.isRequired,
    onOpen: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
    showCalendarButton: PropTypes.bool,
    dateFormat: PropTypes.object,
    popupStyle: PropTypes.string
  },

  getDefaultProps() {
    return {
      currentDate: undefined,
      showCalendarButton: true,
      openDirection: "down"
    };
  },

  getInitialState() {
    return {
      century: null,
      year: null,
      month: null,
      day: null,
      time: null,
      hour: null,
      granularity: null
    };
  },

  /* eslint-disable-next-line camelcase */
  UNSAFE_componentWillMount() {
    const datesObject = objectifyDates(this.props.dates);
    let defaultCentury = null;
    let defaultYear = null;
    let defaultMonth = null;
    let defaultDay = null;
    let defaultGranularity = "century";

    if (datesObject.indice.length === 1) {
      // only one century
      const soleCentury = datesObject.indice[0];
      const dataFromThisCentury = datesObject[soleCentury];
      defaultCentury = soleCentury;

      if (dataFromThisCentury.indice.length === 1) {
        // only one year, check if this year has only one month
        const soleYear = dataFromThisCentury.indice[0];
        const dataFromThisYear = dataFromThisCentury[soleYear];
        defaultYear = soleYear;
        defaultGranularity = "year";

        if (dataFromThisYear.indice === 1) {
          // only one month data from this one year, need to check day then
          const soleMonth = dataFromThisYear.indice[0];
          const dataFromThisMonth = dataFromThisYear[soleMonth];
          defaultMonth = soleMonth;
          defaultGranularity = "month";

          if (dataFromThisMonth.indice === 1) {
            // only one day has data
            defaultDay = dataFromThisMonth.indice[0];
          }
        }
      }
    }
    this.setState({
      century: defaultCentury,
      year: defaultYear,
      month: defaultMonth,
      day: defaultDay,
      time: currentDate,
      granularity: defaultGranularity
    });
    const currentDate = this.props.currentDate;

    window.addEventListener("click", this.closePicker);
  },

  componentWillUnmount: function() {
    window.removeEventListener("click", this.closePicker);
  },

  closePicker(newTime) {
    if (newTime !== undefined) {
      this.setState({
        time: newTime
      });
    }

    if (this.props.onClose) {
      this.props.onClose();
    }
  },

  renderCenturyGrid(datesObject) {
    const centuries = datesObject.indice;
    if (datesObject.dates && datesObject.dates.length >= 12) {
      return (
        <div className={Styles.grid}>
          <div className={Styles.gridHeading}>Select a century</div>
          {centuries.map(c => (
            <button
              key={c}
              className={Styles.centuryBtn}
              onClick={() => this.setState({ century: c })}
            >
              {c}00
            </button>
          ))}
        </div>
      );
    } else {
      return this.renderList(datesObject.dates);
    }
  },

  renderYearGrid(datesObject) {
    if (datesObject.dates && datesObject.dates.length > 12) {
      const years = datesObject.indice;
      const monthOfYear = Array.apply(null, { length: 12 }).map(
        Number.call,
        Number
      );
      return (
        <div className={Styles.grid}>
          <div className={Styles.gridHeading}>Select a year</div>
          <div className={Styles.gridBody}>
            {years.map(y => (
              <div
                className={Styles.gridRow}
                key={y}
                onClick={() =>
                  this.setState({ year: y, month: null, day: null, time: null })
                }
              >
                <span className={Styles.gridLabel}>{y}</span>
                <span className={Styles.gridRowInner12}>
                  {monthOfYear.map(m => (
                    <span
                      className={datesObject[y][m] ? Styles.activeGrid : ""}
                      key={m}
                    />
                  ))}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    } else {
      return this.renderList(datesObject.dates);
    }
  },

  renderMonthGrid(datesObject) {
    const year = this.state.year;
    if (datesObject[year].dates && datesObject[year].dates.length > 12) {
      return (
        <div className={Styles.grid}>
          <div className={Styles.gridHeading}>
            <button
              className={Styles.backbtn}
              onClick={() => {
                this.setState({
                  year: null,
                  month: null,
                  day: null,
                  time: null
                });
              }}
            >
              {this.state.year}
            </button>
          </div>
          <div className={Styles.gridBody}>
            {monthNames.map((m, i) => (
              <div
                className={classNames(Styles.gridRow, {
                  [Styles.inactiveGridRow]: !defined(datesObject[year][i])
                })}
                key={m}
                onClick={() =>
                  defined(datesObject[year][i]) &&
                  this.setState({ month: i, day: null, time: null })
                }
              >
                <span className={Styles.gridLabel}>{m}</span>
                <span className={Styles.gridRowInner31}>
                  {daysInMonth(i + 1, year).map(d => (
                    <span
                      className={
                        defined(datesObject[year][i]) &&
                        defined(datesObject[year][i][d + 1])
                          ? Styles.activeGrid
                          : ""
                      }
                      key={d}
                    />
                  ))}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    } else {
      return this.renderList(datesObject[year].dates);
    }
  },

  renderDayView(datesObject) {
    if (
      datesObject[this.state.year][this.state.month].dates &&
      datesObject[this.state.year][this.state.month].dates.length > 31
    ) {
      // Create one date object per day, using an arbitrary time. This does it via Object.keys and moment().
      const days = datesObject[this.state.year][this.state.month].indice;
      const daysToDisplay = days.map(d =>
        moment()
          .date(d)
          .month(this.state.month)
          .year(this.state.year)
      );
      const selected = defined(this.state.day)
        ? moment()
            .date(this.state.day)
            .month(this.state.month)
            .year(this.state.year)
        : null;
      // Aside: You might think this implementation is clearer - use the first date available on each day.
      // However it fails because react-datepicker actually requires a moment() object for selected, not a Date object.
      // const monthObject = this.props.datesObject[this.state.year][this.state.month];
      // const daysToDisplay = Object.keys(monthObject).map(dayNumber => monthObject[dayNumber][0]);
      // const selected = defined(this.state.day) ? this.props.datesObject[this.state.year][this.state.month][this.state.day][0] : null;
      return (
        <div className={Styles.dayPicker}>
          <div>
            <button
              className={Styles.backbtn}
              onClick={() => {
                this.setState({
                  year: null,
                  month: null,
                  day: null,
                  time: null
                });
              }}
            >
              {this.state.year}
            </button>
            <button
              className={Styles.backbtn}
              onClick={() => {
                this.setState({ month: null, day: null, time: null });
              }}
            >
              {monthNames[this.state.month]}
            </button>
          </div>
          <DatePicker
            inline
            onChange={momentDateObj =>
              this.setState({ day: momentDateObj.date() })
            }
            includeDates={daysToDisplay}
            selected={selected}
          />
        </div>
      );
    } else {
      return this.renderList(
        datesObject[this.state.year][this.state.month].dates
      );
    }
  },

  renderList(items) {
    if (defined(items)) {
      return (
        <div className={Styles.grid}>
          <div className={Styles.gridHeading}>Select a time</div>
          <div className={Styles.gridBody}>
            {items.map(item => (
              <button
                key={formatDateTime(item)}
                className={Styles.dateBtn}
                onClick={() => {
                  this.closePicker(item);
                  this.props.onChange(item);
                }}
              >
                {defined(this.props.dateFormat)
                  ? dateFormat(item, this.props.dateFormat.currentTime)
                  : formatDateTime(item)}
              </button>
            ))}
          </div>
        </div>
      );
    }
  },

  renderHourView(datesObject) {
    const timeOptions = datesObject[this.state.year][this.state.month][
      this.state.day
    ].dates.map(m => ({
      value: m,
      label: formatDateTime(m)
    }));

    if (timeOptions.length > 24) {
      return (
        <div className={Styles.grid}>
          <div className={Styles.gridHeading}>
            {`Select an hour on ${this.state.day} ${
              monthNames[this.state.month + 1]
            } ${this.state.year}`}{" "}
          </div>
          <div className={Styles.gridBody}>
            {datesObject[this.state.year][this.state.month][
              this.state.day
            ].indice.map(item => (
              <button
                key={item}
                className={Styles.dateBtn}
                onClick={() => this.setState({ hour: item })}
              >
                <span>
                  {item} : 00 - {item + 1} : 00
                </span>{" "}
                <span>
                  (
                  {
                    datesObject[this.state.year][this.state.month][
                      this.state.day
                    ][item].length
                  }{" "}
                  options)
                </span>
              </button>
            ))}
          </div>
        </div>
      );
    } else {
      return this.renderList(
        datesObject[this.state.year][this.state.month][this.state.day].dates
      );
    }
  },

  renderMinutesView(datesObject) {
    const options =
      datesObject[this.state.year][this.state.month][this.state.day][
        this.state.hour
      ];
    return this.renderList(options);
  },

  goBack() {
    if (defined(this.state.time)) {
      if (!defined(this.state.month)) {
        this.setState({
          year: null,
          month: null,
          day: null
        });
      }

      if (!defined(this.state.hour)) {
        this.setState({
          day: null
        });
      }

      if (!defined(this.state.day)) {
        this.setState({
          month: null,
          day: null
        });
      }

      this.setState({
        hour: null,
        time: null
      });
    } else if (defined(this.state.hour)) {
      this.setState({
        hour: null,
        time: null
      });
    } else if (defined(this.state.day)) {
      this.setState({
        day: null,
        time: null,
        hour: null
      });
    } else if (defined(this.state.month)) {
      this.setState({
        month: null,
        time: null,
        day: null,
        hour: null
      });
    } else if (defined(this.state.year)) {
      this.setState({
        year: null,
        month: null,
        time: null,
        day: null,
        hour: null
      });
    } else if (defined(this.state.century)) {
      this.setState({
        century: null,
        year: null,
        month: null,
        time: null,
        day: null,
        hour: null
      });
    }
  },

  toggleDatePicker() {
    if (!this.props.isOpen) {
      // When the date picker is opened, we should update the old state with the new currentDate, but to the same granularity.
      // The current date must be one of the available item.dates, or null/undefined.
      const currentDate = this.props.currentDate;
      if (defined(currentDate)) {
        const newState = {
          day: defined(this.state.day) ? currentDate.getDate() : null,
          month: defined(this.state.month) ? currentDate.getMonth() : null,
          year: defined(this.state.year) ? currentDate.getFullYear() : null,
          century: defined(this.state.century)
            ? Math.floor(currentDate.getFullYear() / 100)
            : null,
          time: defined(this.state.time) ? currentDate : null
        };
        this.setState(newState);
      }

      this.props.onOpen();
    } else {
      this.props.onClose();
    }
  },

  render() {
    if (this.props.dates) {
      const datesObject = objectifyDates(this.props.dates);
      return (
        <div
          className={Styles.timelineDatePicker}
          onClick={event => {
            event.stopPropagation();
          }}
        >
          {this.props.showCalendarButton && (
            <button
              className={Styles.togglebutton}
              onClick={() => {
                this.toggleDatePicker();
              }}
            >
              <Icon glyph={Icon.GLYPHS.calendar} />
            </button>
          )}
          {this.props.isOpen && (
            <div
              className={classNames(Styles.datePicker, this.props.popupStyle, {
                [Styles.openBelow]: this.props.openDirection === "down"
              })}
            >
              <button
                className={Styles.backbutton}
                disabled={!this.state[this.state.granularity]}
                type="button"
                onClick={() => this.goBack()}
              >
                <Icon glyph={Icon.GLYPHS.left} />
              </button>
              {!defined(this.state.century) &&
                this.renderCenturyGrid(datesObject)}
              {defined(this.state.century) &&
                !defined(this.state.year) &&
                this.renderYearGrid(datesObject[this.state.century])}
              {defined(this.state.year) &&
                !defined(this.state.month) &&
                this.renderMonthGrid(datesObject[this.state.century])}
              {defined(this.state.year) &&
                defined(this.state.month) &&
                !defined(this.state.day) &&
                this.renderDayView(datesObject[this.state.century])}
              {defined(this.state.year) &&
                defined(this.state.month) &&
                defined(this.state.day) &&
                !defined(this.state.hour) &&
                this.renderHourView(datesObject[this.state.century])}
              {defined(this.state.year) &&
                defined(this.state.month) &&
                defined(this.state.day) &&
                defined(this.state.hour) &&
                this.renderMinutesView(datesObject[this.state.century])}
            </div>
          )}
        </div>
      );
    } else {
      return null;
    }
  }
});

function getOneYear(year, dates) {
  // All data from a given year.
  return dates.filter(d => d.getFullYear() === year);
}

function getOneMonth(yearData, monthIndex) {
  // All data from certain month of that year.
  return yearData.filter(y => y.getMonth() === monthIndex);
}

function getOneDay(monthData, dayIndex) {
  return monthData.filter(m => m.getDate() === dayIndex);
}

function getMonthForYear(yearData) {
  // get available months for a given year
  return uniq(yearData.map(d => d.getMonth()));
}

function getDaysForMonth(monthData) {
  // Get all available days given a month in a year.
  return uniq(monthData.map(m => m.getDate()));
}

function getOneHour(dayData, hourIndex) {
  // All data from certain month of that year.
  return dayData.filter(y => y.getHours() === hourIndex);
}

function getHoursForDay(dayData) {
  return uniq(dayData.map(m => m.getHours()));
}

function getOneCentury(century, dates) {
  return dates.filter(d => Math.floor(d.getFullYear() / 100) === century);
}

/**
 * Process an array of dates into layered objects of years, months and days.
 * @param  {Date[]} An array of dates.
 * @return {Object} Returns an object whose keys are years, whose values are objects whose keys are months (0=Jan),
 *   whose values are objects whose keys are days, whose values are arrays of all the datetimes on that day.
 */
function objectifyDates(dates) {
  const years = uniq(dates.map(date => date.getFullYear()));
  const centuries = uniq(years.map(year => Math.floor(year / 100)));
  const result = centuries.reduce(
    (accumulator, currentValue) =>
      combine(accumulator, objectifyCenturyData(currentValue, dates, years)),
    {}
  );
  result.dates = dates;
  result.indice = centuries;
  return result;
}

function objectifyCenturyData(century, dates, years) {
  // century is a number like 18, 19 or 20.
  const yearsInThisCentury = years.filter(
    year => Math.floor(year / 100) === century
  );
  const centuryData = getOneCentury(century, dates);
  const centuryDates = {
    [century]: yearsInThisCentury.reduce(
      (accumulator, currentValue) =>
        combine(accumulator, objectifyYearData(currentValue, dates, years)),
      {}
    )
  };
  centuryDates[century].dates = centuryData;
  centuryDates[century].indice = yearsInThisCentury;
  return centuryDates;
}

function objectifyYearData(year, dates) {
  const yearData = getOneYear(year, dates);
  const monthInYear = {};
  getMonthForYear(yearData).forEach(monthIndex => {
    const monthData = getOneMonth(yearData, monthIndex);
    const daysInMonth = {};

    getDaysForMonth(monthData).forEach(dayIndex => {
      daysInMonth.dates = monthData;
      daysInMonth.indice = getDaysForMonth(monthData);
      const hoursInDay = {};
      const dayData = getOneDay(monthData, dayIndex);
      getHoursForDay(dayData).forEach(hourIndex => {
        hoursInDay[hourIndex] = getOneHour(dayData, hourIndex);
        hoursInDay.dates = dayData;
        hoursInDay.indice = getHoursForDay(dayData);
      });

      daysInMonth[dayIndex] = hoursInDay;
    });
    monthInYear[monthIndex] = daysInMonth;
    monthInYear.indice = getMonthForYear(yearData);
    monthInYear.dates = yearData;
  });

  return { [year]: monthInYear };
}

module.exports = DateTimePicker;
