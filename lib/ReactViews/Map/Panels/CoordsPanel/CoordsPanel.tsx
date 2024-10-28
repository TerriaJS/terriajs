import classNames from "classnames";
import { TFunction } from "i18next";
import { observer } from "mobx-react";
import React, { useEffect } from "react";
import { WithTranslation, withTranslation } from "react-i18next";
import clipboard from "clipboard";
import Terria from "../../../../Models/Terria";
import ViewState from "../../../../ReactViewModels/ViewState";
import Box from "../../../../Styled/Box";
import Styles from "./coords-panel.scss";
import Select from "../../../../Styled/Select";
import Button from "../../../../Styled/Button";
import Input from "../../../../Styled/Input";
import Icon, { StyledIcon } from "../../../../Styled/Icon";
import createZoomToFunction from "../../../../Map/Vector/zoomRectangleFromPoint";
import loadJson from "../../../../Core/loadJson";
import {
  action,
  IReactionDisposer,
  makeObservable,
  observable,
  reaction,
  runInAction
} from "mobx";
import CesiumMath from "terriajs-cesium/Source/Core/Math";

const MenuPanel =
  require("../../../StandardUserInterface/customizable/MenuPanel").default;

interface ICoordsTextProps {
  name: string;
  title: string;
  message: string;
  tooltip: string;
  value: string;
  setValue: (value: string) => void;
  isCartographic: boolean;
  moveTo: () => void;
  readonly: boolean;
}

const CoordsText = (props: ICoordsTextProps) => {
  useEffect(() => {
    const clipboardBtn = new clipboard(`.btn-copy-${props.name}`);

    return function cleanup() {
      clipboardBtn.destroy();
    };
  }, [props.name]);

  return (
    <div>
      <div>{props.title}</div>
      <div className={Styles.explanation}>
        <i>{props.message}</i>
      </div>
      <Box>
        <Input
          title={props.tooltip}
          className={Styles.shareUrlfield}
          dark
          large
          type="text"
          value={props.value}
          readOnly={props.readonly ?? false}
          // placeholder={this.state.placeholder}
          // onClick={e => setValue(e)}
          onChange={(e) => props.setValue(e.target.value)}
          id={props.name}
        />
        <Button
          primary
          title="Copia le coordinate negli Appunti"
          css={`
            width: 35px;
            border-radius: 2px;
            margin: 2px;
          `}
          className={`btn-copy-${props.name}`}
          data-clipboard-target={`#${props.name}`}
        >
          <StyledIcon
            light
            realDark={false}
            glyph={Icon.GLYPHS.copy}
            styledWidth="24px"
          />
        </Button>
        <Button
          title="Centra la mappa alle coordinate indicate (attivo solo se sono cartografiche)"
          css={`
            width: 35px;
            border-radius: 2px;
            margin: 2px;
            background: #519ac2;
          `}
          disabled={!props.isCartographic}
          onClick={props.moveTo}
        >
          <StyledIcon
            light
            realDark={false}
            glyph={Icon.GLYPHS.location}
            styledWidth="24px"
          />
        </Button>
      </Box>
    </div>
  );
};

interface ISrsConversion {
  desc: string;
  from: number;
  to: number;
  transformForward: boolean;
  wkt?: string;
}

interface ISrsSelectionProps {
  title: string;
  tooltip: string;
  isCartographic: boolean;
  setSrs: (value: ISrsConversion) => void;
  reset: () => void;
  convert: () => void;
  conversionList: ISrsConversion[];
}

