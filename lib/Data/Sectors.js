import Icon from "../ReactViews/Icon";
// Sector images
import Agriculture from "../../wwwroot/images/receipt/sectors/agriculture.jpg";
import Manufacturing from "../../wwwroot/images/receipt/sectors/manufacturing.png";
import InternationalCooperation from "../../wwwroot/images/receipt/sectors/international-cooperation.png";
import CoastalInfra from "../../wwwroot/images/receipt/sectors/coastal-Infra.png";
import Finance from "../../wwwroot/images/receipt/sectors/finance.png";

const sectors = [
  {
    id: "agriculture",
    title: "Agriculture",
    icon: Icon.GLYPHS.agriculture,
    iconHover: Icon.GLYPHS.agricultureHover,
    info: `European food security and agri-food based economy are vulnerable to anomalous weather features, for example concerning water scarcity and drought affecting soybean, rice, cocoa and coffee production outside Europe.
               This may impact raw material supply chains, food security or price volatility. `,
    image: Agriculture
  },
  {
    id: "manufacturing",
    title: "Manufacturing",
    icon: Icon.GLYPHS.manufacturing,
    iconHover: Icon.GLYPHS.manufacturingHover,
    info: `Supply of raw or processed input materials for European industries can be disrupted temporarily in case of heatwaves,
               floods or storms in source areas `,
    image: Manufacturing
  },
  {
    id: "internationalCooperationAndDevelopment",
    title: "International Cooperation",
    icon: Icon.GLYPHS.internationalCooperationAndDevelopment,
    iconHover: Icon.GLYPHS.internationalCooperationAndDevelopmentHover,
    info: `Europe’s foreign and development policy involving concerns for migration, food security, political crises,
               development aid and disaster risk reduction is highly affected by climatic risks and extremes,
               and the forced displacement and migration patterns in response to these.`,
    image: InternationalCooperation
  },
  {
    id: "coastalInfrastructure",
    title: "Coastal Infrastructure",
    icon: Icon.GLYPHS.coastalInfrastructure,
    iconHover: Icon.GLYPHS.coastalInfrastructureHover,
    info: `Civil protection and industrial production are heavily affected when storms or floods,
               aggravated by remote ice-sheet melting and sea level rise,
               lead to large damage to cities, ports or industrial plants in connected areas.`,
    image: CoastalInfra
  },
  {
    id: "finance",
    title: "Finance",
    icon: Icon.GLYPHS.finance,
    iconHover: Icon.GLYPHS.financeHover,
    info: `Strong or multiple tropical cyclones may affect the solvency of (re)insurance companies, investors and EU public finance.
              The finance sector and business are exposed via their portfolio and foreign direct investments`,
    image: Finance
  }
];

export default sectors;
