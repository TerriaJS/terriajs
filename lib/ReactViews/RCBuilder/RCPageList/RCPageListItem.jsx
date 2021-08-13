import Icon from "../../Icon";
import PropTypes from "prop-types";
import Styles from "./RCPageList.scss";
import React from "react";
function RCPageListItem(props) {
  const { page, editPage, deletePage, handleDrag, handleDrop } = props;
  return (
    <li
      key={page.id}
      className={Styles.listItem}
      id={page.id}
      draggable={true}
      onDragOver={ev => ev.preventDefault()}
      onDragStart={handleDrag}
      onDrop={handleDrop}
    >
      <Icon glyph={Icon.GLYPHS.reorder} class="reorder" />
      <span>{page.title}</span>
      <button onClick={() => editPage(page.id)}>
        <Icon glyph={Icon.GLYPHS.edit} />
      </button>
      <button onClick={() => deletePage(page.id)}>
        <Icon glyph={Icon.GLYPHS.trashcan} />
      </button>
    </li>
  );
}
RCPageListItem.propTypes = {
  page: PropTypes.object,
  editPage: PropTypes.func,
  deletePage: PropTypes.func,
  handleDrag: PropTypes.func,
  handleDrop: PropTypes.func
};
export default RCPageListItem;
