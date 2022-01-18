import React from "react";
import Workbench from "../../../../../Models/Workbench";

import CatalogMemeberMixin from "../../../../../ModelMixins/CatalogMemberMixin";
import MappableMixin from "../../../../../ModelMixins/MappableMixin";
import { BaseModel } from "../../../../../Models/Definition/Model";
import DiscretelyTimeVaryingMixin from "../../../../../ModelMixins/DiscretelyTimeVaryingMixin";
import Legend from "../../../../Workbench/Controls/Legend";
import SelectableDimensions, {
  DEFAULT_PLACEMENT,
  filterSelectableDimensions,
  findSelectedValueName
} from "../../../../../Models/SelectableDimensions";
import { useTranslation } from "react-i18next";

interface Props {
  workbench: Workbench;
}

const renderDisplayVariables = (catalogItem: BaseModel & any) => {
  const { t } = useTranslation();
  if (SelectableDimensions.is(catalogItem)) {
    return filterSelectableDimensions(DEFAULT_PLACEMENT)(
      catalogItem.selectableDimensions
    ).map(dim => (
      <div>
        {dim.name}: {findSelectedValueName(dim)}
      </div>
    ));
  }
  return null;
};

const renderLegend = (
  catalogItem: MappableMixin.Instance &
    DiscretelyTimeVaryingMixin.Instance &
    CatalogMemeberMixin.Instance &
    BaseModel &
    any
) => {
  if (!catalogItem.isMappable) {
    return null;
  }

  return (
    <div key={catalogItem.uniqueId} className="layer-legends">
      <div className="layer-title">{catalogItem.name}</div>
      {catalogItem.currentTime && (
        <div className="layer-time">Time: {catalogItem.currentTime}</div>
      )}
      <Legend forPrint={true} item={catalogItem} />
    </div>
  );
};

const WorkbenchItem = ({
  item,
  key
}: {
  item: BaseModel | any;
  key: number;
}) => {
  return (
    <div className="WorkbenchItem" key={key}>
      <h3>{item.name}</h3>
      {renderDisplayVariables(item)}
      <div>{renderLegend(item)}</div>
    </div>
  );
};

const PrintWorkbench = (props: Props) => {
  return (
    <>
      {props.workbench.items.map((item, index) => (
        <WorkbenchItem item={item} key={index} />
      ))}
    </>
  );
};

export default PrintWorkbench;
