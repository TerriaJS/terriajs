import React, { Dispatch, SetStateAction } from "react";

import { useTheme } from "styled-components";
import ReactSelect from "react-select";

import { IDataType } from "../../../../../Core/getDataType";

export const SelectDataType = <T extends IDataType>({
  options,
  onChange,
  selectedValue
}: {
  options: T[];
  onChange: Dispatch<SetStateAction<T>>;
  selectedValue: T;
}) => {
  const theme = useTheme();

  return (
    <ReactSelect
      value={selectedValue}
      classNamePrefix="ReactSelect"
      options={options}
      isMulti={false}
      getOptionLabel={(dataType: any) => dataType.name}
      menuPosition="fixed"
      menuPlacement="bottom"
      // @ts-ignore
      onChange={onChange}
      isClearable={false}
      theme={selectTheme => ({
        ...selectTheme,
        colors: {
          ...selectTheme.colors,
          primary25: theme.greyLighter,
          primary50: theme.colorPrimary,
          primary75: theme.colorPrimary,
          primary: theme.colorPrimary
        }
      })}
    />
  );
};
