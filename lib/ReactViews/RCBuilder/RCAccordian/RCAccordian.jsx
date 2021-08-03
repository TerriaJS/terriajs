import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import Styles from "./RCAccordian.scss";

const RCAccordian = props => {
  const {
    title,
    hasAction,
    actionTitle,
    action,
    enableReorder,
    children
  } = props;
  const [isOpen, setOpen] = React.useState(true);
  return (
    <div className={Styles.accordionWrapper}>
      <div className={Styles.accordionHeader}>
        <div
          className={classNames(Styles.accordionTitle, isOpen && Styles.open)}
          onClick={() => setOpen(!isOpen)}
        >
          {title}
        </div>
        {hasAction && <button onClick={action}> {actionTitle}</button>}
      </div>
      <div
        className={classNames(
          Styles.accordionItem,
          !isOpen && Styles.collapsed
        )}
      >
        <ul
          className={Styles.accordionContent}
          id={enableReorder && "listContainer"}
        >
          {children}
        </ul>
      </div>
    </div>
  );
};
RCAccordian.propTypes = {
  title: PropTypes.string,
  hasAction: PropTypes.bool,
  actionTitle: PropTypes.string,
  action: PropTypes.func,
  enableReorder: PropTypes.bool,
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node
  ]).isRequired
};
export default RCAccordian;
