import i18next from "i18next";
import loadWithXhr from "../Core/loadWithXhr";
import TerriaError from "../Core/TerriaError";
import {
  buildShareLink,
  buildShortShareLink,
  canShorten
} from "../ReactViews/Map/Panels/SharePanel/BuildShareLink";
import Terria from "./Terria";

export class FeedbackService {
  private _feedbackUrl: string;
  private _additionalFeedbackParameters: {
    name: string;
    descriptiveLabel: string;
  }[];
  private _terria: Terria;

  constructor({
    terria,
    feedbackUrl = terria.configParameters.feedbackUrl || "",
    additionalFeedbackParameters = []
  }: {
    terria: Terria;
    feedbackUrl?: string;
    additionalFeedbackParameters?: { name: string; descriptiveLabel: string }[];
  }) {
    this._terria = terria;
    this._feedbackUrl = feedbackUrl;
    this._additionalFeedbackParameters = additionalFeedbackParameters;
  }

  async sendFeedback(options: {
    title?: string;
    name: string;
    email: string;
    sendShareURL: boolean;
    comment: string;
    additionalParameters?: Record<string, string | undefined>;
  }) {
    try {
      const shareLinkPromise = options.sendShareURL
        ? canShorten(this._terria)
          ? buildShortShareLink(this._terria)
          : Promise.resolve(buildShareLink(this._terria))
        : Promise.resolve("Not shared");

      const shareLink = await shareLinkPromise;

      const feedbackData: Record<string, string | undefined> = {
        title: options.title,
        name: options.name,
        email: options.email,
        shareLink: shareLink,
        comment: options.comment
      };
      if (options.additionalParameters) {
        this._additionalFeedbackParameters.forEach(({ name }: any) => {
          feedbackData[name] = options.additionalParameters?.[name];
        });
      }
      let json = await loadWithXhr({
        url: this._feedbackUrl,
        responseType: "json",
        method: "POST",
        data: JSON.stringify(feedbackData),
        headers: {
          "Content-Type": "application/json"
        }
      });

      if (json instanceof String) {
        json = JSON.parse(json.toString());
      }
      if (typeof json === "string") {
        json = JSON.parse(json);
      }

      if (!json || !json.result || json.result !== "SUCCESS") {
        raiseError(
          this._terria,
          `Failed to parse response from server: \`${JSON.stringify(json)}\``
        );
        return false;
      } else {
        this._terria.notificationState.addNotificationToQueue({
          title: i18next.t("models.feedback.thanksTitle"),
          message: i18next.t("models.feedback.thanksMessage", {
            appName: this._terria.appName
          })
        });
        return true;
      }
    } catch (e) {
      raiseError(this._terria, e);
      return false;
    }
  }
}

function raiseError(terria: Terria, error: unknown) {
  terria.raiseErrorToUser(
    TerriaError.from(error, {
      title: i18next.t("models.feedback.unableToSendTitle"),
      message: i18next.t("models.feedback.unableToSendTitle")
    })
  );
}
