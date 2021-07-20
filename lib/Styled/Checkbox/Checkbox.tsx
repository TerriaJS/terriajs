import React, {
  ChangeEvent,
  forwardRef,
  memo,
  Ref,
  useCallback,
  useState
} from "react";
import { useUID } from "react-uid";
import { TextSpan } from "../Text";
import { SpacingSpan } from "./../Spacing";
import CheckboxIcon from "./Elements/CheckboxIcon";
import HiddenCheckbox from "./Elements/HiddenCheckbox";
import { ICheckboxProps } from "./types";

const Checkbox = memo(
  forwardRef(function Checkbox(
    props: ICheckboxProps,
    ref: Ref<HTMLInputElement>
  ) {
    const {
      isChecked: isCheckedProp,
      isDisabled = false,
      defaultChecked = false,
      isIndeterminate = false,
      onChange: onChangeProps,
      label,
      title,
      name,
      value,
      ...rest
    } = props;

    const [isCheckedState, setIsCheckedState] = useState(
      isCheckedProp !== undefined ? isCheckedProp : defaultChecked
    );

    const onChange = useCallback(
      (e: ChangeEvent<HTMLInputElement>) => {
        setIsCheckedState(e.target.checked);
        if (onChangeProps) {
          onChangeProps(e);
        }
      },
      [onChangeProps]
    );

    // Use isChecked from the state if it is controlled
    const isChecked =
      isCheckedProp === undefined ? isCheckedState : isCheckedProp;
    const id = useUID();
    return (
      <TextSpan
        as={"label"}
        title={title}
        htmlFor={`checkbox-${id}`}
        css={`
          display: flex;
          flex-shrink: 0;
          align-items: center;
          &:focus-within {
            //copy the global focus
            outline: 3px solid #c390f9;
          }
          ${!isDisabled &&
            `
            &:hover svg {
              opacity: 0.6;
            }
          `}
          ${isDisabled &&
            `
            cursor: not-allowed;
          `}
        `}
        {...rest}
      >
        <HiddenCheckbox
          disabled={isDisabled}
          checked={isChecked}
          onChange={onChange}
          value={value}
          name={name}
          id={`checkbox-${id}`}
          ref={ref}
        />
        <CheckboxIcon
          isIndeterminate={isIndeterminate}
          isChecked={isChecked}
          isDisabled={isDisabled}
          labeled={!!label}
        />
        <SpacingSpan right={1} />
        <TextSpan
          isDisabled={isDisabled}
          css={`
            font-size: inherit;
          `}
        >
          {label}
        </TextSpan>
      </TextSpan>
    );
  })
);

Checkbox.displayName = "Checkbox";

export default Checkbox;
