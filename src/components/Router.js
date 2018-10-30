import React from 'react';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import CreateStamp from './CreateStamp';
import StampDisplay from './StampDisplay';
import NotFound from './NotFound';

const Router = () => (
  <BrowserRouter>
    <Switch>
      <Route exact path="/" component={CreateStamp} />
      <Route path="/(\d{10})" component={StampDisplay} />
      <Route component={NotFound} />
    </Switch>
  </BrowserRouter>
);

export default Router;
