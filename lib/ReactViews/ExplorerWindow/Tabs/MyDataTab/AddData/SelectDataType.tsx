import React, { SFC, Dispatch, SetStateAction } from "react";

import ReactSelect, { StylesConfig } from "react-select";

import { IDataType } from "../../../../../Core/getDataType";

const styles: StylesConfig = {
  control: base => ({
    ...base,
    fontSize: "14px"
  }),
  menu: base => ({
    ...base,
    fontSize: "14px"
  })
};

export const SelectDataType = <T extends IDataType>({
  options,
  onChange,
  selectedValue
}: {
  options: T[];
  onChange: Dispatch<SetStateAction<T>>;
  selectedValue: T;
}) => {
  return (
    <ReactSelect
      // styles={styles}
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
    />
  );
};
