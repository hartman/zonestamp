import React, { Component } from 'react';
import Header from './Header';
import Footer from './Footer';
import '../css/App.scss';
import '../css/timezone-picker.scss';
import '../css/footer.scss';

class App extends Component {
  render() {
    return (
      <div className="App">
        <div className="inner">
          <Header />
          <main>{this.props.main}</main>
          <Footer />
        </div>
      </div>
    );
  }
}

export default App;
