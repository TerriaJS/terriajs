import React from "react";
import { useTranslation } from "react-i18next";
import Select from "../../Styled/Select";

type PropsType = {
  selectableItems: { id: string; name: string }[];
  selectedItem?: string;
  onChange: (id: string) => void;
};

const ItemSelector: React.FC<PropsType> = props => {
  const { selectableItems, selectedItem } = props;
  const [t] = useTranslation();
  const onChange = (ev: React.ChangeEvent<HTMLSelectElement>) =>
    props.onChange(ev.target.value);
  return (
    <Select onChange={onChange} value={selectedItem}>
      {selectedItem === undefined && (
        <option key="-select-one-" value="-select-one-">
          {t("compare.dataset.selectOne")}
        </option>
      )}
      {selectableItems.map(item => (
        <option key={item.id} value={item.id}>
          {item.name}
        </option>
      ))}
    </Select>
  );
};

export default ItemSelector;
