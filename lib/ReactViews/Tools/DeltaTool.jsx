import React, { useEffect, useLayoutEffect, useState } from "react";
import DateTimePicker from "../../ReactViews/BottomDock/Timeline/DateTimePicker.jsx";
import PropTypes from "prop-types";
import Styles from "./delta-tool.scss";
import MapInteractionMode from "../../Models/MapInteractionMode";
import raiseErrorToUser from "../../Models/raiseErrorToUser";
import Loader from "../Loader";
import createCatalogMemberFromType from "../../Models/createCatalogMemberFromType";
import Icon from "../Icon.jsx";
import knockout from "terriajs-cesium/Source/ThirdParty/knockout";
import defined from "terriajs-cesium/Source/Core/defined";
import { formatDateTime } from "../BottomDock/Timeline/DateFormats";
import dateFormat from "dateformat";

function DeltaTool({ terria, tool, onCloseTool }) {
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
  const pickers = [useDatePickerState(), useDatePickerState()];

  // Duplicate the catalog item
  useLayoutEffect(() => {
    const newItem = duplicateItem(catalogItem);
    newItem.isEnabled = true;
    newItem.useOwnClock = true;
    setItem(newItem);
  }, [catalogItem]);

  // Setup a map interaction mode to pick a location, retry on failure
  useEffect(() => {
    if (location === undefined && item) {
      const message = "Select a point by clicking on the map";
      return userPickLocation(terria, message, (picked, retry) => {
        const feature = picked.features.find(
          feature => feature.imageryLayer === item.imageryLayer
        );
        if (feature) {
          try {
            item.filterIntervalsByFeature(feature, picked);
            setDatesFromAvailableDates(item.availableDates);
            setLocation(picked.pickPosition);
          } catch (e) {
            raiseErrorToUser(terria, e);
          }
        } else {
          retry(
            "Failed to resolve location! Please select a point again by clicking on the map"
          );
        }
      });
    }
  });

  function renderLocationPicker() {
    return (
      <h3>
        To view available imagery, please select your location of interest on
        the map opposite.
      </h3>
    );
  }

  function renderDatePickers() {
    if (!item) return null;

    // Set a pickers state. If the target picker opens, close the other.
    const setIsOpen = (pickerId, isOpen) => {
      const [thisPicker, otherPicker] =
        pickerId === 0 ? pickers : [pickers[1], pickers[0]];
      thisPicker.setIsOpen(isOpen);
      if (isOpen) {
        otherPicker.setIsOpen(false); // close other picker
      }
    };

    const availableDates = item.availableDates;
    const dateFormatting = item.dateFormat && item.dateFormat.currentTime;
    return (
      <div className={Styles.datePickers}>
        <section>
          <h4>Primary image</h4>
          <div title="Select a time">
            <DatePicker
              date={primaryDate}
              setDate={setPrimaryDate}
              availableDates={availableDates}
              dateFormatting={dateFormatting}
              isOpen={pickers[0].isOpen}
              setIsOpen={isOpen => setIsOpen(0, isOpen)}
            />
          </div>
        </section>
        <section>
          <h4>Secondary image</h4>
          <div title="Select a time">
            <DatePicker
              date={secondaryDate}
              setDate={setSecondaryDate}
              availableDates={availableDates}
              dateFormatting={dateFormatting}
              isOpen={pickers[1].isOpen}
              setIsOpen={isOpen => setIsOpen(1, isOpen)}
            />
          </div>
        </section>
      </div>
    );
  }

  function cancelDeltaTool() {
    if (item) item.isEnabled = false;
    onCloseTool();
  }

  function generateDelta() {
    const firstDateStr = dateFormat(primaryDate, "dd-mm-yyyy");
    const secondDateStr = dateFormat(secondDateStr, "dd-mm-yyyy");

    item.name = `Change Detection: ${catalogItem.name}`; // TODO: set a name that is guaranteed to be unique
    item.featureTimesProperty = undefined; // Hide the location filter
    item.clock = undefined; // Make it a non-time-dynamic item
    item.intervals = undefined;
    item.supportsDeltaComparison = false;
    item.disableUserChanges = true; // Hide controls like the style selector

    // Trim lines to prevent <pre> wrapping during markdown conversion
    item.shortReport = trimLines(`
      # Description
      This layer visualizes the difference between imagery captured at two discrete points in time.

      **Primary image**: ${firstDateStr}<br/>
      **Secondary image**: ${secondDateStr}
    `);

    // item.loadingMessage = "Loading difference map";
    // item.isLoading = true;
    item.styles = "ndvi"; // TODO: remove
    item.showDeltaImagery(firstDateStr, secondDateStr);
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
      <h1 className={Styles.title}>Change Detection: Timeseries Data</h1>
      <div className={Styles.body}>
        <div>
          <span>
            This tool visualizes the difference between imagery captured at two
            discrete points in time.
          </span>
          {location && (
            <div className={Styles.location}>
              ${location.x}, ${location.y}
            </div>
          )}
          {location === undefined
            ? renderLocationPicker()
            : renderDatePickers()}
        </div>
        <div className={Styles.buttons}>
          <button className={Styles.cancelBtn} onClick={cancelDeltaTool}>
            Cancel
          </button>
          <button
            className={Styles.generateDeltaBtn}
            onClick={generateDelta}
            disabled={location === undefined}
          >
            Generate Difference Map
          </button>
        </div>
      </div>
    </div>
  );
}

