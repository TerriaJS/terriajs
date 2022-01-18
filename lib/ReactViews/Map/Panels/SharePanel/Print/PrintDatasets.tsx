import React from "react";
import CatalogMemeberMixin from "../../../../../ModelMixins/CatalogMemberMixin";
import { BaseModel } from "../../../../../Models/Definition/Model";
import Description from "../../../../Preview/Description";

interface Props {
  items: readonly (CatalogMemeberMixin.Instance & BaseModel & any)[];
}

const PrintDatasets = (props: Props) => {
  return (
    <>
      {props.items.map((item, index) => (
        <details key={index} open>
          <summary>{item.name}</summary>
          <Description item={item} printView={true} key={index} />
        </details>
      ))}
    </>
  );
};

export default PrintDatasets;
