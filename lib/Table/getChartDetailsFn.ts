import TableStyle from "./TableStyle";

export interface ChartDetails {
  title: string | undefined;
  xName: string | undefined;
  yName: string | undefined;
  units: string[];
  csvData: string;
}

export default function getChartDetailsFn(
  style: TableStyle,
  rowIds: number[]
): () => ChartDetails | undefined {
  return () => {
    if (!style.timeColumn || !style.colorColumn || rowIds.length < 2)
      return undefined;
    const chartColumns = [style.timeColumn, style.colorColumn];
    const csvData = [
      chartColumns.map(col => col!.title).join(","),
      ...rowIds.map(i =>
        chartColumns!.map(col => col.valueFunctionForType(i)).join(",")
      )
    ].join("\n");
    return {
      title: style.colorColumn?.title,
      xName: style.timeColumn?.title,
      yName: style.colorColumn?.title,
      units: chartColumns.map(column => column.units || ""),
      csvData
    };
  };
}
