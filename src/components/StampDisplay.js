import React, { Component, Fragment } from 'react';
import App from './App';
import TimezoneSelect from 'react-timezone-select'
import Moment from 'react-moment';
import moment from 'moment-timezone';
import 'moment-timezone';
import '../css/DisplayStamp.scss';
import '../css/timezone-picker.scss';

class StampDisplay extends Component {
  state = {
    zoneName: Intl.DateTimeFormat().resolvedOptions().timeZone,
    date: parseInt( window.location.pathname.substr(1), 10 ),
    zone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    format: moment.localeData().longDateFormat('LT')
  };
  changeFormat = () => {
    if (this.state.format === 'h:mm a' || this.state.format === 'h:mm A') {
      this.setState({ format: 'HH:mm' });
    } else {
      this.setState({ format: 'h:mm a' });
    }
  }
  render() {

    return (
      <App
        main={
          <Fragment>
            <p className="subhead">That's...</p>
            <div className="time-hour">
              <Moment tz={this.state.zoneName} format={this.state.format} unix>
		{this.state.date}
	      </Moment>
            </div>
            <button
              className="change-format"
              value={this.state.format}
              onClick={this.changeFormat}>24/12
            </button>
            <div className="time-day">
              <Moment tz={this.state.zoneName} format="dddd, MMMM Do YYYY" unix>
		{this.state.date}
	      </Moment>
            </div>
            <div className="arrow-up display" />
            <TimezoneSelect
              className="timezone-picker"
	      classNamePrefix="timezone-picker-select"
              value={this.state.zone}
              onChange={timezone => {
                this.setState({ zone: timezone, zoneName: timezone.value });
              }}
            />
          </Fragment>
        }
      />
    );
  }
}

export default StampDisplay;
