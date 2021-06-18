import { observer } from "mobx-react";
import React from "react";
import styled from "styled-components";
import Model from "../../Models/Model";
import Checkbox from "../../Styled/Checkbox/Checkbox";
import CatalogMemberTraits from "../../Traits/CatalogMemberTraits";
import MappableTraits from "../../Traits/MappableTraits";

export type MappableCatalogItem = Model<MappableTraits & CatalogMemberTraits>;

type PropsType = {
  items: MappableCatalogItem[];
  onChange: (item: MappableCatalogItem, show: boolean) => void;
};

const ItemList: React.FC<PropsType> = observer(({ items, onChange }) => {
  return (
    <UList>
      {items.map(
        item =>
          item.uniqueId && (
            <li key={item.uniqueId}>
              <Selector
                item={item}
                selected={item.show}
                onChange={show => onChange(item, show)}
              />
            </li>
          )
      )}
    </UList>
  );
});

type SelectorProps = {
  item: MappableCatalogItem;
  selected: boolean;
  onChange: (selected: boolean) => void;
};

const Selector: React.FC<SelectorProps> = observer(props => {
  const { item, selected, onChange } = props;
  return (
    <Label>
      <Checkbox
        isChecked={selected}
        onChange={ev => onChange(ev.target.checked)}
      />
      <div>{item.name}</div>
    </Label>
  );
});

const UList = styled.ul`
  list-style: none;
  padding: 0px;
  margin: 0px;

  > li {
    display: flex;
    align-items: center;
  }
`;

const Label = styled.label`
  display: flex;
  flex-direction: row;
  align-items: center;
  > div {
    flex-grow: 1;
  }
`;

export default ItemList;
