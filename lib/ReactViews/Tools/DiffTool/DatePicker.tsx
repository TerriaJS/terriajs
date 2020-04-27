import { action, computed, observable } from "mobx";
import { observer } from "mobx-react";
import React from "react";
import { WithTranslation, withTranslation } from "react-i18next";
import styled from "styled-components";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import DiffableMixin from "../../../ModelMixins/DiffableMixin";
import CommonStrata from "../../../Models/CommonStrata";
import { formatDateTime } from "../../BottomDock/Timeline/DateFormats";

const DateTimePicker = require("../../../ReactViews/BottomDock/Timeline/DateTimePicker.jsx");
const dateFormat = require("dateformat");
const Box: any = require("../../../Styled/Box").default;
const Button: any = require("../../../Styled/Button").default;
const Icon: any = require("../../Icon");

interface PropsType extends WithTranslation {
  item: DiffableMixin.Instance;
  popupStyle: string;
}

@observer
class DatePicker extends React.Component<PropsType> {
  @observable private isOpen = false;

  @computed
  get currentDate(): Date | undefined {
    const date = this.props.item.currentDiscreteJulianDate;
    return date && JulianDate.toDate(date);
  }

  @computed
  get formattedCurrentDate() {
    if (this.currentDate === undefined) {
      return;
    }
    const dateFormatting = undefined; // TODO
    const formattedDate =
      dateFormatting !== undefined
        ? dateFormat(this.currentDate, dateFormatting)
        : formatDateTime(this.currentDate);
    return formattedDate;
  }

  @computed
  get availableDates(): Date[] {
    return (
      this.props.item.discreteTimesAsSortedJulianDates?.map(dt =>
        JulianDate.toDate(dt.time)
      ) || []
    );
  }

  @action.bound
  toggleOpen(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    this.isOpen = !this.isOpen;
    // stopPropagation is required to prevent the datetime picker popup from closing when
    // the date button is clicked
    e.stopPropagation();
  }

  @action.bound
  setIsOpen(isOpen: boolean) {
    this.isOpen = isOpen;
  }

  @action.bound
  changeCurrentDate(date: Date) {
    this.props.item.setTrait(
      CommonStrata.user,
      "currentTime",
      date.toISOString()
    );
  }

  render() {
    const { item, t } = this.props;
    return (
      <div>
        <Box>
          <PrevButton
            disabled={item.isPreviousDiscreteTimeAvailable === false}
            title={t("diffTool.datePicker.previousDateTitle")}
            onClick={() => item.moveToPreviousDiscreteTime(CommonStrata.user)}
          />
          <DateButton
            onClick={this.toggleOpen}
            title={t("diffTool.datePicker.dateButtonTitle")}
          >
            {this.formattedCurrentDate ||
              t("diffTool.datePicker.dateOutOfRange")}
          </DateButton>
          <NextButton
            disabled={item.isNextDiscreteTimeAvailable === false}
            title={t("diffTool.datePicker.nextDateTitle")}
            onClick={() => item.moveToNextDiscreteTime(CommonStrata.user)}
          />
        </Box>
        <div style={{ position: "absolute" }}>
          <DateTimePicker
            currentDate={this.currentDate}
            dates={this.availableDates}
            onChange={this.changeCurrentDate}
            popupStyle={this.props.popupStyle}
            openDirection="none"
            isOpen={this.isOpen}
            showCalendarButton={false}
            onOpen={() => this.setIsOpen(true)}
            onClose={() => this.setIsOpen(false)}
          />
        </div>
      </div>
    );
  }
}

const PrevButton = styled(Button).attrs({
  iconProps: { renderIcon: () => <Icon glyph={Icon.GLYPHS.previous} /> }
})``;

const NextButton = styled(Button).attrs({
  iconProps: { renderIcon: () => <Icon glyph={Icon.GLYPHS.next} /> }
})``;

const DateButton = styled(Button)``;

export default withTranslation()(DatePicker);
