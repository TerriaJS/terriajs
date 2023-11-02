import { BaseModel } from "../Definition/Model";
import Terria from "../Terria";
import CommonStrata from "../Definition/CommonStrata";

/**
 * Remove a user added data item or group
 */
export default function (terria: Terria, target: BaseModel) {
  terria.catalog.userAddedDataGroup.remove(CommonStrata.user, target);
}
