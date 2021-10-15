import { observer } from "mobx-react";
import React, { useState } from "react";
import styled from "styled-components";
import CatalogMemberMixin from "../../ModelMixins/CatalogMemberMixin";
import MappableMixin from "../../ModelMixins/MappableMixin";
import Checkbox from "../../Styled/Checkbox/Checkbox";
import Icon, { StyledIcon } from "../../Styled/Icon";
import Text from "../../Styled/Text";
import WorkbenchItemControls from "../Workbench/Controls/WorkbenchItemControls";
import ViewState from "../../ReactViewModels/ViewState";

type Selectable = MappableMixin.Instance & CatalogMemberMixin.Instance;

type PropsType = {
  items: Selectable[];
  onChangeSelection: (item: Selectable, show: boolean) => void;
  viewState: ViewState;
};

const ItemList: React.FC<PropsType> = observer(
  ({ items, onChangeSelection, viewState }) => {
    return (
      <UList>
        {items.map(
          item =>
            item.uniqueId && (
              <li key={item.uniqueId}>
                <Item
                  item={item}
                  onChangeSelection={onChangeSelection}
                  viewState={viewState}
                />
              </li>
            )
        )}
      </UList>
    );
  }
);

type ItemProps = {
  item: Selectable;
  onChangeSelection: PropsType["onChangeSelection"];
  viewState: ViewState;
};

const Item: React.FC<ItemProps> = observer(
  ({ item, onChangeSelection, viewState }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <>
        <ItemTitle>
          <div
            css={`
              flex-grow: 1;
            `}
          >
            <Checkbox
              isChecked={item.show}
              onChange={ev => onChangeSelection(item, ev.target.checked)}
              label={<SelectorText medium>{item.name}</SelectorText>}
            />
          </div>
          <OpenButton isOpen={isOpen} onClick={() => setIsOpen(!isOpen)} />
        </ItemTitle>
        {isOpen && (
          <div>
            <WorkbenchItemControls item={item} viewState={viewState} />
          </div>
        )}
      </>
    );
  }
);

const UList = styled.ul`
  list-style: none;
  padding: 0px;
  margin: 0px;

  > li {
    display: flex;
    flex-direction: column;
  }
`;

const ItemTitle = styled.div`
  display: flex;
  width: 100%;
  height: 32px;
  align-items: center;
`;

const SelectorText = styled(Text)`
  margin-left: 10px;
`;

const OpenButton: React.FC<{
  isOpen: boolean;
  onClick: () => void;
}> = ({ isOpen, onClick }) => {
  return (
    <button
      onClick={onClick}
      css={`
        background: none;
        margin: 0;
        border: 0;
      `}
    >
      <StyledIcon
        styledWidth="10px"
        styledHeight="10px"
        light
        glyph={isOpen ? Icon.GLYPHS.opened : Icon.GLYPHS.closed}
      />
    </button>
  );
};

export default ItemList;
