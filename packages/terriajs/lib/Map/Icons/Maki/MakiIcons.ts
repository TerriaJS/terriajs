import icons from "./iconset-all_maki_icons.json";

export const allIcons = Object.keys(icons.iconGroups[0].svgs as any).map(
  (iconId: string) => iconId.replace(".svg", "")
);

export function isMakiIcon(id: string | undefined) {
  if (!id) return;
  const svgId = `${id}.svg`;
  const iconSvgs = icons.iconGroups[0].svgs as any;
  return svgId in iconSvgs;
}

/** Get SVG string for maki icon */
export function getMakiIcon(
  id: string | undefined,
  color: string,
  strokeWidth: number | undefined,
  strokeColor: string | undefined,
  height: number,
  width: number
) {
  if (id === "point") id = "circle";
  const svgId = `${id}.svg`;
  const iconSvgs = icons.iconGroups[0].svgs as any;
  if (svgId in iconSvgs) {
    if (!strokeColor || !strokeWidth) strokeWidth = 0;

    // Values are adapted from https://labs.mapbox.com/maki-icons/editor/
    const path = iconSvgs[svgId].pathData[0].d;
    const totalHeight = height + 4 + strokeWidth * 2;
    const totalWidth = width + 4 + strokeWidth * 2;
    const translate = Math.floor(2 + strokeWidth);
    const scaleHeight = height / 15;
    const scaleWidth = width / 15;

    return `data:image/svg+xml;base64,${btoa(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalHeight} ${totalWidth}" height="${totalHeight}" width="${totalWidth}"><title>${svgId}</title><rect fill="none" x="0" y="0" width="${totalWidth}" height="${totalHeight}"></rect>
      ${
        strokeWidth > 0
          ? `<path fill="${strokeColor}" transform="translate(${translate} ${translate}) scale(${scaleWidth} ${scaleHeight})" d="${path}" style="stroke-linejoin:round;stroke-miterlimit:4;" stroke="${strokeColor}" stroke-width="${strokeWidth}"></path>`
          : ""
      }
      <path fill="${color}" transform="translate(${translate} ${translate}) scale(${scaleWidth} ${scaleHeight})"  d="${path}" ></path></svg>`
    )}`;
  }
}
