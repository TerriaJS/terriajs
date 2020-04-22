import Constructor from "../Core/Constructor";
import Model from "../Models/Model";
import CatalogFunctionTraits from "../Traits/CatalogFunctionTraits";
import CatalogMemberMixin from "./CatalogMemberMixin";
import FunctionParameter from "../Models/FunctionParameter";
import ResultPendingCatalogItem from "../Models/ResultPendingCatalogItem";
import { runInAction } from "mobx";
import CommonStrata from "../Models/CommonStrata";
import createStratumInstance from "../Models/createStratumInstance";
import { InfoSectionTraits } from "../Traits/CatalogMemberTraits";
import isDefined from "../Core/isDefined";

const sprintf = require("terriajs-cesium/Source/ThirdParty/sprintf").default;

type CatalogFunction = Model<CatalogFunctionTraits>;

function CatalogFunctionMixin<T extends Constructor<CatalogFunction>>(Base: T) {
  abstract class CatalogFunctionMixin extends CatalogMemberMixin(Base) {
    abstract async invoke(): Promise<void>;

    // TODO: Move parameters into Traits
    abstract get parameters(): FunctionParameter[];

    createPendingCatalogItem(): ResultPendingCatalogItem {
      const now = new Date();
      const timestamp = sprintf(
        "%04d-%02d-%02dT%02d:%02d:%02d",
        now.getFullYear(),
        now.getMonth() + 1,
        now.getDate(),
        now.getHours(),
        now.getMinutes(),
        now.getSeconds()
      );

      const id = `${this.name} ${timestamp}`;
      const resultPendingCatalogItem = new ResultPendingCatalogItem(
        id,
        this.terria
      );
      resultPendingCatalogItem.showsInfo = true;
      resultPendingCatalogItem.isMappable = true;

      const inputsSection =
        '<table class="cesium-infoBox-defaultTable">' +
        this.parameters.reduce((previousValue, parameter) => {
          return (
            previousValue +
            "<tr>" +
            '<td style="vertical-align: middle">' +
            parameter.name +
            "</td>" +
            "<td>" +
            parameter.formatValueAsString(parameter.value) +
            "</td>" +
            "</tr>"
          );
        }, "") +
        "</table>";

      runInAction(() => {
        resultPendingCatalogItem!.setTrait(CommonStrata.user, "name", id);
        resultPendingCatalogItem!.setTrait(
          CommonStrata.user,
          "description",
          `This is the result of invoking the ${this.name} process or service at ${timestamp} with the input parameters below.`
        );

        const info = createStratumInstance(InfoSectionTraits, {
          name: "Inputs",
          content: inputsSection
        });
        resultPendingCatalogItem!.setTrait(CommonStrata.user, "info", [
          info
        ]);
      });
      return resultPendingCatalogItem;
    }

    setErrorOnPendingItem(resultPendingCatalogItem: ResultPendingCatalogItem, errorMessage?: string) {
      runInAction(() => {
        if (isDefined(resultPendingCatalogItem)) {
          resultPendingCatalogItem.setTrait(
            CommonStrata.user,
            "shortReport",
            `${this.typeName ||
              this
                .type} invocation failed. More details are available on the Info panel.`
          );

          const errorInfo = createStratumInstance(InfoSectionTraits, {
            name: "Error Details",
            content: errorMessage || "The reason for failure is unknown."
          });
          const info = resultPendingCatalogItem.getTrait(
            CommonStrata.user,
            "info"
          );
          if (isDefined(info)) {
            info.push(errorInfo);
          }
        }
      });
    }

    get hasCatalogFunctionMixin() {
      return true;
    }
  }

  return CatalogFunctionMixin;
}

namespace CatalogFunctionMixin {
  export interface CatalogFunctionMixin
    extends InstanceType<ReturnType<typeof CatalogFunctionMixin>> {}
  export function isMixedInto(model: any): model is CatalogFunctionMixin {
    return model && model.hasCatalogFunctionMixin;
  }
}

export default CatalogFunctionMixin;