DeltaTool.propTypes = {
  terria: PropTypes.object.isRequired,
  tool: PropTypes.object.isRequired,
  onCloseTool: PropTypes.func.isRequired
};

DeltaTool.displayName = "DeltaTool";

function DatePicker({
  date,
  availableDates,
  setDate,
  dateFormatting,
  isOpen,
  setIsOpen
}) {
  const toggleOpen = e => {
    setIsOpen(!isOpen);
    e.stopPropagation();
  };

  const formattedDate = defined(dateFormatting)
    ? dateFormat(date, dateFormatting)
    : formatDateTime(date);

  const { prevDate, nextDate } = findNextAndPrevDates(date, availableDates);
  return (
    <div>
      <div className={Styles.pickerButtons}>
        <button
          className={Styles.previousDate}
          title="Previous time"
          disabled={!defined(prevDate)}
          onClick={() => setDate(prevDate)}
        >
          <Icon glyph={Icon.GLYPHS.previous} />
        </button>
        <button
          className={Styles.currentDate}
          onClick={toggleOpen}
          title="Select a time"
        >
          {defined(formattedDate) ? formattedDate : "Currently out of range."}
        </button>
        <button
          className={Styles.nextDate}
          title="Next time"
          disabled={!defined(nextDate)}
          onClick={() => setDate(nextDate)}
        >
          <Icon glyph={Icon.GLYPHS.next} />
        </button>
      </div>
      <div className={Styles.picker}>
        <DateTimePicker
          currentDate={date}
          dates={availableDates}
          onChange={setDate}
          popupStyle={Styles.datePickerPopup}
          openDirection="none"
          isOpen={isOpen}
          showCalendarButton={false}
          onOpen={() => setIsOpen(true)}
          onClose={() => setIsOpen(false)}
        />
      </div>
    </div>
  );
}

DatePicker.propTypes = {
  date: PropTypes.object.isRequired,
  setDate: PropTypes.func.isRequired,
  availableDates: PropTypes.array.isRequired,
  dateFormatting: PropTypes.string,
  isOpen: PropTypes.bool,
  setIsOpen: PropTypes.func.isRequired
};

function userPickLocation(terria, initialMessage, callback) {
  let pickPointMode;
  let subscription;
  let isDisposed;

  const setupPicker = message => {
    isDisposed = false;
    pickPointMode = new MapInteractionMode({ message });
    terria.mapInteractionModeStack.push(pickPointMode);
    console.log("**push**", terria.mapInteractionModeStack.length);

    subscription = knockout
      .getObservable(pickPointMode, "pickedFeatures")
      .subscribe(pickedFeatures => {
        pickPointMode.customUi = function() {
          return <Loader message="Querying position..." />;
        };

        subscription.dispose();
        pickedFeatures.allFeaturesAvailablePromise.then(() => {
          if (!isDisposed) {
            disposer();
            callback(pickedFeatures, setupPicker);
          }
        });
      });
  };

  const disposer = () => {
    subscription.dispose();
    isDisposed = true;
    const [currentMode] = terria.mapInteractionModeStack.slice(-1);
    if (currentMode === pickPointMode) {
      terria.mapInteractionModeStack.pop();
    }
    console.log("**dispose**", terria.mapInteractionModeStack.length);
  };

  setupPicker(initialMessage);
  return disposer;
}

function useDatePickerState() {
  const [isOpen, setIsOpen] = useState(false);
  return { isOpen, setIsOpen };
}

function duplicateItem(item) {
  const serializedItem = item.serializeToJson();
  serializedItem.name = serializedItem.name + " (copy)";
  delete serializedItem.id;
  const newItem = createCatalogMemberFromType(item.type, item.terria);
  newItem.updateFromJson(serializedItem);
  return newItem;
}

function findNextAndPrevDates(date, availableDates) {
  const dateIndex = availableDates.indexOf(date);
  const prevDate = dateIndex > 0 ? availableDates[dateIndex - 1] : undefined;
  const nextDate =
    dateIndex < availableDates.length - 1
      ? availableDates[dateIndex + 1]
      : undefined;
  return { prevDate, nextDate };
}

function trimLines(text) {
  return text
    .split("\n")
    .map(ln => ln.trim())
    .join("\n");
}

module.exports = DeltaTool;
