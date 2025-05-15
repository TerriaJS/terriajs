import DatePicker from "react-datepicker";
import { useTranslation } from "react-i18next";
import type { ObjectifiedDays } from "../../../../ModelMixins/DiscretelyTimeVaryingMixin";
import Spacing from "../../../../Styled/Spacing";
import * as DTP from "./DateTimePickerStyles";
import { monthNames } from "./utils";
import moment from "moment";
import isDefined from "../../../../Core/isDefined";

interface DayViewProps {
  year: number;
  month: number;
  datesObject: ObjectifiedDays;
  selectedDay?: number;
  onSelectDay: (date: Date | null) => void;
  onBackToYear: () => void;
  onBackToMonth: () => void;
}

export const DayView: React.FC<DayViewProps> = ({
  year,
  month,
  datesObject,
  selectedDay,
  onSelectDay,
  onBackToYear,
  onBackToMonth
}) => {
  const { t } = useTranslation();

  const dayObject = datesObject;
  if (!dayObject || dayObject.dates.length <= 1) {
    return null;
  }

  const days = dayObject.index;
  const daysToDisplay = days.map((d) =>
    moment().date(d).month(month!).year(year!)
  );
  const selected = isDefined(selectedDay)
    ? moment().date(selectedDay).month(month).year(year)
    : null;

  // Aside: You might think this implementation is clearer - use the first date available on each day.
  // However it fails because react-datepicker actually requires a moment() object for selected, not a Date object.
  // const monthObject = this.props.datesObject[this.currentDateIndice.year][this.currentDateIndice.month];
  // const daysToDisplay = Object.keys(monthObject).map(dayNumber => monthObject[dayNumber][0]);
  // const selected = isDefined(this.currentDateIndice.day) ? this.props.datesObject[this.currentDateIndice.year][this.currentDateIndice.month][this.currentDateIndice.day][0] : null;

  return (
    <div
      css={`
        text-align: center;
        margin-top: -10px;
      `}
    >
      <div>
        <DTP.BackButton title={t("dateTime.back")} onClick={onBackToYear}>
          {year}
        </DTP.BackButton>
        &nbsp;
        <DTP.BackButton title={t("dateTime.back")} onClick={onBackToMonth}>
          {monthNames[month]}
        </DTP.BackButton>
        <Spacing bottom={1} />
      </div>
      <DatePicker
        inline
        onChange={(momentDateObj: moment.Moment) => {
          onSelectDay(momentDateObj.toDate());
        }}
        includeDates={daysToDisplay}
        selected={selected}
      />
    </div>
  );
};
