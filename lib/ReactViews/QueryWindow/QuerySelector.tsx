import { observer } from "mobx-react";
import React from "react";
import Box from "../../Styled/Box";
import Select from "../../Styled/Select";
import { useTranslation } from "react-i18next";

interface PropsType {
  label: string;
  options: { key: string; label: string }[] | undefined;
  value: string | undefined;
  onSelect: (newValue: string) => void;
}

const QuerySelector = observer(
  ({ label, options, value, onSelect }: PropsType) => {
    const { t } = useTranslation();
    return (
      <>
        <Box styledMargin="10px 20px">{t(label)}</Box>
        <Box styledMargin="0px 20px 10px 20px">
          <Select
            css={`
              background-color: ${(p: any) => p.theme.dark};
              color: ${(p: any) => p.theme.textLight};
            `}
            value={value}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              const value = e.target.value;
              onSelect(value);
            }}
          >
            {options?.map((opt, index) => {
              return (
                <option
                  key={index}
                  value={opt.key}
                  css={`
                    background-color: ${(p: any) => p.theme.colorPrimary};
                    color: ${(p: any) => p.theme.textLight};
                  `}
                >
                  {opt.label.startsWith("sum-")
                    ? `${t("queryTab.sum")} "${opt.label.slice(4)}"`
                    : t(opt.label)}
                </option>
              );
            })}
          </Select>
        </Box>
      </>
    );
  }
);

export default QuerySelector;
