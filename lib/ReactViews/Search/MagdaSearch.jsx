"use strict";

import React, { useRef } from "react";
import InputField from "./InputField";
import Styles from "../Analytics/parameter-editors.scss";

function MagdaSearch(props) {
  const searchParameters = useRef(null);
  const startSearch = function() {
    const form = searchParameters.current;
    props.previewed.search(form["searchText"].value);
  };

  const ColoredLine = ({ color }) => (
    <hr
      style={{
        color: color,
        backgroundColor: color,
        height: 5
      }}
    />
  );

  return (
    <div>
      <ColoredLine color="red" />
      <div>
        <h3>Perform search at data.gov.au</h3>
      </div>
      <form ref={searchParameters}>
        <InputField
          label={"Type in search text. Press OK or Enter to start.)"}
          name="searchText"
          onEnterKeyDown={startSearch}
        />
      </form>

      <div>
        <button
          className={Styles.btnSelector}
          type="button"
          onClick={() => startSearch()}
        >
          <strong>OK</strong>
        </button>
      </div>
    </div>
  );
}

module.exports = MagdaSearch;
