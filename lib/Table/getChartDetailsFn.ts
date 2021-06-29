import TableStyle from "./TableStyle";

export default function getChartDetailsFn(style: TableStyle, rowIds: number[]) {
  return () => {
    if (!style.timeColumn || !style.colorColumn || rowIds.length < 2) return {};
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