const SrsSelection = (props: ISrsSelectionProps) => {
  const isCartographic = props.isCartographic;
  const conversionList = props.conversionList;
  const setSrs = props.setSrs;
  useEffect(() => {
    setSrs(conversionList[0]);
  }, [isCartographic, conversionList, setSrs]);

  return (
    <div>
      <div>{props.title}</div>

      <Select
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
          props.setSrs(props.conversionList[parseInt(e.target.value, 10)]);
        }}
        title={props.tooltip}
      >
        {props.conversionList.map((conv, index) => {
          if (
            !props.isCartographic ||
            (props.isCartographic && conv.from === 4326)
          )
            return (
              <option key={index} className={Styles.crsItem} value={index}>
                {conv.desc}
              </option>
            );
        })}
      </Select>
      <Button
        primary
        css={`
          border-radius: 2px;
          margin: 2px;
        `}
        className={Styles.formatButton}
        onClick={props.convert}
      >
        Converti
      </Button>
      <Button
        css={`
          border-radius: 2px;
          margin: 2px;
        `}
        className={Styles.formatButton}
        onClick={props.reset}
      >
        Reset
      </Button>
    </div>
  );
};

interface PropTypes extends WithTranslation {
  terria: Terria;
  modalWidth: number;
  viewState: ViewState;
  onUserClick: () => void;
  btnDisabled: boolean;
  t: TFunction;
}

interface SharePanelState {
  isOpen: boolean;
}

@observer
class CoordsPanel extends React.Component<PropTypes, SharePanelState> {
  static displayName = "CoordsPanel";

