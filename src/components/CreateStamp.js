import React, { Component, Fragment } from 'react';
import App from './App';
import moment from 'moment-timezone';
import DatePicker from 'react-datepicker';
import TimezoneSelect from 'react-timezone-select'
import { Link } from 'react-router-dom';
import 'react-datepicker/dist/react-datepicker.css';
import '../css/CreateStamp.scss';
import '../css/DatepickerPortal.scss';
import '../css/timezone-picker.scss';

class CreateStamp extends Component {
  state = {
    zone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    zoneName: Intl.DateTimeFormat().resolvedOptions().timeZone,
    startDate: moment().startOf('minute')
  };
  render() {
    function showZonestampLink() {
      let button = document.getElementById('stamp-link-wrapper');
      //button.style.display = button.style.display === 'none' ? 'block' : 'none';
      if (button.style.display === 'none') {
        button.style.display = 'block';
      } else {
        button.style.display = 'none';
      }
    }
    // Style to improve contrast of dropdown indicator and "no options" message
    const style = {
      dropdownIndicator: (base, state) => ({
        ...base,
        color: state.isFocused ? 'white' : 'silver'
      }),
      noOptionsMessage: (base) => ({ ...base, color: 'white' })
    };
    return (
      <App
        main={
          <Fragment>
            <p>The event will take place on</p>
            <div className="time-wrapper">
              <div className="select-day">
                <DatePicker
                  selected={this.state.startDate}
                  onChange={date => {
                    this.setState({ startDate: date.tz(this.state.zoneName) });
                  }}
                  dateFormat="MMMM DD, YYYY"
                  withPortal
                />
              </div>
              <p>at</p>
              <div className="select-hour">
                <DatePicker
                  selected={this.state.startDate}
                  onChange={date => {
                    this.setState({ startDate: date.tz(this.state.zoneName) });
                  }}
                  showTimeSelect
                  showTimeSelectOnly
                  timeIntervals={15}
                  dateFormat="LT"
                  timeCaption="Time"
                  className="inline"
                  withPortal
                />
              </div>
            </div>
            <TimezoneSelect
              className="timezone-picker"
              classNamePrefix="timezone-picker-select"
              value={this.state.zone}
              styles={style}
              onChange={timezone => {
                let newStartDate = this.state.startDate.tz(timezone.value, true);
                this.setState({
                  startDate: newStartDate,
                  zone: timezone,
                  zoneName: timezone.value
                });
              }}
            />
            <button
              className="stamp-generate"
              onClick={showZonestampLink}>Generate Stamp!
            </button>
            <div id="stamp-link-wrapper" style={{ display: 'none' }}>
              <div className="arrow-up" />
              <div className="stamp-link">
                <Link to={'/' + this.state.startDate.unix()}>
                  {window.location.protocol + "//" + window.location.host}/
                  {this.state.startDate.unix()}
                </Link>
              </div>
            </div>
          </Fragment>
        }
      />
    );
  }
}

export default CreateStamp;
