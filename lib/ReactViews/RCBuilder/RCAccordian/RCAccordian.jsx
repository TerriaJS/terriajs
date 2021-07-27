import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import Styles from "./RCAccordian.scss";
const RCAccordian = props => {
  const { title, children } = props;
  const [isOpen, setOpen] = React.useState(false);
  return (
    <div className={Styles.accordionWrapper}>
      <div
        className={classNames(Styles.accordionTitle, isOpen && Styles.open)}
        onClick={() => setOpen(!isOpen)}
      >
        {title}
      </div>
      <div
        className={classNames(
          Styles.accordionItem,
          !isOpen && Styles.collapsed
        )}
      >
        <div className={Styles.accordionContent}>{children}</div>
      </div>
    </div>
  );
};
RCAccordian.propTypes = {
  title: PropTypes.string,
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node
  ]).isRequired
};
export default RCAccordian;
