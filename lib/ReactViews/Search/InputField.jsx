import React, { useState } from "react";
import Styles from "../Analytics/parameter-editors.scss";

export default function InputField({ name, label, onEnterKeyDown }) {
  const [state, setState] = useState("");
  return (
    <div>
      <label className={Styles.label}>{label}</label>
      <input
        className={Styles.field}
        type="text"
        value={state}
        name={name}
        onChange={e => {
          setState(e.target.value);
        }}
        onKeyDown={e => {
          if (e.key === "Enter") {
            e.preventDefault();
            onEnterKeyDown();
            setState("");
          }
        }}
      />
    </div>
  );
}
