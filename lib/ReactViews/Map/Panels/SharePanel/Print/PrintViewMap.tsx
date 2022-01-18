import React, { useState } from "react";

interface Props {
  screenshot: Promise<string>;
  children: React.ReactNode;
}

const PrintViewMap = (props: Props) => {
  const [map, setMap] = useState<string | null>(null);
  const [isError, setError] = useState(false);


  props.screenshot.then(setMap).catch(() => setError(true));

  return isError ? (
    <div>Error has occured</div>
  ) : map ? (
    <div className="mapContainer">
      <img className="map-image" src={map} alt="Map snapshot" />
      {props.children}
    </div>
  ) : (
    <div>Loading</div>
  );
};

export default PrintViewMap;
