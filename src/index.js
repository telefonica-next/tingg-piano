import React from 'react';
import { Provider } from "react-redux";
import ReactDOM from 'react-dom';
import Router from './routes';
import store from './store';
import './index.scss';

ReactDOM.render(
  <Provider store={store}>
    <Router />
  </Provider>,
  document.getElementById('root')
);
