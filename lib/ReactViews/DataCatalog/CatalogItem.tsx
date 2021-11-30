import classNames from "classnames";
import PropTypes from "prop-types";
import React from "react";
import { useTranslation } from "react-i18next";
import defaultValue from "terriajs-cesium/Source/Core/defaultValue";
import Box from "../../Styled/Box";
import Icon from "../../Styled/Icon";
import Text from "../../Styled/Text";
import PrivateIndicator from "../PrivateIndicator/PrivateIndicator";
import Styles from "./data-catalog-item.scss";

export enum ButtonState {
  Loading,
  Remove,
  Add,
  Trash,
  Stats,
  Preview
}

const STATE_TO_ICONS: Record<ButtonState, React.ReactElement> = {
  [ButtonState.Loading]: <Icon glyph={Icon.GLYPHS.loader} />,
  [ButtonState.Remove]: <Icon glyph={Icon.GLYPHS.remove} />,
  [ButtonState.Add]: <Icon glyph={Icon.GLYPHS.add} />,
  [ButtonState.Trash]: <Icon glyph={Icon.GLYPHS.trashcan} />,
  [ButtonState.Stats]: <Icon glyph={Icon.GLYPHS.barChart} />,
  [ButtonState.Preview]: <Icon glyph={Icon.GLYPHS.right} />
};

interface Props {
  isPrivate?: boolean;
  title: string;
  text: string;
  selected?: boolean;
  trashable?: boolean;

  btnState: ButtonState;
  onBtnClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onTextClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onTrashClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  titleOverrides?: Partial<Record<ButtonState, string>>;
}

/** Dumb catalog item */
function CatalogItem(props: Props) {
  const { t } = useTranslation();
  const STATE_TO_TITLE = {
    [ButtonState.Loading]: t("catalogItem.loading"),
    [ButtonState.Remove]: t("catalogItem.remove"),
    [ButtonState.Add]: t("catalogItem.add"),
    [ButtonState.Trash]: t("catalogItem.trash"),
    [ButtonState.Preview]: t("catalogItem.preview")
  };
  const stateToTitle: Partial<Record<ButtonState, string>> = defaultValue(
    props.titleOverrides,
    STATE_TO_TITLE
  );
  return (
    <li className={classNames(Styles.root)}>
      <Text fullWidth primary={props.isPrivate}>
        <button
          type="button"
          onClick={props.onTextClick}
          title={props.title}
          className={classNames(Styles.btnCatalogItem, {
            [Styles.btnCatalogItemIsPreviewed]: props.selected,
            [Styles.btnCatalogItemIsTrashable]: props.selected
          })}
        >
          {props.text}
        </button>
      </Text>
      <Box>
        {props.isPrivate && <PrivateIndicator />}
        <button
          type="button"
          onClick={props.onBtnClick}
          title={stateToTitle[props.btnState] || ""}
          className={Styles.btnAction}
        >
          {STATE_TO_ICONS[props.btnState]}
        </button>
        {props.trashable && (
          <button
            type="button"
            onClick={props.onTrashClick}
            title={stateToTitle[ButtonState.Trash]}
            className={classNames(Styles.btnAction, Styles.btnTrash)}
          >
            {STATE_TO_ICONS[ButtonState.Trash]}
          </button>
        )}
      </Box>
    </li>
  );
}

CatalogItem.propTypes = {
  onTextClick: PropTypes.func,
  isPrivate: PropTypes.bool,
  selected: PropTypes.bool,
  text: PropTypes.string,
  title: PropTypes.string,
  trashable: PropTypes.bool,
  onTrashClick: PropTypes.func,
  onBtnClick: PropTypes.func,
  btnState: PropTypes.oneOf(Object.keys(STATE_TO_ICONS)),
  titleOverrides: PropTypes.object
};

export default CatalogItem;
