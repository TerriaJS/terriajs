import React from "react";
import Styles from "./guidance-dot.scss";

export const GuidanceDot = () => {
  return (
    <button className={Styles.oval}>
      <div className={Styles.innerClone} />
      <div className={Styles.inner} />
    </button>
  );
};

export default GuidanceDot;
