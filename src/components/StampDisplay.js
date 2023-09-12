import React, { Component, Fragment } from 'react';
import App from './App';
import TimezoneSelect from 'react-timezone-select'
import Moment from 'react-moment';
import moment from 'moment-timezone';
import { atcb_init } from 'add-to-calendar-button';
import 'moment-timezone';
import '../css/DisplayStamp.scss';
import '../css/timezone-picker.scss';
import 'add-to-calendar-button/assets/css/atcb.css';

const params = new URLSearchParams(window.location.search);
const datestamp = parseInt( window.location.pathname.substr(1), 10 );

class StampDisplay extends Component {
  state = {
    zoneName: Intl.DateTimeFormat().resolvedOptions().timeZone,
    zone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    format: moment.localeData().longDateFormat('LT'),
    date: datestamp,
    enddate: params.has('enddate') ? parseInt( params.get('enddate'), 10 ) : datestamp + 3600,
    name: params.get('name') || null,
    description: params.get('description') || null,
    location: params.get('location') || null,

  };
  atcbConfig = {
    name: this.state.name ?? 'Calendar event',
    description: this.state.description,
    startDate: moment.unix(this.state.date).format('YYYY-MM-DD'),
    endDate: moment.unix(this.state.enddate).format('YYYY-MM-DD'),
    startTime: moment.unix(this.state.date).format('HH:mm'),
    endTime: moment.unix(this.state.enddate).format('HH:mm'),
    timeZone: 'GMT',
    location: this.state.location,
    options: [
      'iCal',
      'Google',
      'Apple',
      'MicrosoftTeams',
      'Outlook.com',
    ],
    hideCheckmark: true,
    buttonStyle: 'round',
  };
  componentDidMount() {
    if ( this.atcbConfig.name ) {
      try {
        atcb_init();
      } catch ( e ) {
        console.log( e );
        console.log( this.atcbConfig );
      }
    }
  }
  componentDidUpdate() {
    if ( this.atcbConfig.name ) {
      try {
        atcb_init();
      } catch ( e ) {
        console.log( e );
        console.log( this.atcbConfig );
      }
    }
  }
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
            <div className="time-utc">
              <p>or</p>
              <Moment tz="UTC" format="YYYY-MM-DD HH:mm z" unix>
                  {this.state.date}
              </Moment>
            </div>
            <div className="atcb">
              {JSON.stringify(this.atcbConfig, null, 4)}
            </div>
          </Fragment>
        }
      />
    );
  }
}

export default StampDisplay;
