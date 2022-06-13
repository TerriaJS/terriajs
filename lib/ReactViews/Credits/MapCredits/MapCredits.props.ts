import { ICredit } from "../Credit.type";
import GlobeOrMap from "../../../Models/GlobeOrMap";

export interface IMapCreditsProps {
  hideTerriaLogo: boolean;
  credits?: ICredit[];
  currentViewer: GlobeOrMap;
}
