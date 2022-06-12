import { ICredit } from "../Credit.type";

export interface ICesiumCreditsProps {
  hideTerriaLogo: boolean;
  credits?: ICredit[];
  expandDataCredits?: () => void;
  cesiumLogoElement?: HTMLElement;
}