  private conversionList: ISrsConversion[] = [
    {
      desc: "EPSG:4326 WGS84 → EPSG:3003 Monte Mario / Italy zone 1",
      from: 4326,
      to: 3003,
      transformForward: false,
      wkt: 'GEOGTRAN["CGT_AD400_MM_ETRS89_V1A",GEOGCS["GCS_Monte_Mario",DATUM["D_Monte_Mario",SPHEROID["International_1924",6378388.0,297.0]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],GEOGCS["GCS_ETRS_1989",DATUM["D_ETRS_1989",SPHEROID["GRS_1980",6378137.0,298.257222101]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],METHOD["NTv2"],PARAMETER["Dataset_it_emirom_ad400_v1/RER_AD400_MM_ETRS89_V1A",0.0]]'
    },
    {
      desc: "EPSG:4326 WGS84 → EPSG:3004 Monte Mario / Italy zone 2",
      from: 4326,
      to: 3004,
      transformForward: false,
      wkt: 'GEOGTRAN["CGT_AD400_MM_ETRS89_V1A",GEOGCS["GCS_Monte_Mario",DATUM["D_Monte_Mario",SPHEROID["International_1924",6378388.0,297.0]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],GEOGCS["GCS_ETRS_1989",DATUM["D_ETRS_1989",SPHEROID["GRS_1980",6378137.0,298.257222101]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],METHOD["NTv2"],PARAMETER["Dataset_it_emirom_ad400_v1/RER_AD400_MM_ETRS89_V1A",0.0]]'
    },
    {
      desc: "EPSG:4326 WGS84 → EPSG:4265 Monte Mario",
      from: 4326,
      to: 4265,
      transformForward: false,
      wkt: 'GEOGTRAN["CGT_AD400_MM_ETRS89_V1A",GEOGCS["GCS_Monte_Mario",DATUM["D_Monte_Mario",SPHEROID["International_1924",6378388.0,297.0]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],GEOGCS["GCS_ETRS_1989",DATUM["D_ETRS_1989",SPHEROID["GRS_1980",6378137.0,298.257222101]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],METHOD["NTv2"],PARAMETER["Dataset_it_emirom_ad400_v1/RER_AD400_MM_ETRS89_V1A",0.0]]'
    },
    {
      desc: "EPSG:4326 WGS84 → EPSG:5659 UTMRER",
      from: 4326,
      to: 5659,
      transformForward: false,
      wkt: 'GEOGTRAN["CGT_AD400_MM_ETRS89_V1A",GEOGCS["GCS_Monte_Mario",DATUM["D_Monte_Mario",SPHEROID["International_1924",6378388.0,297.0]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],GEOGCS["GCS_ETRS_1989",DATUM["D_ETRS_1989",SPHEROID["GRS_1980",6378137.0,298.257222101]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],METHOD["NTv2"],PARAMETER["Dataset_it_emirom_ad400_v1/RER_AD400_MM_ETRS89_V1A",0.0]]'
    },
    {
      desc: "EPSG:4326 WGS84 → EPSG:4258 ETRS89",
      from: 4326,
      to: 4258,
      transformForward: false
    },
    {
      desc: "EPSG:4326 WGS84 → EPSG:25832 ETRS89 / UTM zone 32N",
      from: 4326,
      to: 25832,
      transformForward: false
    },
    {
      desc: "EPSG:4326 WGS84 → EPSG:25833 ETRS89 / UTM zone 33N",
      from: 4326,
      to: 25833,
      transformForward: false
    },
    {
      desc: "EPSG:4326 WGS84 → EPSG:6706 RDN2008",
      from: 4326,
      to: 6706,
      transformForward: false
    },
    {
      desc: "EPSG:4326 WGS84 → EPSG:7791 RDN2008 / UTM zone 32N",
      from: 4326,
      to: 7791,
      transformForward: false
    },
    {
      desc: "EPSG:4326 WGS84 → EPSG:7792 RDN2008 / UTM zone 33N",
      from: 4326,
      to: 7792,
      transformForward: false
    },
    {
      desc: "EPSG:4326 WGS84 → EPSG:4230 ED50",
      from: 4326,
      to: 4230,
      transformForward: false,
      wkt: 'GEOGTRAN["CGT_ED50_ETRS89_GPS7_K2",GEOGCS["GCS_European_1950",DATUM["D_European_1950",SPHEROID["International_1924",6378388.0,297.0]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],GEOGCS["GCS_ETRS_1989",DATUM["D_ETRS_1989",SPHEROID["GRS_1980",6378137.0,298.257222101]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],METHOD["NTv2"],PARAMETER["Dataset_it_emirom_gps7_k2/RER_ED50_ETRS89_GPS7_K2",0.0]]'
    },
    {
      desc: "EPSG:4326 WGS84 → EPSG:23032 ED50 / UTM zone 32N",
      from: 4326,
      to: 23032,
      transformForward: false,
      wkt: 'GEOGTRAN["CGT_ED50_ETRS89_GPS7_K2",GEOGCS["GCS_European_1950",DATUM["D_European_1950",SPHEROID["International_1924",6378388.0,297.0]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],GEOGCS["GCS_ETRS_1989",DATUM["D_ETRS_1989",SPHEROID["GRS_1980",6378137.0,298.257222101]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],METHOD["NTv2"],PARAMETER["Dataset_it_emirom_gps7_k2/RER_ED50_ETRS89_GPS7_K2",0.0]]'
    },
    {
      desc: "EPSG:4326 WGS84 → EPSG:23033 ED50 / UTM zone 33N",
      from: 4326,
      to: 23033,
      transformForward: false,
      wkt: 'GEOGTRAN["CGT_ED50_ETRS89_GPS7_K2",GEOGCS["GCS_European_1950",DATUM["D_European_1950",SPHEROID["International_1924",6378388.0,297.0]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],GEOGCS["GCS_ETRS_1989",DATUM["D_ETRS_1989",SPHEROID["GRS_1980",6378137.0,298.257222101]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],METHOD["NTv2"],PARAMETER["Dataset_it_emirom_gps7_k2/RER_ED50_ETRS89_GPS7_K2",0.0]]'
    },
    {
      desc: "EPSG:4326 WGS84 → EPSG:32632 WGS 84 / UTM zone 32N",
      from: 4326,
      to: 32632,
      transformForward: false
    },
    {
      desc: "EPSG:4326 WGS84 → EPSG:32633 WGS 84 / UTM zone 33N",
      from: 4326,
      to: 32633,
      transformForward: false
    },
    {
      desc: "EPSG:3003 Monte Mario / Italy zone 1 → EPSG:4326 WGS84",
      from: 3003,
      to: 4326,
      transformForward: true,
      wkt: 'GEOGTRAN["CGT_AD400_MM_ETRS89_V1A",GEOGCS["GCS_Monte_Mario",DATUM["D_Monte_Mario",SPHEROID["International_1924",6378388.0,297.0]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],GEOGCS["GCS_ETRS_1989",DATUM["D_ETRS_1989",SPHEROID["GRS_1980",6378137.0,298.257222101]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],METHOD["NTv2"],PARAMETER["Dataset_it_emirom_ad400_v1/RER_AD400_MM_ETRS89_V1A",0.0]]'
    },
    {
      desc: "EPSG:3004 Monte Mario / Italy zone 2 → EPSG:4326 WGS84",
      from: 3004,
      to: 4326,
      transformForward: true,
      wkt: 'GEOGTRAN["CGT_AD400_MM_ETRS89_V1A",GEOGCS["GCS_Monte_Mario",DATUM["D_Monte_Mario",SPHEROID["International_1924",6378388.0,297.0]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],GEOGCS["GCS_ETRS_1989",DATUM["D_ETRS_1989",SPHEROID["GRS_1980",6378137.0,298.257222101]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],METHOD["NTv2"],PARAMETER["Dataset_it_emirom_ad400_v1/RER_AD400_MM_ETRS89_V1A",0.0]]'
    },
    {
      desc: "EPSG:4265 Monte Mario → EPSG:4326 WGS84",
      from: 4265,
      to: 4326,
      transformForward: true,
      wkt: 'GEOGTRAN["CGT_AD400_MM_ETRS89_V1A",GEOGCS["GCS_Monte_Mario",DATUM["D_Monte_Mario",SPHEROID["International_1924",6378388.0,297.0]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],GEOGCS["GCS_ETRS_1989",DATUM["D_ETRS_1989",SPHEROID["GRS_1980",6378137.0,298.257222101]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],METHOD["NTv2"],PARAMETER["Dataset_it_emirom_ad400_v1/RER_AD400_MM_ETRS89_V1A",0.0]]'
    },
    {
      desc: "EPSG:5659 UTMRER → EPSG:4326 WGS84",
      from: 5659,
      to: 4326,
      transformForward: true,
      wkt: 'GEOGTRAN["CGT_AD400_MM_ETRS89_V1A",GEOGCS["GCS_Monte_Mario",DATUM["D_Monte_Mario",SPHEROID["International_1924",6378388.0,297.0]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],GEOGCS["GCS_ETRS_1989",DATUM["D_ETRS_1989",SPHEROID["GRS_1980",6378137.0,298.257222101]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],METHOD["NTv2"],PARAMETER["Dataset_it_emirom_ad400_v1/RER_AD400_MM_ETRS89_V1A",0.0]]'
    },
    {
      desc: "EPSG:4258 ETRS89 → EPSG:4326 WGS84",
      from: 4258,
      to: 4326,
      transformForward: true
    },
    {
      desc: "EPSG:25832 ETRS89 / UTM zone 32N → EPSG:4326 WGS84",
      from: 25832,
      to: 4326,
      transformForward: true
    },
    {
      desc: "EPSG:25833 ETRS89 / UTM zone 33N → EPSG:4326 WGS84",
      from: 25833,
      to: 4326,
      transformForward: true
    },
    {
      desc: "EPSG:6706 RDN2008 → EPSG:4326 WGS84",
      from: 6706,
      to: 4326,
      transformForward: true
    },
    {
      desc: "EPSG:7791 RDN2008 / UTM zone 32N → EPSG:4326 WGS84",
      from: 7791,
      to: 4326,
      transformForward: true
    },
    {
      desc: "EPSG:7792 RDN2008 / UTM zone 33N → EPSG:4326 WGS84",
      from: 7792,
      to: 4326,
      transformForward: true
    },
    {
      desc: "EPSG:4230 ED50 → EPSG:4326 WGS84",
      from: 4230,
      to: 4326,
      transformForward: true,
      wkt: 'GEOGTRAN["CGT_ED50_ETRS89_GPS7_K2",GEOGCS["GCS_European_1950",DATUM["D_European_1950",SPHEROID["International_1924",6378388.0,297.0]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],GEOGCS["GCS_ETRS_1989",DATUM["D_ETRS_1989",SPHEROID["GRS_1980",6378137.0,298.257222101]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],METHOD["NTv2"],PARAMETER["Dataset_it_emirom_gps7_k2/RER_ED50_ETRS89_GPS7_K2",0.0]]'
    },
    {
      desc: "EPSG:23032 ED50 / UTM zone 32N → EPSG:4326 WGS84",
      from: 23032,
      to: 4326,
      transformForward: true,
      wkt: 'GEOGTRAN["CGT_ED50_ETRS89_GPS7_K2",GEOGCS["GCS_European_1950",DATUM["D_European_1950",SPHEROID["International_1924",6378388.0,297.0]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],GEOGCS["GCS_ETRS_1989",DATUM["D_ETRS_1989",SPHEROID["GRS_1980",6378137.0,298.257222101]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],METHOD["NTv2"],PARAMETER["Dataset_it_emirom_gps7_k2/RER_ED50_ETRS89_GPS7_K2",0.0]]'
    },
    {
      desc: "EPSG:23033 ED50 / UTM zone 33N → EPSG:4326 WGS84",
      from: 23033,
      to: 4326,
      transformForward: true,
      wkt: 'GEOGTRAN["CGT_ED50_ETRS89_GPS7_K2",GEOGCS["GCS_European_1950",DATUM["D_European_1950",SPHEROID["International_1924",6378388.0,297.0]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],GEOGCS["GCS_ETRS_1989",DATUM["D_ETRS_1989",SPHEROID["GRS_1980",6378137.0,298.257222101]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],METHOD["NTv2"],PARAMETER["Dataset_it_emirom_gps7_k2/RER_ED50_ETRS89_GPS7_K2",0.0]]'
    },
    {
      desc: "EPSG:32632 WGS 84 / UTM zone 32N → EPSG:4326 WGS84",
      from: 32632,
      to: 4326,
      transformForward: true
    },
    {
      desc: "EPSG:32633 WGS 84 / UTM zone 33N → EPSG:4326 WGS84",
      from: 32633,
      to: 4326,
      transformForward: true
    }
  ];

