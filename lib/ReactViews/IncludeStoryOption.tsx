import { useTranslation } from "react-i18next";
import styled from "styled-components";
import Checkbox from "../Styled/Checkbox";
import { TextSpan } from "../Styled/Text";
import React from "react";
import ViewState from "../ReactViewModels/ViewState";
import { observer } from "mobx-react";

interface IncludeStoryOptionProps {
  viewState: ViewState;
}

const IncludeStoryOption: React.FC<IncludeStoryOptionProps> = observer(
  props => {
    const { t } = useTranslation();

    const onChangeHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
      props.viewState.setIncludeStoryInShare(event.target.checked);
      return;
    };

    const isChecked = props.viewState.includeStoryInShare ?? false;

    return (
      <IncludeStoryOptionDiv>
        <Checkbox
          textProps={{ small: true }}
          id="includeStory"
          title="Include Story in Share"
          isChecked={isChecked}
          onChange={onChangeHandler}
        >
          <TextSpan>{t("includeStory.message")}</TextSpan>
        </Checkbox>
      </IncludeStoryOptionDiv>
    );
  }
);

export default IncludeStoryOption;

const IncludeStoryOptionDiv = styled.div`
  //   position: relative;
`;
