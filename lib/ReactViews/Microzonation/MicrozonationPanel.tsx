import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { observer } from "mobx-react";
import { useTranslation } from "react-i18next";
import styled, { useTheme } from "styled-components";
import triggerResize from "../../Core/triggerResize";
import Box from "../../Styled/Box";
import Button, { RawButton } from "../../Styled/Button";
import Icon, { StyledIcon } from "../../Styled/Icon";
import Select from "../../Styled/Select";
import Text from "../../Styled/Text";
import { useViewState } from "../Context";

import Styles from "./microzonation-panel.scss";
import {
  Filters,
  MicrozonationDetail,
  MicrozonationRecord,
  emptyFilters,
  fetchWfsFeatures,
  fetchWfsDocuments,
  getDetailFromProperties,
  filterRecords,
  formatValue,
  uniqueSorted,
  computeGeometryBBox,
  MicrozonationDocument,
  formatDate
} from "./Microzonation";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";

interface Props {
  isVisible?: boolean;
  animationDuration?: number;
}

const Panel = styled(Box)<{
  isVisible?: boolean;
  isHidden?: boolean;
  $panelWidth: number;
}>`
  transition: all 0.25s;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  width: ${(props) => props.$panelWidth}px;
  min-width: ${(props) => props.$panelWidth}px;
  height: 100vh;
  will-change: width, min-width;
  ${(props) =>
    props.isVisible &&
    `
    visibility: visible;
    margin-right: 0;
  `}
  ${(props) =>
    props.isHidden &&
    `
    visibility: hidden;
    margin-right: -100%;
  `}
`;

