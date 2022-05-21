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
    zone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    date: window.location.pathname.substr(1)
  };
  render() {
    return (
      <App
        main={
          <Fragment>
            <p className="subhead">That's...</p>
            <div className="time-hour">
              <Moment tz={this.state.zone.name} format="h:mm a" unix>
                {this.state.date}
              </Moment>
            </div>
            <div className="time-day">
              <Moment tz={this.state.zone.name} format="dddd, MMMM Do YYYY" unix>
                {this.state.date}
              </Moment>
            </div>
            <div className="arrow-up display" />
            <TimezoneSelect
              className="timezone-picker"
	      classNamePrefix="timezone-picker-select"
              value={this.state.zone}
              onChange={timezone => {
                this.setState({ zone: timezone });
              }}
            />
          </Fragment>
        }
      />
    );
  }
}

export default StampDisplay;