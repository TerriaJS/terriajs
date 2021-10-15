import { observer } from "mobx-react";
import React from "react";
import styled from "styled-components";
import Model from "../../Models/Definition/Model";
import Checkbox from "../../Styled/Checkbox/Checkbox";
import CatalogMemberTraits from "../../Traits/TraitsClasses/CatalogMemberTraits";
import MappableTraits from "../../Traits/TraitsClasses/MappableTraits";
import Text from "../../Styled/Text";

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
              <Checkbox
                isChecked={item.show}
                onChange={ev => onChange(item, ev.target.checked)}
                label={<SelectorText medium>{item.name}</SelectorText>}
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

const UList = styled.ul`
  list-style: none;
  padding: 0px;
  margin: 0px;

  > li {
    display: flex;
    align-items: center;
    height: 32px;
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

const SelectorText = styled(Text)`
  margin-left: 10px;
`;

export default ItemList;
