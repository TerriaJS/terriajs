import { ReactNode, useEffect, useState } from "react";

interface Props {
  screenshot: Promise<string>;
  children: ReactNode;
}

const PrintViewMap = (props: Props) => {
  const [map, setMap] = useState<string | null>(null);
  const [isError, setError] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMap(null);
    props.screenshot.then(setMap).catch(() => setError(true));
  }, [props.screenshot]);

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
