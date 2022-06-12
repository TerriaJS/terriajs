import { ICredit } from "../Credit.type";

export interface ILeafletCreditsProps {
  hideTerriaLogo: boolean;
  prefix?: string;
  credits?: ICredit[];
  dataAttributions: string[];
}
