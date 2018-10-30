import React, { Component, Fragment } from 'react';
import App from './App';
import TimezonePicker from 'react-timezone';
import Moment from 'react-moment';
import 'moment-timezone';
import '../css/DisplayStamp.scss';

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
              <Moment tz={this.state.zone} format="h:mm a" unix>
                {this.state.date}
              </Moment>
            </div>
            <div className="time-day">
              <Moment tz={this.state.zone} format="dddd, MMMM Do YYYY" unix>
                {this.state.date}
              </Moment>
            </div>
            <div className="arrow-up display" />
            <TimezonePicker
              className="timezone-picker"
              value={this.state.zone}
              onChange={timezone => {
                this.setState({ zone: timezone });
              }}
              inputProps={{
                placeholder: 'Select Timezone...',
                name: 'timezone'
              }}
            />
          </Fragment>
        }
      />
    );
  }
}

export default StampDisplay;
