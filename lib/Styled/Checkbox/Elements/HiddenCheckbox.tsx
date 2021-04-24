import React from "react";

export interface HiddenCheckboxProps extends React.HTMLProps<HTMLInputElement> {
  disabled?: boolean;
  checked?: boolean;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  value?: number | string;
  name?: string;
  isIndeterminate?: boolean;
}
export default React.forwardRef(
  (
    { isIndeterminate, ...props }: HiddenCheckboxProps,
    ref: React.Ref<HTMLInputElement>
  ) => (
    <input
      type="checkbox"
      {...props}
      ref={ref}
      aria-checked={isIndeterminate ? "mixed" : props.checked}
      css={{
        appearance: "none",
        clip: "rect(0 0 0 0)",
        overflow: "hidden",
        position: "absolute",
        width: 0,
        margin: 0,
        padding: 0,
        border: 0
      }}
    />
  )
);
