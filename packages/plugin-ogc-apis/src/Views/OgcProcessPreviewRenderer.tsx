import { action } from "mobx";
import { observer } from "mobx-react";
import { FC, useEffect, useMemo, useState } from "react";
import ReactSelect from "react-select";
import styled from "styled-components";
import {
  AnimatedSpinnerIcon,
  Button,
  CatalogMemberMixin,
  TerriaError,
  useViewState
} from "terriajs-plugin-api";
import isDefined from "terriajs/lib/Core/isDefined";
import WarningBox from "terriajs/lib/ReactViews/Preview/WarningBox";
import { scrollBars } from "terriajs/lib/Styled/mixins";
import OgcProcessCatalogFunction from "../Models/Ogc/Process/OgcProcessCatalogFunction";
import {
  ArrayField,
  EnumField,
  InputField,
  NumberField,
  TextField
} from "../Models/Ogc/UiElements";
import { Input } from "./Common";
import GeojsonFieldRenderer from "./Fields/GeojsonFieldRenderer";

const OgcProcessPreviewRenderer: FC<{
  previewed: CatalogMemberMixin.Instance;
}> = observer(({ previewed: item }) => {
  const viewState = useViewState();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [executionError, setExecutionError] = useState<TerriaError>();

  if (!(item instanceof OgcProcessCatalogFunction)) {
    return null;
  }

  const error = item.loadMetadataResult?.error ?? executionError;
  const description = item.description;
  const hasErrors = item.inputFields.some(
    (field) => field.getError() !== undefined
  );

  const clearValues = action(() => {
    item.inputFields.forEach((field) => field.setValue(undefined));
  });

  const executeJob = () => {
    // Clear previous execution errors. Ideally, we do this on form.onchange,
    // but some components like react-select does not trigger form.onchange
    setExecutionError(undefined);
    setIsSubmitting(true);
    item
      .submitJob()
      .then(
        action(() => {
          // Close modal window
          viewState.explorerPanelIsVisible = false;
          // mobile switch to nowvewing
          viewState.switchMobileView(viewState.mobileViewOptions.preview);
        })
      )
      .catch((e) => setExecutionError(TerriaError.from(e)))
      .finally(() => setIsSubmitting(false));
  };

  return (
    <Form onSubmit={(e) => e.preventDefault()}>
      <Main>
        <Header>
          <h3>{item.name}</h3>
          {error && <WarningBox error={error} viewState={viewState} />}
          {description && <div>{description}</div>}
        </Header>
        <Fields>
          {item.inputFields.map((field) => (
            <InputFieldRenderer key={field.id} field={field} />
          ))}
        </Fields>
      </Main>
      <Footer>
        <Button type="button" secondary fullWidth onClick={clearValues}>
          Clear
        </Button>
        <Button
          type="submit"
          primary
          fullWidth
          disabled={isSubmitting || hasErrors}
          onClick={executeJob}
          renderIcon={
            isSubmitting
              ? () => (
                  <AnimatedSpinnerIcon styledWidth="16px" styledHeight="16px" />
                )
              : undefined
          }
        >
          Execute job
        </Button>
      </Footer>
    </Form>
  );
});

const InputFieldRenderer: FC<{
  field: InputField;
}> = observer(({ field }) => {
  const value = field.getValue();
  const error = value !== undefined ? field.getError() : undefined;
  return (
    <Field className={error ? "error" : ""}>
      {error && <div>{error}</div>}
      <Label htmlFor={field.id}>
        {field.name}
        {field.required ? <RequiredSuffix /> : null}
      </Label>
      {field.description && (
        <Description id={`${field.id}-desc`}>{field.description}</Description>
      )}
      <InputRenderer field={field} aria-describedby={`${field.id}-desc`} />
    </Field>
  );
});

