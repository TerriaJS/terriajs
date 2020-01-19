import dateFormat from "dateformat";
import defined from "terriajs-cesium/Source/Core/defined";
import PropTypes from "prop-types";
import React, { useState } from "react";
import { formatDateTime } from "../../BottomDock/Timeline/DateFormats";
import DateTimePicker from "../../../ReactViews/BottomDock/Timeline/DateTimePicker.jsx";
import Icon from "../../Icon.jsx";
import Styles from "./delta-tool.scss";
import { withTranslation } from "react-i18next";

/**
 * Primary and secondary date pickers for delta tool
 */
function DatePickers({
  item,
  primaryDate,
  setPrimaryDate,
  secondaryDate,
  setSecondaryDate,
  t
}) {
  const pickers = [useDatePickerState(), useDatePickerState()];

  // Set a pickers state. If the target picker opens, close the other.
  const setIsOpen = (pickerId, isOpen) => {
    const [thisPicker, otherPicker] =
      pickerId === 0 ? pickers : [pickers[1], pickers[0]];
    thisPicker.setIsOpen(isOpen);
    if (isOpen) {
      otherPicker.setIsOpen(false); // close other picker
    }
  };

  const availableDates = item.availableDates;
  const dateFormatting = item.dateFormat && item.dateFormat.currentTime;
  return (
    <div className={Styles.datePickers}>
      <section>
        <h4>{t("deltaTool.primaryImage")}</h4>
        <div title="Select a time">
          <DatePicker
            date={primaryDate}
            setDate={setPrimaryDate}
            availableDates={availableDates}
            dateFormatting={dateFormatting}
            isOpen={pickers[0].isOpen}
            setIsOpen={isOpen => setIsOpen(0, isOpen)}
          />
        </div>
      </section>
      <section>
        <h4>{t("deltaTool.secondaryImage")}</h4>
        <div title="Select a time">
          <DatePicker
            date={secondaryDate}
            setDate={setSecondaryDate}
            availableDates={availableDates}
            dateFormatting={dateFormatting}
            isOpen={pickers[1].isOpen}
            setIsOpen={isOpen => setIsOpen(1, isOpen)}
          />
        </div>
      </section>
    </div>
  );
}

DatePickers.propTypes = {
  item: PropTypes.object.isRequired,
  primaryDate: PropTypes.object.isRequired,
  setPrimaryDate: PropTypes.func.isRequired,
  secondaryDate: PropTypes.object.isRequired,
  setSecondaryDate: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired
};

/**
 * Delta tool date picker
 */
function DatePicker({
  date,
  availableDates,
  setDate,
  dateFormatting,
  isOpen,
  setIsOpen
}) {
  const toggleOpen = e => {
    setIsOpen(!isOpen);
    e.stopPropagation();
  };

  const formattedDate = defined(dateFormatting)
    ? dateFormat(date, dateFormatting)
    : formatDateTime(date);

  const { prevDate, nextDate } = findNextAndPrevDates(date, availableDates);
  return (
    <div>
      <div className={Styles.pickerButtons}>
        <button
          className={Styles.previousDate}
          title="Previous time"
          disabled={!defined(prevDate)}
          onClick={() => setDate(prevDate)}
        >
          <Icon glyph={Icon.GLYPHS.previous} />
        </button>
        <button
          className={Styles.currentDate}
          onClick={toggleOpen}
          title="Select a time"
        >
          {defined(formattedDate) ? formattedDate : "Currently out of range."}
        </button>
        <button
          className={Styles.nextDate}
          title="Next time"
          disabled={!defined(nextDate)}
          onClick={() => setDate(nextDate)}
        >
          <Icon glyph={Icon.GLYPHS.next} />
        </button>
      </div>
      <div className={Styles.picker}>
        <DateTimePicker
          currentDate={date}
          dates={availableDates}
          onChange={setDate}
          popupStyle={Styles.datePickerPopup}
          openDirection="none"
          isOpen={isOpen}
          showCalendarButton={false}
          onOpen={() => setIsOpen(true)}
          onClose={() => setIsOpen(false)}
        />
      </div>
    </div>
  );
}

DatePicker.propTypes = {
  date: PropTypes.object.isRequired,
  setDate: PropTypes.func.isRequired,
  availableDates: PropTypes.array.isRequired,
  dateFormatting: PropTypes.string,
  isOpen: PropTypes.bool,
  setIsOpen: PropTypes.func.isRequired
};

function findNextAndPrevDates(date, availableDates) {
  const dateIndex = availableDates.indexOf(date);
  const prevDate = dateIndex > 0 ? availableDates[dateIndex - 1] : undefined;
  const nextDate =
    dateIndex < availableDates.length - 1
      ? availableDates[dateIndex + 1]
      : undefined;
  return { prevDate, nextDate };
}

function useDatePickerState() {
  const [isOpen, setIsOpen] = useState(false);
  return { isOpen, setIsOpen };
}

export default withTranslation()(DatePickers);
