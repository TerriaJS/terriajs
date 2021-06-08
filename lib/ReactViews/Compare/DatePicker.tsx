import dateFormat from "dateformat";
import { action } from "mobx";
import { observer } from "mobx-react";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import styled, { DefaultTheme, ThemeProvider } from "styled-components";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import DiscretelyTimeVaryingMixin from "../../ModelMixins/DiscretelyTimeVaryingMixin";
import CommonStrata from "../../Models/CommonStrata";
import { Comparable } from "../../Models/Comparable";
import Button from "../../Styled/Button";
import Icon, { StyledIcon } from "../../Styled/Icon";
import { formatDateTime } from "../BottomDock/Timeline/DateFormats";
import DateTimePicker, {
  DateButton,
  Grid,
  GridBody,
  GridHeading
} from "../BottomDock/Timeline/DateTimePicker";

type Side = "left" | "right";

type PropsType = {
  item: Comparable | undefined;
  side: Side;
};

const lightTheme = (theme: DefaultTheme) => ({
  ...theme,
  dark: "white",
  textLight: theme.textDark,
  colorPrimary: "black",
  overlay: "#cccccc"
});

const DatePicker: React.FC<PropsType> = observer(props => {
  const [t] = useTranslation();
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  // Check if the item has dates, otherwise render nothing
  const item:
    | DiscretelyTimeVaryingMixin.DiscretelyTimeVaryingMixin
    | undefined =
    DiscretelyTimeVaryingMixin.isMixedInto(props.item) &&
    (props.item.discreteTimes?.length ?? 0) > 0
      ? props.item
      : undefined;
  if (item === undefined) {
    return null;
  }

  const date =
    item.currentDiscreteJulianDate &&
    JulianDate.toDate(item.currentDiscreteJulianDate);
  const dateString = date && getFormattedDate(date);

  const changeDate = action((date: Date) => {
    item.setTrait(CommonStrata.user, "currentTime", date.toISOString());
  });

  const openDatePicker = (e: React.MouseEvent) => {
    setIsPickerOpen(true);
    e.stopPropagation();
  };

  return (
    <Container side={props.side}>
      <PrevButton
        disabled={item.isPreviousDiscreteTimeAvailable === false}
        onClick={() => item.moveToPreviousDiscreteTime(CommonStrata.user)}
      />
      <DatePickerButton onClick={openDatePicker}>
        <Prefix>{t(`compare.dateButton.${props.side}`)}</Prefix>
        {dateString ?? t("compare.dateButton.select")}
      </DatePickerButton>
      <NextButton
        disabled={item.isNextDiscreteTimeAvailable === false}
        onClick={() => item.moveToNextDiscreteTime(CommonStrata.user)}
      />
      <PickerContainer isOpen={isPickerOpen}>
        <ThemeProvider theme={lightTheme}>
          <StyledDateTimePicker
            currentDate={date}
            dates={item.objectifiedDates}
            onChange={changeDate}
            openDirection="none"
            isOpen={isPickerOpen}
            onOpen={() => setIsPickerOpen(true)}
            onClose={() => setIsPickerOpen(false)}
            showCloseButtonInTitle={true}
            selectedTimeMarkerComponent={SelectedTimeMarker}
            scrollToSelectedTime={true}
            backIcon={BackIcon}
            closeIcon={CloseIcon}
          />
        </ThemeProvider>
      </PickerContainer>
    </Container>
  );
});

function getFormattedDate(date: Date, format?: string): string {
  return format ? dateFormat(date, format) : formatDateTime(date);
}

const PagerButton = styled(Button).attrs({
  iconProps: {
    css: "margin-right:0;"
  },
  shortMinHeight: true,
  padding: 0
})`
  cursor: pointer;
  background-color: white;
  width: 40px;

  ${({ theme }) => theme.centerWithFlex()}
  flex-direction: column;

  &[disabled] {
    opacity: 1;
    background: white;
    svg {
      opacity: 0.3;
    }
  }

  &:hover,
  &:focus {
    opacity: 1;
  }
`;

const PrevButton = styled(PagerButton).attrs({
  renderIcon: () => (
    <StyledIcon
      css="transform:rotate(90deg);"
      dark
      styledWidth="10px"
      glyph={Icon.GLYPHS.arrowDown}
    />
  )
})`
  border-right: 0px;
  ${({ theme }) => theme.borderRadiusLeft(theme.radius40Button)}
`;

const NextButton = styled(PagerButton).attrs({
  renderIcon: () => (
    <StyledIcon
      css="transform:rotate(270deg);"
      dark
      styledWidth="10px"
      glyph={Icon.GLYPHS.arrowDown}
    />
  )
})`
  border-left: 0px;
  ${({ theme }) => theme.borderRadiusRight(theme.radius40Button)}
`;

const DatePickerButton = styled(Button).attrs({
  shortMinHeight: true
})<{
  isOpen: boolean;
}>`
  z-index: 0;
  flex-grow: 1;
  ${props => props.isOpen && `z-index: 1000;`};
  background-color: white;
  border-radius: 0px;
  border-width: 0 1px 0 1px;
  padding: 0;

  &:hover,
  &:focus {
    opacity: 1;
  }
`;

const Prefix = styled.span`
  &:after {
    content: ": ";
  }
`;

const StyledDateTimePicker = styled(DateTimePicker)`
  width: 100%;

  > .inner {
    box-sizing: border-box;
    width: 100%;
    height: 250px;
    top: -216px; // height - DatePickerButton height
    padding-left: 0px;
    padding-right: 0px;

    > ${Grid} {
      padding: 0px;
    }

    & ${GridHeading} {
      font-weight: bold;
      color: black;
      padding-bottom: 10px;
      margin-bottom: 5px;
      border-bottom: 1px solid #c0c0c0;
    }
  }

  & ${DateButton} {
    min-height: 35px;
    font-size: 13px;
  }

  & .century-grid ${DateButton} {
    width: 80%;
    margin: 3px 10%;
  }

  & .time-grid ${DateButton} {
    width: 100%;
    border-radius: 0;
    margin: 0px;
    background: white;
    color: black;

    border-top: 1px solid #dfdfdf;

    &:first-child {
      border-top: 0;
    }
    &:last-child {
      border-bottom: 1px solid #dfdfdf;
    }
  }
`;

const SelectedTimeMarker = styled(StyledIcon).attrs({
  dark: true,
  styledWidth: "20px",
  styledHeight: "20px",
  glyph: Icon.GLYPHS.selected
})`
  display: inline;
  position: absolute;
  right: 0px;
`;

const BackIcon = styled(StyledIcon).attrs({
  glyph: Icon.GLYPHS.leftSmall,
  dark: true
})`
  width: 20px !important;
  height: 20px !important;
`;

const CloseIcon = styled(StyledIcon).attrs({
  glyph: Icon.GLYPHS.closeCircle,
  dark: true
})`
  width: 20px !important;
  height: 20px !important;
`;

const PickerContainer = styled.div<{ isOpen: boolean }>`
  display: ${p => (p.isOpen ? "block" : "none")};
  position: absolute;
  width: 100%;

  & > ${StyledDateTimePicker} {
    position: absolute;
  }
`;

const Container = styled.div<{ side: Side }>`
  position: relative;
  display: flex;
  justify-items: space-between;
  width: 270px;
  max-width: 100%;
  padding: 0;

  ${p => (p.side === "left" ? "margin-right: 20px;" : "margin-left: 20px;")}
`;

export default DatePicker;
