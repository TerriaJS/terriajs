import React from "react";

interface DropdownProps {
  theme?: any;
  options?: any[];
  selected?: any;
  selectOption?: (o: any, i: number) => void;
  textProperty?: string;
  matchWidth?: boolean;
  children?: any;
  disabled?: boolean;
}

declare class Dropdown extends React.Component<DropdownProps> {}

export default Dropdown;
