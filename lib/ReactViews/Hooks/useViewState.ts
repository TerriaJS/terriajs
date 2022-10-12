import { useContext } from "react";
import TerriaError from "../../Core/TerriaError";
import { ViewStateContext } from "../StandardUserInterface/ViewStateContext";

const useViewState = () => {
  const viewState = useContext(ViewStateContext);
  if (!viewState)
    throw new TerriaError({ message: "ViewState is not defined!" });
  return viewState;
};

export default useViewState;
