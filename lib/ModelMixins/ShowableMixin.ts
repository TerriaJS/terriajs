import Model from "../Models/Model";
import Constructor from "../Core/Constructor";
import ShowableTraits, { InitialMessageTraits } from "../Traits/ShowableTraits";
import i18next from "i18next";
import Property from "terriajs-cesium/Source/DataSources/Property";
import { action, computed, observable } from "mobx";

const t = i18next.t.bind(i18next);

type ShowableModel = Model<ShowableTraits>;
type InitialMessageJSON = {
  [Property in keyof InitialMessageTraits]: any;
};

function ShowableMixin<T extends Constructor<ShowableModel>>(Base: T) {
  abstract class ShowableMixin extends Base {
    @observable
    private initialMessageShown = false;

    get hasShowableMixin() {
      return true;
    }

    @computed
    get shouldShowInitialMessage(): boolean {
      const hasTitle =
        this.initialMessage.title !== undefined &&
        this.initialMessage.title !== "" &&
        this.initialMessage.title !== null;
      const hasContent =
        this.initialMessage.content !== undefined &&
        this.initialMessage.content !== "" &&
        this.initialMessage.content !== null;
      return hasTitle && hasContent && !this.initialMessageShown;
    }

    @action
    showInitialMessage(): Promise<void> {
      this.initialMessageShown = true;
      return new Promise(resolve => {
        this.terria.notificationState.addNotificationToQueue({
          title: this.initialMessage.title ?? t("notification.title"),
          width: this.initialMessage.width,
          height: this.initialMessage.height,
          confirmText: this.initialMessage.confirmation
            ? this.initialMessage.confirmText
            : undefined,
          message: this.initialMessage.content ?? "",
          key: "initialMessage:" + this.initialMessage.key,
          confirmAction: () => resolve()
        });
      });
    }
  }
  return ShowableMixin;
}

namespace ShowableMixin {
  export interface ShowableMixin
    extends InstanceType<ReturnType<typeof ShowableMixin>> {}
  export function isMixedInto(model: any): model is ShowableMixin {
    return model && model.hasShowableMixin;
  }
}

export default ShowableMixin;
