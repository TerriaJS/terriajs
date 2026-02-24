import dateFormat from "dateformat";
import { observer } from "mobx-react";
import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useState
} from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import DiffableMixin from "../../../ModelMixins/DiffableMixin";
import CommonStrata from "../../../Models/Definition/CommonStrata";
import Box from "../../../Styled/Box";
import Button from "../../../Styled/Button";
import Icon, { StyledIcon } from "../../../Styled/Icon";
import Spacing from "../../../Styled/Spacing";
import Text, { TextSpan } from "../../../Styled/Text";
import { formatDateTime } from "../../BottomDock/Timeline/DateFormats";
import DateTimePicker from "../../BottomDock/Timeline/DateTimePicker";

interface PropsType {
  heading: string;
  item: DiffableMixin.Instance;
  onDateSet: () => void;
}

export interface IDatePickerHandle {
  open: () => void;
  close: () => void;
}

const DatePicker = forwardRef<IDatePickerHandle, PropsType>((props, ref) => {
  const { heading, item, onDateSet } = props;
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const currentDate = useMemo((): Date | undefined => {
    const date = item.currentDiscreteJulianDate;
    return date && JulianDate.toDate(date);
  }, [item.currentDiscreteJulianDate]);

  const formattedCurrentDate = useMemo(() => {
    if (currentDate === undefined) {
      return;
    }
    const dateFormatting = undefined; // TODO
    const formattedDate =
      dateFormatting !== undefined
        ? dateFormat(currentDate, dateFormatting)
        : formatDateTime(currentDate);
    return formattedDate;
  }, [currentDate]);

  const toggleOpen = useCallback(() => {
    setIsOpen(!isOpen);
  }, [isOpen]);

  const changeCurrentDate = useCallback(
    (date: Date) => {
      item.setTrait(CommonStrata.user, "currentTime", date.toISOString());
      onDateSet();
    },
    [item, onDateSet]
  );

  const moveToPreviousDate = useCallback(() => {
    item.moveToPreviousDiscreteTime(CommonStrata.user);
    onDateSet();
  }, [item, onDateSet]);

  const moveToNextDate = useCallback(() => {
    item.moveToNextDiscreteTime(CommonStrata.user);
    onDateSet();
  }, [item, onDateSet]);

  useImperativeHandle(
    ref,
    () => {
      return {
        open: () => {
          setIsOpen(true);
        },
        close: () => {
          setIsOpen(false);
        }
      };
    },
    []
  );

  return (
    <Box column centered flex={1}>
      <Spacing bottom={4} />
      <Box centered>
        <StyledIcon
          light
          styledWidth="21px"
          glyph={Icon.GLYPHS.calendar2}
          css={"margin-top:-2px;"}
        />
        <Spacing right={2} />
        <Text textLight extraLarge>
          {heading}
        </Text>
      </Box>
      <Spacing bottom={2} />
      <Box>
        <PrevButton
          disabled={item.isPreviousDiscreteTimeAvailable === false}
          title={t("diffTool.datePicker.previousDateTitle")}
          onClick={moveToPreviousDate}
        />
        <DateButton
          primary
          isOpen={isOpen}
          onClick={toggleOpen}
          title={t("diffTool.datePicker.dateButtonTitle")}
        >
          <TextSpan extraLarge>{formattedCurrentDate || "-"}</TextSpan>
        </DateButton>
        <NextButton
          disabled={item.isNextDiscreteTimeAvailable === false}
          title={t("diffTool.datePicker.nextDateTitle")}
          onClick={moveToNextDate}
        />
      </Box>
      <div
        style={{
          display: isOpen ? "block" : "none",
          position: "absolute"
        }}
      >
        <DateTimePicker
          currentDate={currentDate}
          dates={item.objectifiedDates}
          onChange={changeCurrentDate}
          openDirection="up"
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
        />
      </div>
      <Spacing bottom={4} />
    </Box>
  );
});
DatePicker.displayName = "DatePicker";

const PagerButton = styled(Button).attrs({
  iconProps: {
    css: "margin-right:0;"
  }
})`
  cursor: pointer;
  background-color: ${(props) => props.theme.colorPrimary};
  width: 40px;
  border: 1px solid transparent;

  ${({ theme }) => theme.centerWithFlex()}
  flex-direction: column;
`;

const PrevButton = styled(PagerButton).attrs({
  renderIcon: () => (
    <StyledIcon
      css="transform:rotate(90deg);"
      light
      styledWidth="15px"
      glyph={Icon.GLYPHS.arrowDown}
    />
  )
})`
  ${({ theme }) => theme.borderRadiusLeft(theme.radius40Button)}
  margin-right: 1px;
`;

const NextButton = styled(PagerButton).attrs({
  renderIcon: () => (
    <StyledIcon
      css="transform:rotate(270deg);"
      light
      styledWidth="15px"
      glyph={Icon.GLYPHS.arrowDown}
    />
  )
})`
  ${({ theme }) => theme.borderRadiusRight(theme.radius40Button)}
  margin-left: 1px;
`;

const DateButton = styled(Button)<{ isOpen: boolean }>`
  // z-index: 1000; // (Nanda): So that we don't loose the button clicks to the date picker popup
  z-index: 0;
  ${(props) => props.isOpen && `z-index: 1000;`};

  border-radius: 0px;
  border: 1px solid ${(props) => props.theme.colorPrimary};

  min-width: 235px;
  @media (max-width: ${(props: any) => props.theme.lg}px) {
    min-width: 150px;
  }
`;

export default observer(DatePicker);
