import { parse as parseQueryString } from 'querystring';
import React, { Component } from 'react';
import { Router, Route, Switch } from 'react-router-dom';
import { createBrowserHistory } from 'history';
import PlatformConnection from '../components/PlatformConnection';
import GamePage from './GamePage';
import StartPage from './StartPage';

const browserHistory = createBrowserHistory();

// helper to add parsed query-property to history.location
function addLocationQuery(historyObject) {
  historyObject.location = Object.assign(
    historyObject.location,
    // slice(1) removes the `?` at the beginning of `location.search`
    { query: parseQueryString(historyObject.location.search.slice(1)) },
  );
}

// parse query-parameters at first page load
addLocationQuery(browserHistory);

// add parsing for all following history-changes
browserHistory.listen(() => addLocationQuery(browserHistory));

class Routes extends Component {
  componentDidMount() {
    this.onPageChange(browserHistory.location);
    browserHistory.listen(this.onPageChange);
  }

  // eslint-disable-next-line no-unused-vars
  onPageChange = location => {
    if (window) {
      // Resetting scroll to the top
      setTimeout(() => window.scrollTo(0, 0));
    }
  };

  render() {
    const rootClasses = ['layout-wrapper'];

    return (
      <Router history={browserHistory}>
        <PlatformConnection />
        <div className={rootClasses.join(' ')}>
          <Switch>
            <Route path="/" exact component={StartPage} />
            <Route path="/π" exact component={GamePage} />
          </Switch>
        </div>
      </Router>
    );
  }
}

export default Routes;
