import React from "react";
import styled from "styled-components";
import moment from "moment";
import classNames from "classnames";

import { formatDateTime } from "./DateFormats";
import Icon from "../../Icon";
import Styles from "./timeline.scss";
import { withTranslation, WithTranslation } from "react-i18next";
import { observer } from "mobx-react";
import { observable, runInAction, action, computed } from "mobx";
import isDefined from "../../../Core/isDefined";
import {
  AsJulian,
  ObjectifiedDates,
  ObjectifiedYears
} from "../../../ModelMixins/DiscretelyTimeVaryingMixin";

const dateFormat = require("dateformat");
const DatePicker = require("react-datepicker");

function daysInMonth(month: number, year: number) {
  const n = new Date(year, month, 0).getDate();
  return (Array.apply as any)(null, { length: n }).map(
    Number.call,
    Number
  ) as number[];
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

const StyledGrid = styled.span<{ active: boolean }>`
  background: ${p => p.theme.overlay};
  ${p =>
    p.active &&
    `
    & {
      background: ${p.theme.colorPrimary};
    }
    opacity: 0.9;
   `}
`;

interface PropsType extends WithTranslation {
  dates: ObjectifiedDates;
  currentDate?: Date; // JS Date object - must be an element of props.dates, or null/undefined.
  onChange: (date: Date) => void;
  openDirection?: string;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  showCalendarButton?: boolean;
  dateFormat?: string;
  popupStyle?: string;
}

type Granularity = "century" | "year" | "month" | "day" | "time" | "hour";

@observer
class DateTimePicker extends React.Component<PropsType> {
  public static defaultProps = {
    openDirection: "down"
  };

  @observable
  currentDateIndice: {
    century?: number;
    year?: number;
    month?: number;
    day?: number;
    time?: Date;
    hour?: number;
    granularity: Granularity;
  } = { granularity: "century" };

  componentWillMount() {
    const datesObject = this.props.dates;
    let defaultCentury: number | undefined;
    let defaultYear: number | undefined;
    let defaultMonth: number | undefined;
    let defaultDay: number | undefined;
    let defaultGranularity: Granularity = "century";

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

        if (dataFromThisYear.indice.length === 1) {
          // only one month data from this one year, need to check day then
          const soleMonth = dataFromThisYear.indice[0];
          const dataFromThisMonth = dataFromThisYear[soleMonth];
          defaultMonth = soleMonth;
          defaultGranularity = "month";

          if (dataFromThisMonth.indice.length === 1) {
            // only one day has data
            defaultDay = dataFromThisMonth.indice[0];
          }
        }
      }
    }
    this.currentDateIndice = {
      century: defaultCentury,
      year: defaultYear,
      month: defaultMonth,
      day: defaultDay,
      granularity: defaultGranularity
    };

    window.addEventListener("click", this.closePickerEventHandler.bind(this));
  }

  componentWillUnmount() {
    window.removeEventListener("click", () =>
      this.closePickerEventHandler.bind(this)
    );
  }

  closePickerEventHandler() {
    this.closePicker();
  }

  closePicker(newTime?: Date) {
    if (newTime !== undefined) {
      runInAction(() => (this.currentDateIndice.time = newTime));
    }

    if (this.props.onClose) {
      this.props.onClose();
    }
  }

  renderCenturyGrid(datesObject: ObjectifiedDates) {
    const centuries = datesObject.indice;
    if (datesObject.dates && datesObject.dates.length >= 12) {
      return (
        <div className={Styles.grid}>
          <div className={Styles.gridHeading}>Select a century</div>
          {centuries.map(c => (
            <button
              key={c}
              className={Styles.centuryBtn}
              onClick={() =>
                runInAction(() => (this.currentDateIndice.century = c))
              }
            >
              {c}00
            </button>
          ))}
        </div>
      );
    } else {
      return this.renderList(datesObject.dates);
    }
  }

  renderYearGrid(datesObject: ObjectifiedYears) {
    if (datesObject.dates && datesObject.dates.length > 12) {
      const years = datesObject.indice;
      const monthOfYear = (Array.apply as any)(null, { length: 12 }).map(
        Number.call,
        Number
      ) as number[];
      return (
        <div className={Styles.grid}>
          <div className={Styles.gridHeading}>Select a year</div>
          <div className={Styles.gridBody}>
            {years.map(y => (
              <div
                className={Styles.gridRow}
                key={y}
                onClick={() =>
                  runInAction(() => {
                    this.currentDateIndice.year = y;
                    this.currentDateIndice.month = undefined;
                    this.currentDateIndice.day = undefined;
                    this.currentDateIndice.time = undefined;
                  })
                }
              >
                <span className={Styles.gridLabel}>{y}</span>
                <span className={Styles.gridRowInner12}>
                  {monthOfYear.map(m => (
                    <StyledGrid
                      // className={datesObject[y][m] ? Styles.activeGrid : ""}
                      active={isDefined(datesObject[y][m])}
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
  }

  renderMonthGrid(datesObject: ObjectifiedYears) {
    const year = this.currentDateIndice.year;
    if (!isDefined(year)) {
      return null;
    }
    if (datesObject[year].dates && datesObject[year].dates.length > 12) {
      return (
        <div className={Styles.grid}>
          <div className={Styles.gridHeading}>
            <button
              className={Styles.backbtn}
              onClick={() => {
                runInAction(() => {
                  this.currentDateIndice.year = undefined;
                  this.currentDateIndice.month = undefined;
                  this.currentDateIndice.day = undefined;
                  this.currentDateIndice.time = undefined;
                });
              }}
            >
              {year}
            </button>
          </div>
          <div className={Styles.gridBody}>
            {monthNames.map((m, i) => (
              <div
                className={classNames(Styles.gridRow, {
                  [Styles.inactiveGridRow]: !isDefined(datesObject[year][i])
                })}
                key={m}
                onClick={() =>
                  isDefined(datesObject[year][i]) &&
                  runInAction(() => {
                    this.currentDateIndice.month = i;
                    this.currentDateIndice.day = undefined;
                    this.currentDateIndice.time = undefined;
                  })
                }
              >
                <span className={Styles.gridLabel}>{m}</span>
                <span className={Styles.gridRowInner31}>
                  {daysInMonth(i + 1, year).map(d => (
                    <StyledGrid
                      active={
                        isDefined(datesObject[year][i]) &&
                        isDefined(datesObject[year][i][d + 1])
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
  }

  renderDayView(datesObject: ObjectifiedYears) {
    if (
      !isDefined(this.currentDateIndice.year) ||
      !isDefined(this.currentDateIndice.month)
    ) {
      return null;
    }

    const dayObject =
      datesObject[this.currentDateIndice.year][this.currentDateIndice.month];
    if (dayObject.dates.length > 31) {
      // Create one date object per day, using an arbitrary time. This does it via Object.keys and moment().
      const days =
        datesObject[this.currentDateIndice.year][this.currentDateIndice.month]
          .indice;
      const daysToDisplay = days.map(d =>
        moment()
          .date(d)
          .month(this.currentDateIndice.month!)
          .year(this.currentDateIndice.year!)
      );
      const selected = isDefined(this.currentDateIndice.day)
        ? moment()
            .date(this.currentDateIndice.day!)
            .month(this.currentDateIndice.month)
            .year(this.currentDateIndice.year)
        : null;
      // Aside: You might think this implementation is clearer - use the first date available on each day.
      // However it fails because react-datepicker actually requires a moment() object for selected, not a Date object.
      // const monthObject = this.props.datesObject[this.currentDateIndice.year][this.currentDateIndice.month];
      // const daysToDisplay = Object.keys(monthObject).map(dayNumber => monthObject[dayNumber][0]);
      // const selected = isDefined(this.currentDateIndice.day) ? this.props.datesObject[this.currentDateIndice.year][this.currentDateIndice.month][this.currentDateIndice.day][0] : null;
      return (
        <div className={Styles.dayPicker}>
          <div>
            <button
              className={Styles.backbtn}
              onClick={() =>
                runInAction(() => {
                  this.currentDateIndice.year = undefined;
                  this.currentDateIndice.month = undefined;
                  this.currentDateIndice.day = undefined;
                  this.currentDateIndice.time = undefined;
                })
              }
            >
              {this.currentDateIndice.year}
            </button>
            <button
              className={Styles.backbtn}
              onClick={() =>
                runInAction(() => {
                  this.currentDateIndice.month = undefined;
                  this.currentDateIndice.day = undefined;
                  this.currentDateIndice.time = undefined;
                })
              }
            >
              {monthNames[this.currentDateIndice.month]}
            </button>
          </div>
          <DatePicker
            inline
            onChange={(momentDateObj: moment.Moment) =>
              runInAction(() => {
                this.currentDateIndice.day = momentDateObj.date();
              })
            }
            includeDates={daysToDisplay}
            selected={selected}
          />
        </div>
      );
    } else {
      return this.renderList(
        datesObject[this.currentDateIndice.year][this.currentDateIndice.month]
          .dates
      );
    }
  }

  renderList(items: Date[]) {
    if (isDefined(items)) {
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
                {isDefined(this.props.dateFormat)
                  ? dateFormat(item, this.props.dateFormat)
                  : formatDateTime(item)}
              </button>
            ))}
          </div>
        </div>
      );
    }
  }

  renderHourView(datesObject: ObjectifiedYears) {
    if (
      !isDefined(this.currentDateIndice.year) ||
      !isDefined(this.currentDateIndice.month) ||
      !isDefined(this.currentDateIndice.day)
    ) {
      return null;
    }
    const timeOptions = datesObject[this.currentDateIndice.year][
      this.currentDateIndice.month
    ][this.currentDateIndice.day].dates.map(m => ({
      value: m,
      label: formatDateTime(m)
    }));

    if (timeOptions.length > 24) {
      return (
        <div className={Styles.grid}>
          <div className={Styles.gridHeading}>
            {`Select an hour on ${this.currentDateIndice.day} ${
              monthNames[this.currentDateIndice.month + 1]
            } ${this.currentDateIndice.year}`}{" "}
          </div>
          <div className={Styles.gridBody}>
            {datesObject[this.currentDateIndice.year][
              this.currentDateIndice.month
            ][this.currentDateIndice.day].indice.map(item => (
              <button
                key={item}
                className={Styles.dateBtn}
                onClick={() =>
                  runInAction(() => {
                    this.currentDateIndice.hour = item;
                  })
                }
              >
                <span>
                  {item} : 00 - {item + 1} : 00
                </span>{" "}
                <span>
                  (
                  {
                    datesObject[this.currentDateIndice.year!][
                      this.currentDateIndice.month!
                    ][this.currentDateIndice.day!][item].length
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
        datesObject[this.currentDateIndice.year][this.currentDateIndice.month][
          this.currentDateIndice.day
        ].dates
      );
    }
  }

  renderMinutesView(datesObject: ObjectifiedYears) {
    if (
      !isDefined(this.currentDateIndice.year) ||
      !isDefined(this.currentDateIndice.month) ||
      !isDefined(this.currentDateIndice.day) ||
      !isDefined(this.currentDateIndice.hour)
    ) {
      return null;
    }
    const options =
      datesObject[this.currentDateIndice.year][this.currentDateIndice.month][
        this.currentDateIndice.day
      ][this.currentDateIndice.hour];
    return this.renderList(options);
  }

  @action
  goBack() {
    if (isDefined(this.currentDateIndice.time)) {
      if (!isDefined(this.currentDateIndice.month)) {
        this.currentDateIndice.year = undefined;
        this.currentDateIndice.day = undefined;
      }

      if (!isDefined(this.currentDateIndice.hour)) {
        this.currentDateIndice.day = undefined;
      }

      if (!isDefined(this.currentDateIndice.day)) {
        this.currentDateIndice.month = undefined;
      }

      this.currentDateIndice.hour = undefined;
      this.currentDateIndice.time = undefined;
    } else if (isDefined(this.currentDateIndice.hour)) {
      this.currentDateIndice.hour = undefined;
    } else if (isDefined(this.currentDateIndice.day)) {
      this.currentDateIndice.day = undefined;
    } else if (isDefined(this.currentDateIndice.month)) {
      this.currentDateIndice.month = undefined;
    } else if (isDefined(this.currentDateIndice.year)) {
      this.currentDateIndice.year = undefined;
    } else if (isDefined(this.currentDateIndice.century)) {
      this.currentDateIndice.century = undefined;
    }
  }

  @action
  toggleDatePicker() {
    if (!this.props.isOpen) {
      // When the date picker is opened, we should update the old state with the new currentDate, but to the same granularity.
      // The current date must be one of the available item.dates, or null/undefined.
      const currentDate = this.props.currentDate;
      if (isDefined(currentDate)) {
        Object.assign(this.currentDateIndice, {
          day: isDefined(this.currentDateIndice.day)
            ? currentDate.getDate()
            : undefined,
          month: isDefined(this.currentDateIndice.month)
            ? currentDate.getMonth()
            : undefined,
          year: isDefined(this.currentDateIndice.year)
            ? currentDate.getFullYear()
            : undefined,
          century: isDefined(this.currentDateIndice.century)
            ? Math.floor(currentDate.getFullYear() / 100)
            : undefined,
          time: currentDate
        });
      }

      this.props.onOpen();
    } else {
      this.props.onClose();
    }
  }

  render() {
    if (this.props.dates) {
      const datesObject = this.props.dates;
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
              css={`
                background: ${(p: any) => p.theme.dark};
              `}
            >
              <button
                className={Styles.backbutton}
                disabled={
                  !isDefined(
                    this.currentDateIndice[this.currentDateIndice.granularity]
                  )
                }
                type="button"
                onClick={() => this.goBack()}
              >
                <Icon glyph={Icon.GLYPHS.left} />
              </button>
              {!isDefined(this.currentDateIndice.century) &&
                this.renderCenturyGrid(datesObject)}
              {isDefined(this.currentDateIndice.century) &&
                !isDefined(this.currentDateIndice.year) &&
                this.renderYearGrid(
                  datesObject[this.currentDateIndice.century!]
                )}
              {isDefined(this.currentDateIndice.year) &&
                !isDefined(this.currentDateIndice.month) &&
                this.renderMonthGrid(
                  datesObject[this.currentDateIndice.century!]
                )}
              {isDefined(this.currentDateIndice.year) &&
                isDefined(this.currentDateIndice.month) &&
                !isDefined(this.currentDateIndice.day) &&
                this.renderDayView(
                  datesObject[this.currentDateIndice.century!]
                )}
              {isDefined(this.currentDateIndice.year) &&
                isDefined(this.currentDateIndice.month) &&
                isDefined(this.currentDateIndice.day) &&
                !isDefined(this.currentDateIndice.hour) &&
                this.renderHourView(
                  datesObject[this.currentDateIndice.century!]
                )}
              {isDefined(this.currentDateIndice.year) &&
                isDefined(this.currentDateIndice.month) &&
                isDefined(this.currentDateIndice.day) &&
                isDefined(this.currentDateIndice.hour) &&
                this.renderMinutesView(
                  datesObject[this.currentDateIndice.century!]
                )}
            </div>
          )}
        </div>
      );
    } else {
      return null;
    }
  }
}

export default withTranslation()(DateTimePicker);
