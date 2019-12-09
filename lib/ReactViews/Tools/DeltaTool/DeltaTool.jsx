import dateFormat from "dateformat";
import PropTypes from "prop-types";
import React, { useEffect, useState } from "react";
import raiseErrorToUser from "../../../Models/raiseErrorToUser";
import Styles from "./delta-tool.scss";
import DatePickers from "./DatePickers";
import LocationPicker from "./LocationPicker";
import duplicateItem from "../../../Models/duplicateItem";
import prettifyCoordinates from "../../../Map/prettifyCoordinates";
import { withTranslation, useTranslation } from "react-i18next";

/**
 * A tool for comparing imagery at two points in time.
 */
function DeltaTool({ terria, tool, onCloseTool, t }) {
  const { type, item: catalogItem } = tool;
  if (
    type !== "delta" ||
    !(catalogItem && catalogItem.supportsDeltaComparison)
  ) {
    return null;
  }

  const [item, setItem] = useState(undefined);
  const [location, setLocation] = useState(undefined);
  const [primaryDate, setPrimaryDate] = useState(catalogItem.discreteTime);
  const [secondaryDate, setSecondaryDate] = useState(catalogItem.discreteTime);
  const [pickerMessages, setPickerMessages] = useState({
    beforePick: "Select a point by clicking on the map",
    afterPick: "Click another point to change the selection"
  });

  useEffect(() => {
    // On mount; to avoid showing both imageries at once, we temporarily disable the parent catalog item.
    catalogItem.isShown = false;
    return () => {
      // Re-enable on unmount
      catalogItem.isShown = true;
    };
  }, []);

  // Duplicate the catalog item
  useEffect(() => {
    const newItem = duplicateItem(
      catalogItem,
      undefined,
      catalogItem.name + " (copy)"
    );
    newItem.isEnabled = true;
    newItem.isShown = true;
    newItem.useOwnClock = true;
    setItem(newItem);
  }, [catalogItem]);

  function onUserPickLocation(picked, latLong) {
    // TODO: If the item imagery has not loaded yet, features[] will be empty.
    // Ideally, pick location should be called only after the item imagery has been loaded
    // and we need some way to check that.

    // IE has no array.find() so we use the clunkier for loop to find the feature.
    let feature;
    for (let i = 0; i < picked.features.length; i++) {
      if (picked.features[i].imageryLayer === item.imageryLayer) {
        feature = picked.features[i];
        break;
      }
    }
    if (feature) {
      try {
        item.filterIntervalsByFeature(feature, picked);
        setDatesFromAvailableDates(item.availableDates);
        setLocation(latLong);
        setPickerMessages({
          beforePick: "Click another point to change the selection",
          afterPick: "Click another point to change the selection"
        });
      } catch (e) {
        raiseErrorToUser(terria, e);
      }
    } else {
      setPickerMessages({
        beforePick:
          "Error when trying to resolve imagery at location! Please select a different location or zoom level.",
        afterPick: "Click another point to change the selection"
      });
    }
  }

  function cancelDeltaTool() {
    if (item) item.isEnabled = false;
    onCloseTool();
  }

  function generateDelta() {
    const timestamp = dateFormat(new Date(), "yyyy-mm-dd'T'HH:MM:ss.l'Z'");
    item.name = `Change Detection: ${catalogItem.name} ${timestamp}`;
    item.featureTimesProperty = undefined; // Hide the location filter
    item.clock = undefined; // Make it a non-time-dynamic item
    item.intervals = undefined;
    item.supportsDeltaComparison = false;
    item.disableUserChanges = true; // Hide controls like the style selector

    const firstDateStr = dateDisplayFormat(primaryDate);
    const secondDateStr = dateDisplayFormat(secondaryDate);

    // Trim lines to prevent <pre> wrapping during markdown conversion
    item.shortReport = trimLines(`
      ${t("deltaTool.catalogItem.description")}

      **${t("deltaTool.primaryImage")}**:   ${firstDateStr}<br/>
      **${t("deltaTool.secondaryImage")}**: ${secondDateStr}
    `);

    // item.loadingMessage = "Loading difference map";
    // item.isLoading = true;

    const firstDateParam = dateParamFormat(primaryDate);
    const secondDateParam = dateParamFormat(secondaryDate);
    item.parameters["time"] = `${firstDateParam},${secondDateParam}`;

    item.showDeltaImagery(firstDateParam, secondDateParam);
    onCloseTool();
  }

  // Set primary & secondary dates to the last 2 available dates
  function setDatesFromAvailableDates(availableDates) {
    const [primaryDate, secondaryDate] = availableDates.slice(
      availableDates.length - 2
    );
    if (primaryDate) {
      setPrimaryDate(primaryDate);
      setSecondaryDate(secondaryDate || primaryDate);
    }
  }

  return (
    <div className={Styles.deltaTool}>
      <h1 className={Styles.title}>
        {t("deltaTool.titlePrefix")}: {catalogItem.name}
      </h1>
      <div className={Styles.body}>
        <div>
          <span>{t("deltaTool.description")}</span>
          {location && <PrettyLocation location={location} />}
          {location === undefined ? (
            <h3>{t("deltaTool.pickLocation")}</h3>
          ) : (
            <DatePickers
              item={item}
              primaryDate={primaryDate}
              setPrimaryDate={setPrimaryDate}
              secondaryDate={secondaryDate}
              setSecondaryDate={setSecondaryDate}
            />
          )}
        </div>
        <div className={Styles.buttons}>
          <button className={Styles.cancelBtn} onClick={cancelDeltaTool}>
            {t("deltaTool.cancelBtn")}
          </button>
          <button
            className={Styles.generateDeltaBtn}
            onClick={generateDelta}
            disabled={location === undefined}
          >
            {t("deltaTool.generateDeltaBtn")}
          </button>
        </div>
      </div>
      <LocationPicker
        terria={terria}
        location={location}
        onPick={onUserPickLocation}
        messages={pickerMessages}
      />
    </div>
  );
}

DeltaTool.propTypes = {
  terria: PropTypes.object.isRequired,
  tool: PropTypes.object.isRequired,
  onCloseTool: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired
};

DeltaTool.displayName = "DeltaTool";

function PrettyLocation({ location }) {
  const { t } = useTranslation();
  const prettyLocation = prettifyCoordinates(
    location.longitude,
    location.latitude
  );
  return (
    <section>
      <h4>{t("deltaTool.selectedLocation")}</h4>
      <div className={Styles.location}>
        {prettyLocation.latitude}, {prettyLocation.longitude}
      </div>
    </section>
  );
}

PrettyLocation.propTypes = {
  location: PropTypes.object.isRequired
};

PrettyLocation.displayName = "PrettyLocation";

function trimLines(text) {
  return text
    .split("\n")
    .map(ln => ln.trim())
    .join("\n");
}

function dateParamFormat(date) {
  return dateFormat(date, "yyyy-mm-dd'T'HH:MM:ss.l'Z'", true);
}

function dateDisplayFormat(date) {
  return dateFormat(date, "dd-mm-yyyy", true);
}

export default withTranslation()(DeltaTool);
