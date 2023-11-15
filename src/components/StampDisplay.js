import React, { Component, Fragment } from 'react';
import App from './App';
import TimezoneSelect from 'react-timezone-select'
import Moment from 'react-moment';
import moment from 'moment-timezone';
import origMoment from 'moment';
import { atcb_init } from 'add-to-calendar-button';
import 'moment-timezone';
import '../css/DisplayStamp.scss';
import '../css/timezone-picker.scss';
import 'add-to-calendar-button/assets/css/atcb.css';

class StampDisplay extends Component {
  state = {
    zoneName: Intl.DateTimeFormat().resolvedOptions().timeZone,
    zone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    dateFormat: 'dddd, ' + moment.localeData().longDateFormat('LL'),
    timeFormat: moment.localeData().longDateFormat('LT'),
    date: 0,
  };
  actuallyLoadMomentLocale( language ) {
    if (language === 'en') return Promise.resolve();
    return import(
      /* webpackInclude: /\.js$/ */
      /* webpackChunkName: "moment" */
      `moment/locale/${language}` ).then( (loadedModule) => {
      origMoment.locale(language);
      console.log( `Loaded locale ${language}` );
      return loadedModule;
    }, (error) => {
      console.warn( `Failure to load locale ${language}` );
      throw error;
    } );
  }
  loadMomentLocale() {
    let language = window.navigator.language.toLowerCase();
    if( !/^[a-z]{1,3}(?:-[a-z]{0,5})?$/.test(language) ) {
      return Promise.resolve();
    }

    return this.actuallyLoadMomentLocale( language ).catch( (error) => {
      language = language.slice(0, language.indexOf('-') );
      console.log( `Attempting locale fallback ${language}`);
      this.actuallyLoadMomentLocale( language ).catch( (error) => {
        console.warn(`Failure to load locale ${language}`);
      } )
    } )
  }
  componentDidMount() {
    this.loadMomentLocale().then( () => {
      this.setState( {
        dateFormat: 'dddd, ' + moment.localeData().longDateFormat('LL'),
        timeFormat: moment.localeData().longDateFormat('LT')
      } );

      this.initStateFromUrl();
    } );
  }
  componentDidUpdate() {
    if ( this.state.date > 0 ) {
      try {
        atcb_init();
      } catch ( e ) {
        console.log( e );
        console.log( this.state.atcbConfig );
      }
    }
  }
  initStateFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const datestamp = parseInt( window.location.pathname.substr(1), 10 );
    const endDatestamp = params.has('enddate') ? parseInt( params.get('enddate'), 10 ) : datestamp + 3600;

    const atcbConfig = {
      name: params.get('name') || 'Calendar event',
      description: params.get('description') || null,
      startDate: moment.unix(datestamp).utc().format('YYYY-MM-DD'),
      endDate: moment.unix(endDatestamp).utc().format('YYYY-MM-DD'),
      startTime: moment.unix(datestamp).utc().format('HH:mm'),
      endTime: moment.unix(endDatestamp).utc().format('HH:mm'),
      timeZone: 'GMT',
      location: params.get('location') || null,
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

    this.setState({
      date: datestamp,
      enddate: endDatestamp,
      atcbConfig: atcbConfig
    });
  }
  changeFormat = () => {
    if (this.state.timeFormat === 'h:mm a' || this.state.timeFormat === 'h:mm A') {
      this.setState({ timeFormat: 'HH:mm' });
    } else {
      this.setState({ timeFormat: 'h:mm a' });
    }
  }
  render() {

    return (
      <App
        main={
          <Fragment>
            <p className="subhead">That's...</p>
            <div className="time-hour">
              <Moment tz={this.state.zoneName} format={this.state.timeFormat} unix>
                {this.state.date}
              </Moment>
            </div>
            <button
              className="change-format"
              value={this.state.timeFormat}
              onClick={this.changeFormat}>24h / 12h
            </button>
            <div className="time-day">
              <Moment tz={this.state.zoneName} format={this.state.dateFormat} unix>
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
            <div className="atcb" >
              {this.state.date && JSON.stringify(this.state.atcbConfig, null, 4)}
            </div>
          </Fragment>
        }
      />
    );
  }
}

export default StampDisplay;