  //const [isOpen, setIsOpen] = useState(false);
  @observable private coordsInputTxt: string;
  @observable private coordsOutputTxt: string;
  private inputX?: number;
  private inputY?: number;
  private outputX?: number;
  private outputY?: number;
  private isInputCartographic: boolean;
  private isOutputCartographic: boolean;
  private srs: ISrsConversion;
  private pickedPositionSubscription: IReactionDisposer;
  private coordsInputTxtSubscription: IReactionDisposer;

  constructor(props: PropTypes) {
    super(props);
    makeObservable(this);
    this.changeOpenState = this.changeOpenState.bind(this);

    this.state = {
      isOpen: false
    };

    this.coordsInputTxt = "";
    this.coordsOutputTxt = "";
    this.isInputCartographic = false;
    this.isOutputCartographic = false;
    this.srs = this.conversionList[0];

    this.coordsInputTxtSubscription = reaction(
      () => this.coordsInputTxt,
      (coordsInputTxt) => {
        if (coordsInputTxt && coordsInputTxt !== "") {
          const splitted = coordsInputTxt.toString().split(/[ |,|;]+/g);
          this.inputX = parseFloat(splitted[0]);
          this.inputY = parseFloat(splitted[1]);
          this.isInputCartographic =
            this.inputX >= 0 &&
            this.inputX <= 360 &&
            this.inputY >= 0 &&
            this.inputY <= 360;
        }
      }
    );

    this.pickedPositionSubscription = reaction(
      () => this.props.terria.pickedPosition,
      (pickedPosition) => {
        if (pickedPosition) {
          const latitude = CesiumMath.toDegrees(
            pickedPosition.latitude
          ).toFixed(6);
          const longitude = CesiumMath.toDegrees(
            pickedPosition.longitude
          ).toFixed(6);
          const newText = `${latitude}, ${longitude}`;
          if (this.coordsInputTxt !== newText) {
            this.coordsInputTxt = newText;
          }
        }
      }
    );
  }

