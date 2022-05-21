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
    startDate: moment()
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
                    this.setState({ startDate: date.tz(this.state.zone) });
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
                    this.setState({ startDate: date.tz(this.state.zone) });
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
              onChange={timezone => {
                this.state.startDate.tz(this.state.zone.name);

                this.setState({ startDate: this.state.startDate, zone: timezone });
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
                  https://zonestamp.com/
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
