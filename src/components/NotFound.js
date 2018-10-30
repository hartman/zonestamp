import React, { Component, Fragment } from 'react';
import App from './App';

class NotFound extends Component {
  render() {
    return (
      <App
        main={
          <Fragment>
            <h2>Oops!</h2>
            <p>
              Looks like that page doesn't exist. Maybe you were trying to
              create a zoneStamp?
            </p>
          </Fragment>
        }
      />
    );
  }
}

export default NotFound;