  changeOpenState(open: boolean) {
    this.setState({
      isOpen: open
    });
  }

  @action
  reset() {
    this.coordsInputTxt = "";
    this.coordsOutputTxt = "";
    this.isInputCartographic = false;
    this.isOutputCartographic = false;
  }

  moveToA(x?: number, y?: number) {
    if (!x || !y) return;

    const bboxSize = 0.005;
    const time = 2.0;
    const rectangle = createZoomToFunction(x, y, bboxSize);

    this.props.terria.currentViewer.zoomTo(rectangle, time);
    //this.props.terria.cesium._selectionIndicator.animateAppear();
  }

  async callConverter() {
    const terria = this.props.terria;
    if (
      !this.srs ||
      !this.inputX ||
      !this.inputY ||
      !terria.configParameters.coordsConverterUrl
    ) {
      return;
    }

    const url = terria.corsProxy.getURLProxyIfNecessary(
      terria.configParameters.coordsConverterUrl
    );

    const results = await loadJson(`${url}?inSR=${this.srs.from}
      &outSR=${this.srs.to}
      &geometries=${
        this.isInputCartographic
          ? this.inputY.toString() + "," + this.inputX.toString()
          : this.inputX.toString() + "," + this.inputY.toString()
      }
      &transformation=${
        this.srs.wkt ? JSON.stringify({ wkt: this.srs.wkt }) : "{}"
      }
      &transformForward=${this.srs.transformForward}
      &f=json`);

    if (results.geometries) {
      const geom = results.geometries[0];
      const areLatLon =
        geom.x >= 0 && geom.x <= 360 && geom.y >= 0 && geom.y <= 360;
      const x = geom.x.toFixed(areLatLon ? 6 : 4);
      const y = geom.y.toFixed(areLatLon ? 6 : 4);

      runInAction(() => {
        this.outputX = parseFloat(x);
        this.outputY = parseFloat(y);
        this.isOutputCartographic = areLatLon;
        this.coordsOutputTxt = areLatLon ? y + ", " + x : x + ", " + y;
      });
    } else {
      runInAction(() => {
        this.coordsOutputTxt = results.error.message;
      });
    }
  }

