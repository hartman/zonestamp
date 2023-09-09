import React from 'react';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import CreateStamp from './CreateStamp';
import StampDisplay from './StampDisplay';
import NotFound from './NotFound';

const Router = () => (
  <BrowserRouter>
    <Switch>
      <Route exact path="/">
	<CreateStamp />
      </Route>
      <Route path="/(\d{10})">
	<StampDisplay />
      </Route>
      <Route>
	<NotFound />
      </Route>
    </Switch>
  </BrowserRouter>
);

export default Router;
