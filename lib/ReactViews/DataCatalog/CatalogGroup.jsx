import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";

import Loader from "../Loader.jsx";
import Icon from "../Icon.jsx";
import { useTranslation } from "react-i18next";

import Styles from "./data-catalog-group.scss";

/**
 * Dumb component that encapsulated the display logic for a catalog group.
 *
 * @constructor
 */
function CatalogGroup(props) {
  const { t } = useTranslation();
  return (
    <li className={Styles.root}>
      <button
        type="button"
        className={classNames(
          Styles.btnCatalog,
          { [Styles.btnCatalogTopLevel]: props.topLevel },
          { [Styles.btnIsOpen]: props.open },
          { [Styles.isPreviewed]: props.selected }
        )}
        title={props.title}
        onClick={props.onClick}
      >
        <If condition={!props.topLevel}>
          <span className={Styles.folder}>
            {props.open ? (
              <Icon glyph={Icon.GLYPHS.folderOpen} />
            ) : (
              <Icon glyph={Icon.GLYPHS.folder} />
            )}
          </span>
        </If>
        {props.text}
        <span
          className={classNames(Styles.caret, {
            [Styles.offsetRight]: props.removable
          })}
        >
          {props.open ? (
            <Icon glyph={Icon.GLYPHS.opened} />
          ) : (
            <Icon glyph={Icon.GLYPHS.closed} />
          )}
        </span>
      </button>
      <If condition={props.removable}>
        <button
          type="button"
          className={Styles.trashGroup}
          title={t("dataCatalog.groupRemove")}
          onClick={props.removeUserAddedData}
        >
          <Icon glyph={Icon.GLYPHS.trashcan} />
        </button>
      </If>
      <If condition={props.open}>
        <ul
          className={classNames(Styles.catalogGroup, {
            [Styles.catalogGroupLowerLevel]: !props.topLevel
          })}
        >
          <Choose>
            <When condition={props.loading}>
              <li key="loader">
                <Loader />
              </li>
            </When>
            <When condition={props.children.length === 0 && props.emptyMessage}>
              <li
                className={classNames(Styles.label, Styles.labelNoResults)}
                key="empty"
              >
                {props.emptyMessage}
              </li>
            </When>
          </Choose>
          {props.children}
        </ul>
      </If>
    </li>
  );
}

CatalogGroup.propTypes = {
  text: PropTypes.string,
  title: PropTypes.string,
  topLevel: PropTypes.bool,
  open: PropTypes.bool,
  loading: PropTypes.bool,
  emptyMessage: PropTypes.string,
  onClick: PropTypes.func,
  children: PropTypes.oneOfType([
    PropTypes.element,
    PropTypes.arrayOf(PropTypes.element)
  ]),
  selected: PropTypes.bool,
  removable: PropTypes.bool,
  removeUserAddedData: PropTypes.func
};

export default CatalogGroup;
