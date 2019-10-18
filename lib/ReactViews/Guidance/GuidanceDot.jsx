import React from "react";
import Styles from "./guidance-dot.scss";

export const GuidanceDot = ({ onClick }) => {
  return (
    <button className={Styles.oval} onClick={onClick}>
      <div className={Styles.innerClone} />
      <div className={Styles.inner} />
    </button>
  );
};

export default GuidanceDot;
