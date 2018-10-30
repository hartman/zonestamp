import React, { Component } from 'react';
import github from '../images/github.svg';

class Footer extends Component {
  state = {};
  render() {
    return (
      <footer>
        <div className="cta">
          <div className="attribution">
            Made by <a href="https://raquelmsmith.com">Raquel M Smith</a>{' '}
            <a className="github" href="https://github.com/raquelmsmith">
              <img alt="github logo" src={github} />
            </a>
          </div>
          <a href="/">Make your own zoneStamp!</a>
        </div>
      </footer>
    );
  }
}

export default Footer;
