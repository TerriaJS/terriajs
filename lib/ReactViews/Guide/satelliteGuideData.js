import satelliteLocation from "../../../assets/images/guides/satellite-location.jpg";
import satelliteStyles from "../../../assets/images/guides/satellite-styles.jpg";
import satelliteTime from "../../../assets/images/guides/satellite-time.jpg";
import satelliteZoom from "../../../assets/images/guides/satellite-zoom.jpg";

// Pass i18next.t from React component to re-render on language change
function satelliteGuideData(t) {
  return [
    {
      imageSrc: satelliteZoom,
      title: t("satelliteGuidance.titleII"),
      body: t("satelliteGuidance.bodyII"),
      hidePrev: true
    },
    {
      imageSrc: satelliteTime,
      title: t("satelliteGuidance.titleIII"),
      body: t("satelliteGuidance.bodyIII")
    },
    {
      imageSrc: satelliteLocation,
      title: t("satelliteGuidance.titleIV"),
      body: t("satelliteGuidance.bodyIV")
    },
    {
      imageSrc: satelliteStyles,
      title: t("satelliteGuidance.titleV"),
      body: t("satelliteGuidance.bodyV"),
      hideNext: true
    }
  ];
}

export default satelliteGuideData;
