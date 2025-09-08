import { observer } from "mobx-react";
import React, { useEffect } from "react";
import ReactSelect from "react-select";
import CatalogFunctionMixin from "../../ModelMixins/CatalogFunctionMixin";
import CommonStrata from "../../Models/Definition/CommonStrata";
import RegionTypeParameter from "../../Models/FunctionParameters/RegionTypeParameter";
import Loader from "../Loader";

interface PropsType {
  previewed: CatalogFunctionMixin.Instance;
  parameter: RegionTypeParameter;
}

const RegionTypeParameterEditor: React.FC<PropsType> = observer(
  ({ parameter }) => {
    const regionProviders = parameter.regionProviders;

    useEffect(() => {
      parameter.load();
    }, [parameter]);

    if (!regionProviders) {
      return <Loader />;
    }

    const onChange = (option: any) => {
      const regionType = option?.value;
      const regionProvider = regionType
        ? regionProviders.find((r) => r.regionType === regionType)
        : undefined;
      parameter.setValue(CommonStrata.user, regionProvider?.regionType);
    };

    const options = regionProviders.map((r) => ({
      value: r.regionType,
      label: r.regionType
    }));

    const selection = options.find((opt) => opt.value === parameter.value);

    return (
      <ReactSelect
        placeholder="Region type"
        onChange={onChange}
        value={selection}
        options={options}
      />
    );
  }
);

export default RegionTypeParameterEditor;
