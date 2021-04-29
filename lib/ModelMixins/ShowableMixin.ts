import Model from "../Models/Model";
import Constructor from "../Core/Constructor";
import ShowableTraits from "../Traits/ShowableTraits";
import i18next from "i18next";

const t = i18next.t.bind(i18next);

type ShowableModel = Model<ShowableTraits>;

function ShowableMixin<T extends Constructor<ShowableModel>>(Base: T) {
  abstract class ShowableMixin extends Base {
    private initialMessageShown = false;
    get hasShowableMixin() {
      return true;
    }

    showInitialMessageIfRequired(): Promise<void> {
      return new Promise(resolve => {
        /* Why do we need `this.initialMessageShown`? Why not just make this promise we're constructing a `computed`?
         *
         * We only want to show the initialMessage once per catalog item. The event handler for
         * this.terria.notificationState.raiseEvent causes state changes, and `computed`s can't have side effects.
         */
        const hasTitleOrMessage =
          (this.initialMessage.title !== undefined &&
            this.initialMessage.title !== "" &&
            this.initialMessage.title !== null) ||
          (this.initialMessage.content !== undefined &&
            this.initialMessage.content !== "" &&
            this.initialMessage.content !== null);
        if (!this.initialMessageShown && hasTitleOrMessage) {
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
          this.initialMessageShown = true;
        } else {
          resolve();
        }
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
