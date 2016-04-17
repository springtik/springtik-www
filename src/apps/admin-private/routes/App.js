import React, {PropTypes} from 'react';
import compose from 'recompose/compose';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import api from '~/apps/admin-private/api';
import provide from '~/modules/observo/provide';
import styles from './app.scss';
import Header from '../header/Header';
import Menu from '../menu/Menu';

export const App = ({
  children,
  location
}) => (
  <div>
    <Header />
    <div id="container">
      <Menu {...{location}} />
      {children}
    </div>
  </div>
);

App.propTypes = {
  children: PropTypes.node,
  location: PropTypes.object
};

export const getObservables = ({props$}) => ({
  me$: props$
    .take(1)
    .switchMap(() => api.me())
    .publishReplay(1)
    .refCount()
});

export default compose(
  provide(getObservables, {resolveOnServer: ['me$']}),
  withStyles(styles)
)(App);
