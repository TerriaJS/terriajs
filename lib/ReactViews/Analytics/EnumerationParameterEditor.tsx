import { observer } from "mobx-react";
import ReactSelect from "react-select";
import { useTheme } from "styled-components";
import CommonStrata from "../../Models/Definition/CommonStrata";
import EnumerationParameter from "../../Models/FunctionParameters/EnumerationParameter";

export const EnumerationParameterEditor: React.FC<{
  parameter: EnumerationParameter;
}> = observer(({ parameter }) => {
  const theme = useTheme();

  const options = parameter.options.map((opt) => ({
    value: opt.id,
    label: opt.name ?? opt.id
  }));

  const values =
    parameter.value === undefined
      ? []
      : Array.isArray(parameter.value)
      ? parameter.value
      : [parameter.value];

  const selectedOptions = values.map((value) =>
    options.find((opt) => opt.value === value)
  );

  const maxOccurs = parameter.maxOccurs;
  const isMultiSelect = maxOccurs !== undefined && maxOccurs > 1;

  return (
    <ReactSelect
      css={`
        color: ${theme.dark};
      `}
      options={options}
      value={selectedOptions}
      onChange={(options) => {
        const value = Array.isArray(options)
          ? options.map((opt) => opt.value)
          : (options as any)?.value ?? (isMultiSelect ? [] : undefined);
        parameter.setValue(CommonStrata.user, value);
      }}
      isClearable={parameter.isRequired === false}
      theme={(selectTheme) => ({
        ...selectTheme,
        colors: {
          ...selectTheme.colors,
          primary25: theme.greyLighter,
          primary50: theme.colorPrimary,
          primary75: theme.colorPrimary,
          primary: theme.colorPrimary
        }
      })}
      isMulti={isMultiSelect}
    />
  );
});

export default EnumerationParameterEditor;
