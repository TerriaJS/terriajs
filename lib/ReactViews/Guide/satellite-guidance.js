import i18next from "i18next";

export const guideData = [
  {
    imageSrc: require("../../../wwwroot/images/guides/satellite-feature.jpg"),
    title: i18next.t("guidance.titleI"),
    body: i18next.t("guidance.bodyI"),
    prevText: i18next.t("guidance.prevI"),
    nextText: i18next.t("guidance.nextI")
  },
  {
    imageSrc: require("../../../wwwroot/images/guides/satellite-zoom.jpg"),
    title: i18next.t("guidance.titleII"),
    body: i18next.t("guidance.bodyII"),
    hidePrev: true
  },
  {
    imageSrc: require("../../../wwwroot/images/guides/satellite-time.jpg"),
    title: i18next.t("guidance.titleIII"),
    body: i18next.t("guidance.bodyIII")
  },
  {
    imageSrc: require("../../../wwwroot/images/guides/satellite-location.jpg"),
    title: i18next.t("guidance.titleIV"),
    body: i18next.t("guidance.bodyIV")
  },
  {
    imageSrc: require("../../../wwwroot/images/guides/satellite-styles.jpg"),
    title: i18next.t("guidance.titleV"),
    body: i18next.t("guidance.bodyV"),
    nextText: i18next.t("guidance.dismissText")
  }
];

export default guideData;
