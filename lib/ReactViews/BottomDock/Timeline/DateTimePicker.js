import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import ObserveModelMixin from '../../ObserveModelMixin';
import DatePicker from 'react-datepicker';

import defined from 'terriajs-cesium/Source/Core/defined';
import moment from 'moment';
import Styles from './timeline.scss';
import Icon from "../../Icon.jsx";

function daysInMonth(month,year) {
const n = new Date(year, month, 0).getDate();
return Array.apply(null, {length: n}).map(Number.call, Number)
}


const monthNames = [ "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" ]


const DateTimePicker = createReactClass({
    displayName: 'DateTimePicker',
    mixins: [ObserveModelMixin],

    propTypes: {
        name: PropTypes.string,
        currentDate: PropTypes.object,
        availableTimeObjects: PropTypes.array,
        onChange: PropTypes.func
    },

    getInitialState() {
        return {
          isOpen: false,
          year: null,
          month: null,
          day: null,
          time: null
        };
    },

    componentWillMount(){
      const currentDate = this.props.currentDate;
      if(currentDate){
        this.setState({
          year: currentDate.getUTCFullYear(),
          month: currentDate.getUTCMonth(),
          day: currentDate.getUTCDate(),
          time: currentDate
        })
      }
    },

    onChange(event) {
        // const index = this.props.availableTimeObjects.findIndex(s=>moment(s).format() === event.format());
        // this.setState({value: index});
        // this.props.onChange(index);
    },

    renderYearGrid(){
    const data = this.props.dates;
    const years = Object.keys(data);
    const monthOfYear = Array.apply(null, {length: 12}).map(Number.call, Number);
    return <div className={Styles.grid}>
            <div className={Styles.gridHeading}>Select a year</div>
            {years.map(y=><div className={Styles.gridRow} key={y} onClick={()=>this.setState({year: y, month: null, day: null, time: null})}>
             <span className={Styles.gridLabel}>{y}</span>
             <span className={Styles.gridRowInner12}>{monthOfYear.map(m=><span className={data[y][m] ? Styles.activeGrid : ''} key={m} ></span>)}</span></div>)}
           </div>
  },

  renderMonthGrid(){
    const data = this.props.dates;
    const year = this.state.year;
    return <div className={Styles.grid}>
              <div className={Styles.gridHeading}><button className={Styles.backbtn} onClick={()=>{this.setState({year: null, month: null, day: null, time:null})}}>{this.state.year}</button></div>

              {monthNames.map((m, i)=><div className={Styles.gridRow} key={m} onClick={()=> defined(data[year][i]) && this.setState({month: i, day: null, time: null})}>
             <span className={Styles.gridLabel}>{m}</span>
             <span className={Styles.gridRowInner31}>{daysInMonth(i+ 1, year).map(d=><span className={ defined(data[year][i]) && defined(data[year][i][d+1]) ? Styles.activeGrid : ''} key={d} ></span>)}</span></div>)}
           </div>
  },


    renderDayView(){
      const days = Object.keys(this.props.dates[this.state.year][this.state.month]);
      const daysTodisplay = days.map(d=>moment().date(d).month(this.state.month).year(this.state.year));
      const selected = defined(this.state.day) ? moment().date(this.state.day).month(this.state.month).year(this.state.year) : null;
      return <div className={Styles.dayPicker}>
              <div>
                <button className={Styles.backbtn} onClick={()=>{this.setState({year: null, month: null, day: null, time:null})}}>{this.state.year}</button>
                <button className={Styles.backbtn} onClick={()=>{this.setState({month: null, day: null, time:null})}}>{this.state.month}</button>
              </div>
              <DatePicker
                  inline
                  onChange={(value)=>this.setState({day: value.date(), time: null})}
                  includeDates={daysTodisplay}
                  selected={selected}
              />
              </div>
    },


      utsTimeDisplay(m){
        const hour = m.getUTCHours() < 10 ? `0${m.getUTCHours()}` : m.getUTCHours();
        const minute = m.getUTCMinutes() < 10 ? `0${m.getUTCMinutes()}` : m.getUTCMinutes();
        const second = m.getUTCSeconds() < 10 ? `0${m.getUTCSeconds()}` : m.getUTCSeconds();
        return `${hour}:${minute}:${second}`
      },

      renderHourView(){
        const timeOptions = this.props.dates[this.state.year][this.state.month][this.state.day].map((m)=>({
          value: m,
          label: this.utsTimeDisplay(m)
        }))

        return <div className={Styles.hourview}><select onChange={(event)=>this.setState({time: event.target.value})} value={this.state.time ? this.state.time: ''}><option value=''>Select a time</option> {timeOptions.map(t=> <option key={t.label} value={t.value}>{t.label}</option>)}</select></div>
      },

      goBack(){
        if(defined(this.state.time)){
          this.setState({
            time: null
          })
        } else if(defined(this.state.day)){
          this.setState({
            day: null
          })
        }
        else if(defined(this.state.month)){
          this.setState({
            month: null
          })
        }
        else if(defined(this.state.year)){
          this.setState({
            year: null
          })
        }
      },

    toggleDatePicker(){
      this.setState({
        isOpen: !this.state.isOpen
      })
    },

    renderDateSummray(time){
      const m = new Date(time);
        return <span><span>{m.getUTCFullYear()}/{m.getUTCMonth()}/{m.getUTCDate()}</span> <span>{this.utsTimeDisplay(m)}</span></span>
    },

    render() {
      if(this.props.dates){
        return (
            <div className={Styles.timeLineDatePicker}>
              <button className={Styles.togglebutton} onClick={()=>{this.toggleDatePicker()}}>
              {this.state.time ? this.renderDateSummray(this.state.time) : <Icon glyph={Icon.GLYPHS.calendar}/>}</button>
              {this.state.isOpen && <div className={Styles.datePicker}>
              <button className={Styles.backbutton} type='button' onClick={()=>this.goBack()}><Icon glyph={Icon.GLYPHS.left}/></button>
                {!defined(this.state.year) && this.renderYearGrid()}
                {defined(this.state.year) && !defined(this.state.month) && this.renderMonthGrid()}
                {(defined(this.state.year) && defined(this.state.month)) && this.renderDayView()}
                {(defined(this.state.year) && defined(this.state.month) && defined(this.state.day)) && this.renderHourView()}
              </div>}
            </div>
          );
      } else{
        return <div></div>
      }
    }
});

module.exports = DateTimePicker;
