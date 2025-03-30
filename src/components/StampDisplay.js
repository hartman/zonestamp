import React, { Component, Fragment } from 'react';
import App from './App';
import TimezoneSelect from 'react-timezone-select';
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
    date: null, // Will hold the formatted start date string
  };

  actuallyLoadMomentLocale(language) {
    console.log("Loading moment locale:", language);
    if (language === 'en') return Promise.resolve();
    return import(
      /* webpackInclude: /\.js$/ */
      /* webpackChunkName: "moment" */
      `moment/locale/${language}`
    )
      .then((loadedModule) => {
        origMoment.locale(language);
        console.log(`Loaded locale: ${language}`);
        return loadedModule;
      })
      .catch((error) => {
        console.warn(`Failed to load locale: ${language}`, error);
        throw error;
      });
  }

  loadMomentLocale() {
    let language = window.navigator.language.toLowerCase();
    console.log("Browser language detected:", language);
    if (!/^[a-z]{1,3}(?:-[a-z]{0,5})?$/.test(language)) {
      return Promise.resolve();
    }
    return this.actuallyLoadMomentLocale(language)
      .catch((error) => {
        language = language.slice(0, language.indexOf('-'));
        console.log("Attempting locale fallback:", language);
        return this.actuallyLoadMomentLocale(language);
      })
      .catch((error) => {
        console.warn("Locale fallback failed:", language);
      });
  }

  componentDidMount() {
    console.log("Component mounted");
    this.loadMomentLocale().then(() => {
      this.setState({
        dateFormat: 'dddd, ' + moment.localeData().longDateFormat('LL'),
        timeFormat: moment.localeData().longDateFormat('LT'),
      }, () => {
        console.log("Locale loaded, state updated:", this.state);
      });
      this.initStateFromUrl();
    });
  }

  componentDidUpdate() {
    console.log("Component updated, state:", this.state);
    if (this.state.date) {
      try {
        atcb_init();
        console.log("atcb_init called");
      } catch (e) {
        console.error("atcb_init error:", e);
        console.log("atcbConfig:", this.state.atcbConfig);
      }
    }
  }

  initStateFromUrl() {
    // Expecting URL in the format: "/UTC=YYYYMMDDHHmmss&timezone=+xxxx"
    const path = window.location.pathname;
    console.log("URL path detected:", path);
    // Regex captures exactly 14 digits for the UTC string and a 4-digit timezone offset.
    const matches = path.match(/UTC=([\d]{14})&timezone=([+-]\d{4})/);
    if (!matches) {
      console.warn("Invalid URL format for timestamp");
      return;
    }
    const utcString = decodeURIComponent(matches[1]); // e.g., "20250403020800"
    const timezone = matches[2] || "+0000";             // e.g., "+0530" or default to "+0000"
    console.log("Parsed UTC string and timezone:", utcString, timezone);

    // Parse the UTC string as UTC and then adjust to the provided timezone.
    let m = moment.tz(utcString, "YYYYMMDDHHmmss", timezone);

    console.log("Moment instance after parsing:", m.format());

    // Format the start date in a human-readable form (using local formatting based on the chosen zone)
    const formattedStartDate = m.format("YYYY-MM-DD HH:mm:ss");
    // No extra duration is added; we use the same time for the end date.
    const formattedEndDate = formattedStartDate;
    console.log("Formatted dates:", formattedStartDate, formattedEndDate);

    const atcbConfig = {
      name: new URLSearchParams(window.location.search).get("name") || "Calendar event",
      description: new URLSearchParams(window.location.search).get("description") || null,
      startDate: formattedStartDate.split(" ")[0],
      endDate: formattedEndDate.split(" ")[0],
      startTime: formattedStartDate.split(" ")[1],
      endTime: formattedEndDate.split(" ")[1],
      timeZone: timezone,
      location: new URLSearchParams(window.location.search).get("location") || null,
      options: ["iCal", "Google", "Apple", "MicrosoftTeams", "Outlook.com"],
      hideCheckmark: true,
      buttonStyle: "round",
    };

    this.setState({
      date: formattedStartDate,
      enddate: formattedEndDate,
      atcbConfig: atcbConfig
    }, () => console.log("State updated from URL:", this.state));
  }

  changeFormat = () => {
    console.log("Changing time format, current format:", this.state.timeFormat);
    this.setState({
      timeFormat: this.state.timeFormat === 'h:mm a' ? 'HH:mm' : 'h:mm a'
    }, () => console.log("Time format changed to:", this.state.timeFormat));
  };

  render() {
    console.log("Rendering component with state:", this.state);
    return (
      <App
        main={
          <Fragment>
            <p className="subhead">That's...</p>
            <div className="time-hour">
              <Moment tz={this.state.zoneName} format={this.state.timeFormat}>
                {this.state.date}
              </Moment>
            </div>
            <button
              className="change-format"
              onClick={this.changeFormat}
            >
              24h / 12h
            </button>
            <div className="time-day">
              <Moment tz={this.state.zoneName} format={this.state.dateFormat}>
                {this.state.date}
              </Moment>
            </div>
            <div className="arrow-up display" />
            <TimezoneSelect
              className="timezone-picker"
              classNamePrefix="timezone-picker-select"
              value={this.state.zone}
              onChange={timezone => {
                console.log("Timezone changed:", timezone);
                this.setState({ zone: timezone, zoneName: timezone.value });
              }}
            />
            <div className="time-utc">
              <p>or</p>
              <Moment tz="UTC" format="YYYY-MM-DD HH:mm z">
                {this.state.date}
              </Moment>
            </div>
            <div className="atcb">
              {this.state.date && JSON.stringify(this.state.atcbConfig, null, 4)}
            </div>
          </Fragment>
        }
      />
    );
  }
}

export default StampDisplay;
