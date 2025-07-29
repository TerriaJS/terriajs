import React from "react";
import ReactSelect from "react-select";
import styled from "styled-components";
import Box from "../../../Styled/Box";
import { StyledButton } from "../../../Styled/Button";

interface BrowseFileProps {
  selectedFile?: string;
  formats?: string;
  disabled?: boolean;
  onFile: (fileList: FileList | null) => void;
  onClearFile: () => void;
}

/**
 * A file input that can be cleared
 */
const BrowseFiles: React.FC<BrowseFileProps> = ({
  formats,
  selectedFile,
  disabled,
  onFile,
  onClearFile
}) => {
  const value = selectedFile
    ? { label: selectedFile, value: selectedFile }
    : undefined;

  return (
    <Box>
      <div
        css={`
          flex-grow: 1;
        `}
      >
        <ReactSelect
          isDisabled={disabled}
          placeholder="No files selected"
          options={undefined}
          value={value}
          isClearable
          isSearchable={false}
          menuIsOpen={false}
          onChange={onClearFile}
          components={{
            DropdownIndicator: () => null,
            IndicatorSeparator: () => null
          }}
          styles={{
            control: (baseStyles) => ({
              ...baseStyles,
              borderTopRightRadius: 0,
              borderBottomRightRadius: 0,
              borderRightWidth: 0
            })
          }}
        />
      </div>
      <div>
        <BrowseButton primary disabled={disabled}>
          <div>Browse...</div>
          <FileInput
            disabled={disabled}
            type="file"
            accept={formats}
            onChange={(e) => onFile(e.target.files)}
          />
        </BrowseButton>
      </div>
    </Box>
  );
};

const BrowseButton = styled(StyledButton).attrs({ as: "label" })`
  position: relative;
  display: flex;
  align-items: center;
  border-radius: ${(p) => `0 ${p.theme.radiusSmall} ${p.theme.radiusSmall} 0`};
  overflow: hidden;
`;

const FileInput = styled.input`
  width: 100%;
  opacity: 0;
  position: absolute;
  padding: $padding;
  cursor: pointer;
`;

export default BrowseFiles;