const InputRenderer: FC<{ field: InputField }> = observer(({ field }) => {
  return field.type === "text" ? (
    <TextFieldRenderer field={field} />
  ) : field.type === "number" ? (
    <NumberFieldRenderer field={field} />
  ) : field.type === "enum" ? (
    <EnumFieldRenderer field={field} />
  ) : field.type === "geojson" ? (
    <GeojsonFieldRenderer field={field} />
  ) : field.type === "array" ? (
    <ArrayFieldRenderer field={field} />
  ) : null;
});

const TextFieldRenderer: FC<{
  field: TextField;
}> = observer(({ field }) => {
  return (
    <Input
      type="text"
      id={field.id}
      required={field.required}
      value={field.getValue() ?? ""}
      onChange={(ev) => field.setValue(ev.target.value)}
    />
  );
});

const NumberFieldRenderer: FC<{ field: NumberField }> = observer(
  ({ field }) => (
    <Input
      type="number"
      id={field.id}
      required={field.required}
      value={field.getValue() ?? ""}
      onChange={(ev) =>
        field.setValue(ev.target.value ? ev.target.valueAsNumber : undefined)
      }
    />
  )
);

const EnumFieldRenderer: FC<{ field: EnumField<any> }> = observer(
  ({ field }) => {
    const value = field.getValue();
    const selectedOpt = field.options.find((opt) => opt.value === value);

    useEffect(() => {
      // If the field is required and there is only one option, auto-select it.
      if (value || !field.required || field.options.length !== 1) {
        return;
      }

      const onlyOption = field.options.at(0);
      if (onlyOption) {
        field.setValue(onlyOption.value);
      }
    }, [field]);

    return (
      <ReactSelect
        id={field.id}
        required={field.required}
        onChange={(ev) => field.setValue(isDefined(ev) ? ev.value : undefined)}
        value={selectedOpt}
        isClearable={!field.required}
        options={field.options}
        menuPortalTarget={document.body} // required to float dropdown over other content
        styles={{
          menuPortal: (base) => ({
            ...base,
            zIndex: 99999 // required to float dropdown over other content
          }),
          container: (base) => ({
            ...base
          }),
          control: (base) => ({
            ...base,
            border: "1px solid black",
            borderRadius: "2px"
          })
        }}
      />
    );
  }
);

const ArrayFieldRenderer: FC<{ field: ArrayField }> = observer(({ field }) => {
  const values = field.getValue() ?? [];
  return (
    <ArrayItems>
      {[...Array(values.length + 1)].map((_, idx) => {
        return <ArrayItemRenderer key={idx} idx={idx} field={field} />;
      })}
    </ArrayItems>
  );
});

const ArrayItemRenderer: FC<{ idx: number; field: ArrayField }> = observer(
  ({ idx, field }) => {
    const itemField = useMemo(() => field.newItem(idx), [field, idx]);
    return itemField ? (
      <ArrayItem>
        <ArrayItemTitle>{itemField.name}</ArrayItemTitle>
        <ArrayItemInput>
          <InputRenderer field={itemField} />
        </ArrayItemInput>
      </ArrayItem>
    ) : null;
  }
);

const ArrayItems = styled.dl`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const ArrayItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 7px;
  padding: 0 20px;
`;

const ArrayItemTitle = styled.dt`
  font-weight: bold;
`;

const ArrayItemInput = styled.dd`
  margin: 0px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  padding: ${(p) => p.theme.paddingSmall} 20px;
  height: calc(100% - ${(p) => p.theme.paddingSmall} * 4);
`;

const Main = styled.div`
  ${(p) => scrollBars(p)}
  overflow-x: hidden;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const Header = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Fields = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const Footer = styled.div`
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: ${(p) => p.theme.paddingSmall};
`;

const RequiredSuffix = styled.span`
  &::after {
    content: "*";
    color: red;
  }
`;

const Field = styled.div`
  &.error {
    padding: ${(p) => p.theme.padding};
    border: 1px solid red;
    border-radius: 3px;
  }
`;

const Label = styled.label`
  font-weight: 600;
`;

const Description = styled.div`
  padding: ${(p) => p.theme.padding} 0px;
  font-size: 12px;
  color: ${(p) => p.theme.darkLighter};
`;

export default OgcProcessPreviewRenderer;
