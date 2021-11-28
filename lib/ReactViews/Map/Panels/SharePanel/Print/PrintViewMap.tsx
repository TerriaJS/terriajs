import React, {useState } from "react";

interface Props {
  screenshot: Promise<string>;
}

const PrintViewMap = (props: Props) => {
  const [map, setMap] = useState<string | null>(null);
  const [isError, setError] = useState(false);

  props.screenshot.then(setMap).catch(() => setError(true));

  return isError? <div>Error has occured</div> : map?<img className="map-image" src={map} alt="Map snapshot" /> : <div>Loading</div>;
};

export default PrintViewMap;
