import { useTranslation } from "react-i18next";
import styled from "styled-components";
import Checkbox from "../Styled/Checkbox";
import { TextSpan } from "../Styled/Text";
import React from "react";

interface ExcludeStoryOptionProps {
  id: string;
  checked: boolean;
  onChange?: (result: boolean) => void;
}

const ExcludeStoryOption: React.FC<ExcludeStoryOptionProps> = props => {
  const { id, checked } = props;
  const { t } = useTranslation();
  // const [status, setStatus] = useState<CopyStatus>(
  //   CopyStatus.NotCopiedOrWaiting
  // );

  return (
    <ExcludeStoryOptionDiv>
      <Checkbox
        textProps={{ small: true }}
        id="excludeStory"
        title="Exclude Story from Share"
        isChecked={false}
        onChange={undefined}
      >
        <TextSpan>
          {
            // t("settingPanel.terrain.hideUnderground")
            "Exclude Story from Share?"
          }
        </TextSpan>
      </Checkbox>
    </ExcludeStoryOptionDiv>
  );
};

export default ExcludeStoryOption;

const ExcludeStoryOptionDiv = styled.div`
  //   position: relative;
`;