  render() {
    const { t } = this.props;
    const { modalWidth } = this.props;
    const dropdownTheme = {
      //btn: classNames(Styles.dropdownInner),
      //outer: classNames(Styles.sharePanel),
      inner: classNames(Styles.dropdownInner)
    };

    return (
      <MenuPanel
        theme={dropdownTheme}
        btnText={t("coordsPanel.header")}
        viewState={this.props.viewState}
        btnTitle={t("coordsPanel.btnConvertTitle")}
        isOpen={this.state.isOpen}
        onOpenChanged={this.changeOpenState}
        modalWidth={modalWidth}
        smallScreen={this.props.viewState.useSmallScreenInterface}
      >
        <CoordsText
          name="coordsIn"
          title="Coordinate"
          value={this.coordsInputTxt}
          setValue={action((value) => {
            this.coordsInputTxt = value;
          })}
          isCartographic={this.isInputCartographic}
          moveTo={() => {
            this.moveToA(this.inputX, this.inputY);
          }}
          message={t("coordsPanel.coordsInputMessage")}
          tooltip={t("coordsPanel.coordsInputTooltip")}
          readonly={false}
        />
        <SrsSelection
          title="Conversione"
          isCartographic={this.isInputCartographic}
          setSrs={(value: ISrsConversion) => {
            this.srs = value;
          }}
          reset={() => {
            this.reset();
          }}
          convert={() => {
            this.callConverter();
          }}
          conversionList={this.conversionList}
          tooltip={t("coordsPanel.srsSelectionTooltip")}
        />
        <CoordsText
          name="coordsOut"
          title="Risultato"
          value={this.coordsOutputTxt}
          setValue={action((value) => {
            this.coordsOutputTxt = value;
          })}
          isCartographic={this.isOutputCartographic}
          moveTo={() => {
            this.moveToA(this.outputY, this.outputX);
          }}
          readonly
          message={t("coordsPanel.coordsInputMessage")}
          tooltip=""
        />
      </MenuPanel>
    );
  }
}

export default withTranslation()(CoordsPanel);