const MicrozonationPanel: React.FC<Props> = observer((props) => {
  const viewState = useViewState();
  const terria = viewState.terria;
  const theme = useTheme();
  const { t } = useTranslation();

  const minPanelWidth = 360;
  const maxPanelWidth = 720;
  const [panelWidth, setPanelWidth] = useState(420);
  const panelRef = useRef<HTMLDivElement>(null);
  const resizeStateRef = useRef<{ startX: number; startWidth: number } | null>(
    null
  );
  const rafRef = useRef<number | null>(null);

  const wfsConfig = terria.configParameters.microzonationConfig;

  const [records, setRecords] = useState<MicrozonationRecord[]>([]);
  const [propertiesById, setPropertiesById] = useState<
    Map<string | number, any>
  >(new Map());
  const [geometryById, setGeometryById] = useState<Map<string | number, any>>(
    new Map()
  );
  const [filteredRecords, setFilteredRecords] = useState<MicrozonationRecord[]>(
    []
  );
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<
    MicrozonationRecord | undefined
  >(undefined);
  const [detail, setDetail] = useState<MicrozonationDetail | undefined>(
    undefined
  );
  const [loadingList, setLoadingList] = useState(false);
  const [listError, setListError] = useState<string | undefined>(undefined);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [documents, setDocuments] = useState<MicrozonationDocument[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  useEffect(() => {
    setHasLoaded(false);
    setRecords([]);
    setPropertiesById(new Map());
    setGeometryById(new Map());
    setFilteredRecords([]);
    setHasSearched(false);
    setSelectedRecord(undefined);
    setDetail(undefined);
    setListError(undefined);
    setDocuments([]);
    setLoadingDocs(false);
  }, [
    wfsConfig?.url,
    wfsConfig?.projectsLayerName,
    wfsConfig?.documentsLayerName,
    wfsConfig?.outputFormat
  ]);

  useEffect(() => {
    if (!props.isVisible || hasLoaded) {
      return;
    }

    let isMounted = true;

    const load = async () => {
      try {
        setLoadingList(true);
        setListError(undefined);
        const result = await fetchWfsFeatures(wfsConfig);
        if (isMounted) {
          setRecords(result.records);
          setPropertiesById(result.propertiesById);
          setGeometryById(result.geometryById);
          setHasLoaded(true);
        }
      } catch (error: any) {
        if (isMounted) {
          const status = Number(error?.message);
          const msg = !Number.isNaN(status)
            ? t("microzonation.errorApiStatus", { status })
            : error?.message || t("microzonation.errorLoadingList");
          setListError(msg);
        }
      } finally {
        if (isMounted) {
          setLoadingList(false);
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [props.isVisible, hasLoaded, wfsConfig, terria, t]);

  const provinceOptions = useMemo(
    () => uniqueSorted(records.map((r) => r.province)),
    [records]
  );
  const municipalityOptions = useMemo(() => {
    const filtered = filters.province
      ? records.filter((r) => r.province === filters.province)
      : records;
    return uniqueSorted(filtered.map((r) => r.municipality));
  }, [records, filters.province]);
  const microzonationLabels: Record<string, string> = {
    "2": t("microzonation.level2"),
    "3": t("microzonation.level3")
  };

  const cleLabels: Record<string, string> = {
    done: t("microzonation.cleDone"),
    no: t("microzonation.cleNo")
  };

  const applyFilters = () => {
    const next = filterRecords(records, filters);
    setFilteredRecords(next);
    setHasSearched(true);
    setSelectedRecord(undefined);
    setDetail(undefined);
  };

  const clearFilters = () => {
    setFilters(emptyFilters);
    setFilteredRecords([]);
    setHasSearched(false);
    setSelectedRecord(undefined);
    setDetail(undefined);
    setDocuments([]);
    setLoadingDocs(false);
  };

  const loadDetail = async (record: MicrozonationRecord) => {
    const resolved = getDetailFromProperties(propertiesById, record);
    setDetail(resolved);

    if (record.id === null || record.id === undefined) {
      setDocuments([]);
      setLoadingDocs(false);
      return;
    }

    setLoadingDocs(true);
    setDocuments([]);

    try {
      const fetchedDocuments = await fetchWfsDocuments(wfsConfig, record.id);
      setDocuments(fetchedDocuments);
    } catch {
      setDocuments([]);
    } finally {
      setLoadingDocs(false);
    }
  };

  const zoomToRecord = (record: MicrozonationRecord) => {
    if (record.id === null || record.id === undefined) return;
    const geometry = geometryById.get(record.id);
    if (!geometry) return;
    const bbox = computeGeometryBBox(geometry);
    if (!bbox) return;
    const rectangle = Rectangle.fromDegrees(
      bbox.west,
      bbox.south,
      bbox.east,
      bbox.north
    );
    terria.currentViewer.zoomTo(rectangle, 1.5);
  };

  const closePanel = () => {
    viewState.toggleMicrozonationPanel();
    terria.currentViewer.notifyRepaintRequired();
    setTimeout(function () {
      triggerResize();
    }, props.animationDuration || 1);
  };

  const onResizeStart = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      event.preventDefault();
      resizeStateRef.current = {
        startX: event.clientX,
        startWidth: panelWidth
      };

      const panel = panelRef.current;
      if (panel) {
        panel.style.transition = "none";
      }

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!resizeStateRef.current) {
          return;
        }
        if (rafRef.current !== null) {
          cancelAnimationFrame(rafRef.current);
        }
        rafRef.current = requestAnimationFrame(() => {
          if (!resizeStateRef.current || !panel) {
            return;
          }
          const delta = resizeStateRef.current.startX - moveEvent.clientX;
          const nextWidth = Math.min(
            maxPanelWidth,
            Math.max(minPanelWidth, resizeStateRef.current.startWidth + delta)
          );
          panel.style.width = `${nextWidth}px`;
          panel.style.minWidth = `${nextWidth}px`;
        });
      };

      const handleMouseUp = () => {
        if (rafRef.current !== null) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
        if (panel) {
          const finalWidth = parseInt(panel.style.width, 10);
          panel.style.transition = "";
          if (!Number.isNaN(finalWidth)) {
            setPanelWidth(finalWidth);
          }
        }
        resizeStateRef.current = null;
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    },
    [panelWidth]
  );

  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const sortedDocuments = useMemo(() => {
    if (!sortKey) return documents;
    const sorted = [...documents].sort((a: any, b: any) => {
      const aVal = a?.[sortKey];
      const bVal = b?.[sortKey];
      if (aVal === null) return 1;
      if (bVal === null) return -1;
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [documents, sortKey, sortDir]);

  const onSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  return (
    <Panel
      ref={panelRef}
      isVisible={props.isVisible}
      isHidden={!props.isVisible}
      charcoalGreyBg
      column
      $panelWidth={panelWidth}
    >
      <div
        className={Styles.resizeHandle}
        role="separator"
        aria-orientation="vertical"
        onMouseDown={onResizeStart}
      />
      <Box right>
        <RawButton
          css={`
            padding: 15px;
          `}
          onClick={closePanel}
        >
          <StyledIcon
            styledWidth={"16px"}
            fillColor={theme.textLightDimmed}
            opacity={0.5}
            glyph={Icon.GLYPHS.closeLight}
          />
        </RawButton>
      </Box>
      <Box
        column
        paddedHorizontally={2}
        styledHeight="100%"
        overflowY="auto"
        scroll
      >
        <Text bold extraExtraLarge textLight>
          {t("microzonation.panelTitle")}
        </Text>
        <Text medium color={theme.textLightDimmed}>
          {t("microzonation.panelBody")}
        </Text>

        <div className={Styles.sectionTitle}>
          {t("microzonation.searchTitle")}
        </div>

        <div className={Styles.filterGrid}>
          <div className={Styles.field}>
            <label className={Styles.fieldLabel}>
              {t("microzonation.province")}
            </label>
            <Select
              value={filters.province}
              onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
                const value = event.target.value;
                setFilters((prev) => ({ ...prev, province: value }));
              }}
              light
            >
              <option value="">{t("microzonation.allFeminine")}</option>
              {provinceOptions.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </Select>
          </div>
          <div className={Styles.field}>
            <label className={Styles.fieldLabel}>
              {t("microzonation.municipality")}
            </label>
            <Select
              value={filters.municipality}
              onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
                const value = event.target.value;
                setFilters((prev) => ({ ...prev, municipality: value }));
              }}
              light
            >
              <option value="">{t("microzonation.allMasculine")}</option>
              {municipalityOptions.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </Select>
          </div>
          <div className={Styles.field}>
            <label className={Styles.fieldLabel}>
              {t("microzonation.microzonation")}
            </label>
            <Select
              value={filters.microzonation}
              onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
                const value = event.target.value;
                setFilters((prev) => ({ ...prev, microzonation: value }));
              }}
              light
            >
              <option value="">{t("microzonation.allFeminine")}</option>
              {Object.entries(microzonationLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
          <div className={Styles.field}>
            <label className={Styles.fieldLabel}>
              {t("microzonation.cle")}
            </label>
            <Select
              value={filters.cle}
              onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
                const value = event.target.value;
                setFilters((prev) => ({ ...prev, cle: value }));
              }}
              light
            >
              <option value="">{t("microzonation.allFeminine")}</option>
              {Object.entries(cleLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className={Styles.actionsRow}>
          <Button
            primary
            onClick={applyFilters}
            disabled={loadingList || !records.length}
          >
            {t("microzonation.searchButton")}
          </Button>
          <Button secondary onClick={clearFilters}>
            {t("microzonation.clearButton")}
          </Button>
        </div>

        {loadingList && (
          <div className={Styles.notice}>{t("microzonation.loadingList")}</div>
        )}
        {listError && <div className={Styles.error}>{listError}</div>}

        {hasSearched && (
          <>
            <div className={Styles.sectionTitle}>
              {t("microzonation.listTitle")}
            </div>
            <div className={Styles.tableWrapper}>
              <table className={Styles.table}>
                <thead>
                  <tr>
                    <th>{t("microzonation.province")}</th>
                    <th>{t("microzonation.municipality")}</th>
                    <th>{t("microzonation.microzonation")}</th>
                    <th>{t("microzonation.msOrdinance")}</th>
                    <th>{t("microzonation.cle")}</th>
                    <th>{t("microzonation.cleOrdinance")}</th>
                    <th>{t("microzonation.municipalPlan")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.length === 0 && (
                    <tr>
                      <td colSpan={7} className={Styles.emptyState}>
                        {t("microzonation.noResults")}
                      </td>
                    </tr>
                  )}
                  {filteredRecords.map((record, index) => {
                    const isSelected = selectedRecord === record;
                    return (
                      <tr
                        key={`${record.id ?? index}`}
                        className={
                          isSelected ? Styles.rowSelected : Styles.rowClickable
                        }
                        onClick={() => {
                          setSelectedRecord(record);
                          void loadDetail(record);
                          zoomToRecord(record);
                        }}
                      >
                        <td>{formatValue(record.province)}</td>
                        <td>{formatValue(record.municipality)}</td>
                        <td>
                          {microzonationLabels[record.microzonation ?? ""] ??
                            formatValue(record.microzonation)}
                        </td>
                        <td>{formatValue(record.msOrdinance)}</td>
                        <td>
                          {cleLabels[record.cle ?? ""] ??
                            formatValue(record.cle)}
                        </td>
                        <td>{formatValue(record.cleOrdinance)}</td>
                        <td>{formatValue(record.municipalPlan)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {detail && (
          <div className={Styles.sectionTitle}>
            {t("microzonation.detailTitle")}
          </div>
        )}

        {detail && (
          <div className={Styles.detailWrapper}>
            <div className={Styles.detailSection}>
              <div className={Styles.detailHeading}>
                {t("microzonation.generalInfo")}
              </div>
              <table className={Styles.detailTable}>
                <tbody>
                  <tr>
                    <td>{t("microzonation.province")}</td>
                    <td>{formatValue(detail.generalInfo.province)}</td>
                  </tr>
                  <tr>
                    <td>{t("microzonation.municipality")}</td>
                    <td>{formatValue(detail.generalInfo.municipality)}</td>
                  </tr>
                  <tr>
                    <td>{t("microzonation.notes")}</td>
                    <td>
                      <span style={{ whiteSpace: "pre-line" }}>
                        {formatValue(detail.generalInfo.notes)}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className={Styles.detailSection}>
              <div className={Styles.detailHeading}>
                {t("microzonation.microzonation")}
              </div>
              <table className={Styles.detailTable}>
                <tbody>
                  <tr>
                    <td>{t("microzonation.microzonation")}</td>
                    <td>
                      {microzonationLabels[
                        detail.microzonation.microzonation ?? ""
                      ] ?? formatValue(detail.microzonation.microzonation)}
                    </td>
                  </tr>
                  <tr>
                    <td>{t("microzonation.msOrdinance")}</td>
                    <td>{formatValue(detail.microzonation.msOrdinance)}</td>
                  </tr>
                  <tr>
                    <td>{t("microzonation.msValidation")}</td>
                    <td>{formatValue(detail.microzonation.msValidation)}</td>
                  </tr>
                  <tr>
                    <td>{t("microzonation.msStandard")}</td>
                    <td>{formatValue(detail.microzonation.msStandard)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className={Styles.detailSection}>
              <div className={Styles.detailHeading}>
                {t("microzonation.cle")}
              </div>
              <table className={Styles.detailTable}>
                <tbody>
                  <tr>
                    <td>{t("microzonation.cle")}</td>
                    <td>
                      {cleLabels[detail.cle.cle ?? ""] ??
                        formatValue(detail.cle.cle)}
                    </td>
                  </tr>
                  <tr>
                    <td>{t("microzonation.cleOrdinance")}</td>
                    <td>{formatValue(detail.cle.cleOrdinance)}</td>
                  </tr>
                  <tr>
                    <td>{t("microzonation.cleValidation")}</td>
                    <td>{formatValue(detail.cle.cleValidation)}</td>
                  </tr>
                  <tr>
                    <td>{t("microzonation.cleStandard")}</td>
                    <td>{formatValue(detail.cle.cleStandard)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className={Styles.detailSection}>
              <div className={Styles.detailHeading}>
                {t("microzonation.civilProtectionPlan")}
              </div>
              <table className={Styles.detailTable}>
                <tbody>
                  <tr>
                    <td>{t("microzonation.municipalPlan")}</td>
                    <td>
                      {formatValue(detail.civilProtectionPlan.municipalPlan)}
                    </td>
                  </tr>
                  <tr>
                    <td>{t("microzonation.planLink")}</td>
                    <td>
                      {detail.civilProtectionPlan.link ? (
                        <a
                          href={detail.civilProtectionPlan.link}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {t("microzonation.open")}
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
        {detail && (
          <div className={Styles.sectionTitle}>
            {t("microzonation.documents")}
          </div>
        )}

        {detail && (
          <div className={Styles.detailWrapper}>
            {loadingDocs && (
              <div className={Styles.notice}>
                {t("microzonation.loadingDocuments")}
              </div>
            )}

            {!loadingDocs && documents.length === 0 && (
              <div className={Styles.emptyState}>
                {t("microzonation.noDocuments")}
              </div>
            )}

            {!loadingDocs && documents.length > 0 && (
              <div className={Styles.tableWrapper}>
                <table className={Styles.table}>
                  <thead>
                    <tr>
                      <th
                        onClick={() => onSort("typeDoc")}
                        style={{ cursor: "pointer" }}
                      >
                        {t("microzonation.typeDoc")}
                      </th>
                      <th
                        onClick={() => onSort("desc")}
                        style={{ cursor: "pointer" }}
                      >
                        {t("microzonation.description")}
                      </th>
                      <th
                        onClick={() => onSort("docFormat")}
                        style={{ cursor: "pointer" }}
                      >
                        {t("microzonation.docFormat")}
                      </th>
                      <th
                        onClick={() => onSort("startDate")}
                        style={{ cursor: "pointer" }}
                      >
                        {t("microzonation.startDate")}
                      </th>
                      <th
                        onClick={() => onSort("endDate")}
                        style={{ cursor: "pointer" }}
                      >
                        {t("microzonation.endDate")}
                      </th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {sortedDocuments.map((doc) => (
                      <tr key={doc.id} className={Styles.rowClickable}>
                        <td>{formatValue(doc.typeDoc)}</td>
                        <td>{formatValue(doc.desc)}</td>
                        <td>{formatValue(doc.docFormat)}</td>
                        <td>{formatDate(doc.startDate)}</td>
                        <td>{formatDate(doc.endDate)}</td>
                        <td>
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                          >
                            {t("microzonation.download")}
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        <div className={Styles.emergencyPlansLink}>
          <a
            href="help/municipal-emergency-plans.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("microzonation.municipalEmergencyPlans")}
          </a>
        </div>
      </Box>
    </Panel>
  );
});

export default MicrozonationPanel;
