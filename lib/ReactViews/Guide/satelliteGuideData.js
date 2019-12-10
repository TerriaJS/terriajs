// Pass i18next.t from React component to re-render on language change
function satelliteGuideData(t) {
  return [
    {
      imageSrc: require("../../../wwwroot/images/guides/satellite-feature.jpg"),
      title: t("satelliteGuidance.titleI"),
      body: t("satelliteGuidance.bodyI"),
      prevText: t("satelliteGuidance.prevI"),
      nextText: t("satelliteGuidance.nextI")
    },
    {
      imageSrc: require("../../../wwwroot/images/guides/satellite-zoom.jpg"),
      title: t("satelliteGuidance.titleII"),
      body: t("satelliteGuidance.bodyII"),
      hidePrev: true
    },
    {
      imageSrc: require("../../../wwwroot/images/guides/satellite-time.jpg"),
      title: t("satelliteGuidance.titleIII"),
      body: t("satelliteGuidance.bodyIII")
    },
    {
      imageSrc: require("../../../wwwroot/images/guides/satellite-location.jpg"),
      title: t("satelliteGuidance.titleIV"),
      body: t("satelliteGuidance.bodyIV")
    },
    {
      imageSrc: require("../../../wwwroot/images/guides/satellite-styles.jpg"),
      title: t("satelliteGuidance.titleV"),
      body: t("satelliteGuidance.bodyV"),
      nextText: t("satelliteGuidance.dismissText")
    }
  ];
}

export default satelliteGuideData;
