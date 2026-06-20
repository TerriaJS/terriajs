import { ConfigParameters } from "../../Models/Config/TerriaConfig";

export interface Analytics<
  TConfigParams extends ConfigParameters = ConfigParameters
> {
  start: (configParameters: TConfigParams) => void;
  logEvent: (
    category: string,
    action: string,
    label?: string,
    value?: number
  ) => void;
}
