import React, { ChangeEvent, FC, useState } from "react";
import { useTranslation } from "react-i18next";

import styled from "styled-components";
import Box from "../../../../../Styled/Box";

interface IFileInputProps {
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  accept: HTMLInputElement["accept"];
}

export const FileInput: FC<IFileInputProps> = ({ onChange, accept }) => {
  const { t } = useTranslation();
  const [fileName, setFileName] = useState<string>();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFileName(e.target.value.split(/(\\|\/)/g).pop());
    if (onChange) {
      onChange(e);
    }
  };
  return (
    <Box as="form" centered>
      <HiddenInput
        id="file-upload"
        type="file"
        onChange={handleChange}
        accept={accept}
      />
      <StyledLabel htmlFor="file-upload">
        {fileName ?? t("addData.browse")}
      </StyledLabel>
    </Box>
  );
};

const HiddenInput = styled.input`
  display: none;
`;

const StyledLabel = styled.label`
  background-color: ${(props) => props.theme.colorPrimary};
  color: ${(props) => props.theme.textLight};
  padding: 10px;
  border-radius: 4px;
  width: 100%;
  text-align: center;
  cursor: pointer;

  &:hover,
  &:focus {
    opacity: 0.9;
  }
`;
