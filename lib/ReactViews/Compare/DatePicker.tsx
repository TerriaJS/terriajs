import dateFormat from "dateformat";
import { action } from "mobx";
import { observer } from "mobx-react";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import DiscretelyTimeVaryingMixin from "../../ModelMixins/DiscretelyTimeVaryingMixin";
import CommonStrata from "../../Models/CommonStrata";
import Button from "../../Styled/Button";
import Icon, { StyledIcon } from "../../Styled/Icon";
import { formatDateTime } from "../BottomDock/Timeline/DateFormats";
import DateTimePicker from "../BottomDock/Timeline/DateTimePicker";

type PropsType = {
  item: DiscretelyTimeVaryingMixin.DiscretelyTimeVaryingMixin;
  side: "left" | "right";
};

const DatePicker: React.FC<PropsType> = observer(({ item, side }) => {
  const [t] = useTranslation();
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const Container = side === "left" ? LeftContainer : RightContainer;
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
    <Container>
      <Inner>
        <PrevButton
          disabled={item.isPreviousDiscreteTimeAvailable === false}
          onClick={() => item.moveToPreviousDiscreteTime(CommonStrata.user)}
        />
        <DateButton onClick={openDatePicker}>
          <Prefix>{t(`compare.dateButton.${side}`)}</Prefix>
          {dateString ?? t("compare.dateButton.select")}
        </DateButton>
        <NextButton
          disabled={item.isNextDiscreteTimeAvailable === false}
          onClick={() => item.moveToNextDiscreteTime(CommonStrata.user)}
        />
        <PickerContainer isOpen={isPickerOpen}>
          <StyledDateTimePicker
            currentDate={date}
            dates={item.objectifiedDates}
            onChange={changeDate}
            openDirection="none"
            isOpen={isPickerOpen}
            onOpen={() => setIsPickerOpen(true)}
            onClose={() => setIsPickerOpen(false)}
          />
        </PickerContainer>
      </Inner>
    </Container>
  );
});

function getFormattedDate(date: Date, format?: string): string {
  return format ? dateFormat(date, format) : formatDateTime(date);
}

const CommonContainer = styled.div`
  --map-width: calc(100% - ${p => p.theme.workbenchWidth}px);

  display: flex;
  flex-direction: column;

  position: absolute;
  z-index: 10000;
  bottom: 40px;
  width: calc(var(--map-width) / 2);
  box-sizing: border-box;
`;

const LeftContainer = styled(CommonContainer)`
  left: ${p => p.theme.workbenchWidth}px;
  align-items: flex-end;
  @media (min-width: calc(${p => p.theme.workbenchWidth}px + 650px)) {
    padding-right: 20px;
  }
`;

const RightContainer = styled(CommonContainer)`
  left: calc(${p => p.theme.workbenchWidth}px + var(--map-width) / 2);
  align-items: flex-start;
  @media (min-width: calc(${p => p.theme.workbenchWidth}px + 650px)) {
    padding-left: 20px;
  }
`;

const Inner = styled.div`
  display: flex;
  justify-items: space-between;
  width: 300px;
  max-width: 100%;
`;

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
  border-right: 1px solid rgba(37, 56, 88, 0.24);
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
  border-left: 1px solid rgba(37, 56, 88, 0.24);
  ${({ theme }) => theme.borderRadiusRight(theme.radius40Button)}
`;

const DateButton = styled(Button).attrs({ shortMinHeight: true })<{
  isOpen: boolean;
}>`
  z-index: 0;
  flex-grow: 1;
  ${props => props.isOpen && `z-index: 1000;`};
  background-color: white;
  border-radius: 0px;
  padding: 0;
`;

const Prefix = styled.span`
  &:after {
    content: ": ";
  }
`;

const PickerContainer = styled.div<{ isOpen: boolean }>`
  display: ${p => (p.isOpen ? "block" : "none")};
  position: absolute;
`;

const StyledDateTimePicker = styled(DateTimePicker)`
  > div {
    box-sizing: border-box;
    width: 300px;
    top: -260px;
  }

  > .inner {
    background: white;
  }
`;

export default DatePicker;
