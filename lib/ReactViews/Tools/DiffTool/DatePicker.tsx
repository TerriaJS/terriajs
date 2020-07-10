import { action, computed, observable } from "mobx";
import { observer } from "mobx-react";
import React from "react";
import { WithTranslation, withTranslation } from "react-i18next";
import styled from "styled-components";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import DiffableMixin from "../../../ModelMixins/DiffableMixin";
import CommonStrata from "../../../Models/CommonStrata";
import { formatDateTime } from "../../BottomDock/Timeline/DateFormats";
import Icon from "../../Icon";

const DateTimePicker = require("../../../ReactViews/BottomDock/Timeline/DateTimePicker.jsx");
const dateFormat = require("dateformat");
const Box: any = require("../../../Styled/Box").default;
const Text: any = require("../../../Styled/Text").default;
const Button: any = require("../../../Styled/Button").default;

interface PropsType extends WithTranslation {
  title: string;
  item: DiffableMixin.Instance;
  popupStyle: string;
  externalOpenButton: React.RefObject<HTMLButtonElement>;
  onDateSet: () => void;
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
    this.props.onDateSet();
  }

  @action.bound
  onClickExternalButton(event: MouseEvent) {
    this.setIsOpen(true);
    // stopPropagation is required to prevent the datetime picker popup from closing when
    // the external button is clicked
    event.stopPropagation();
  }

  registerExternalButtonClick() {
    this.props.externalOpenButton.current?.addEventListener(
      "click",
      this.onClickExternalButton
    );
  }

  unregisterExternalButtonClick(
    externalOpenButton: React.RefObject<HTMLButtonElement>
  ) {
    externalOpenButton.current?.removeEventListener(
      "click",
      this.onClickExternalButton
    );
  }

  componentDidMount() {
    this.registerExternalButtonClick();
  }

  componentDidUpdate(prevProps: PropsType) {
    this.unregisterExternalButtonClick(prevProps.externalOpenButton);
    this.registerExternalButtonClick();
  }

  componentWillUnmount() {
    this.unregisterExternalButtonClick(this.props.externalOpenButton);
  }

  render() {
    const { title, item, t } = this.props;
    return (
      <Box column centered>
        <Text textLight semiBold>
          {title}
        </Text>
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
            {this.formattedCurrentDate || "-"}
          </DateButton>
          <NextButton
            disabled={item.isNextDiscreteTimeAvailable === false}
            title={t("diffTool.datePicker.nextDateTitle")}
            onClick={() => item.moveToNextDiscreteTime(CommonStrata.user)}
          />
        </Box>
        <div
          style={{
            display: this.isOpen ? "block" : "none",
            position: "absolute"
          }}
        >
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
      </Box>
    );
  }
}

const PagerButton = styled(Button).attrs({
  iconProps: {
    css: "margin-right:0;"
  }
})`
  cursor: pointer;
  background-color: ${props => props.theme.darkWithOverlay};
  width: 34px;
  height: 34px;
  border-radius: 2px 0 0 2px;
  border: 1px solid ${props => props.theme.darkWithOverlay};
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  svg {
    width: 8px;
    height: 8px;
    padding: 6px 0;
  }
`;

const PrevButton = styled(PagerButton).attrs({
  renderIcon: () => <Icon glyph={Icon.GLYPHS.previous} />
})`
  border-right: 1px solid rgba(255, 255, 255, 0.15);
`;

const NextButton = styled(PagerButton).attrs({
  renderIcon: () => <Icon glyph={Icon.GLYPHS.next} />
})`
  border-left: 1px solid rgba(255, 255, 255, 0.15);
`;

const DateButton = styled(Button).attrs({ secondary: true })`
  z-index: 1000; // So that we don't loose the button clicks to the date picker popup
  cursor: pointer;
  color: ${props => props.theme.textLight};
  background-color: ${props => props.theme.darkWithOverlay};
  min-width: 235px;
  // height: 34px;
  border-radius: 0px;
  border: 1px solid ${props => props.theme.darkWithOverlay};
`;

export default withTranslation()(DatePicker);
