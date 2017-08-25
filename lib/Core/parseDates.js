import uniq from 'lodash.uniq';

function getOneYear(year, dates){
  // al data from a given year
  return dates.filter(d=>d.getUTCFullYear() === year)
}

function getOneMonth(yearData, monthIndex){
  // all data from certain month of that year
  return yearData.filter(y=>y.getUTCMonth() === monthIndex);
}

function getOneDay(monthData, dayIndex){
  return monthData.filter(m=>m.getUTCDate() === dayIndex)
}

function getMonthForYear(yearData){
  // get available months for a given year
  return uniq(yearData.map(d=>d.getUTCMonth()));
}

function getDaysForMonth(monthData){
  // get all available days given a month in a year
  // start from 1, so we need to change to 0 based
  return uniq(monthData.map(m=>m.getUTCDate()));
}


export default function processData(data){
  const dates = data;
  const years = uniq(dates.map(d=>d.getUTCFullYear()));
  const result = {};

  years.map(y=>{
    const yearData = getOneYear(y, dates);
    const monthinyear = {};
      getMonthForYear(yearData).forEach(monthIndex => {
        // if(y === 2017 && monthIndex === 7){
        //   debugger
        // }
            const monthData = getOneMonth(yearData, monthIndex);
            const daysinmonth = {};

            getDaysForMonth(monthData).forEach(dayIndex => daysinmonth[dayIndex] = getOneDay(monthData, dayIndex));
            monthinyear[monthIndex] = daysinmonth
          });
      result[y] = monthinyear;
      })
  return result;
}
