import { Ref, useRef, useEffect } from "react";
import ViewState from "../../ReactViewModels/ViewState";

export function useRefForTerria(
  refName: string,
  viewState: ViewState // todo: reach into store without passing hook(?)
): Ref<HTMLElement> {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    viewState.updateAppRef(refName, ref);
  }, [ref]);
  return ref;
}
