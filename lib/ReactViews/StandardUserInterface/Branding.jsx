import React from "react";
import Styles from "./Branding.scss";
import { useHistory } from "react-router-dom";
import { RCChangeUrlParams } from "../../Models/Receipt";
import PropTypes from "prop-types";

const Branding = props => {
  const history = useHistory();

  /**
   * Clean react-dom params and load the catalogs
   * @returns {Promise<void>}
   */
  const goHome = async () => {
    history.push("/");
    await new Promise(resolve => setTimeout(resolve, 50));
    RCChangeUrlParams("", props.viewState);
  };

  return (
    <div className={Styles.branding}>
      <img
        onClick={goHome}
        src={require("../../../wwwroot/images/receipt/receipt-logo.svg")}
        className="{Styles.logo}"
      />
    </div>
  );
};
Branding.propTypes = {
  viewState: PropTypes.object.isRequired
};
export default Branding;
