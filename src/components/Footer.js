import React, { Component } from 'react';
import { Link } from 'react-router-dom'
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
          <Link to="/?utm_source=zonestamp&utm_medium=footer&utm_campaign=create_link">Make your own zoneStamp!</Link>
        </div>
      </footer>
    );
  }
}

export default Footer;
