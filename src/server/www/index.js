import React from 'react';
import ReactDOM from 'react-dom/server';
import express from 'express';
import {match, RouterContext} from 'react-router';
import config from '../../config';
import path from 'path';

const router = express.Router();
const publicPath = path.join(__dirname, '../../../public');
const serverPath = path.join(publicPath, 'www/dist/bundle.server.js');

router.use(express.static(path.join(publicPath, 'www')));

if (config.get('env') === 'development') {
  const createWpdm = require('webpack-dev-middleware');
  const createWphm = require('webpack-hot-middleware');
  const webpack = require('webpack');
  const config = require('../../../config/webpack/www.development.babel').default;
  const clientCompiler = webpack(config[0]);
  const serverCompiler = webpack(config[1]);

  serverCompiler.watch({}, err => {
    if (err)
      throw err;
  });

  clientCompiler.plugin('done', () => {
    delete require.cache[serverPath];
  });

  const wpdm = createWpdm(clientCompiler, {
    noInfo: true,
    publicPath: config[0].output.publicPath,
    stats: {colors: true}
  });

  router.use(wpdm);
  router.use(createWphm(clientCompiler));
}

router.use((req, res, next) => {
  const css = [];

  class ContextInjector extends React.Component {
    static childContextTypes = {
      insertCss: React.PropTypes.func.isRequired
    };

    getChildContext() {
      return {
        insertCss: styles =>
          css.push(styles._getCss())
      };
    }

    render() {
      return React.createElement(RouterContext, this.props);
    }
  }

  const routes = require(serverPath).default;

  match({routes, location: req.url}, (error, redirectLocation, props) => {
    if (error) {
      next(error);
      return;
    }

    if (redirectLocation) {
      res.redirect(302, redirectLocation.pathname + redirectLocation.search);
      return;
    }

    if (!props) {
      res.status(404).send('Not found');
      return;
    }

    const react = ReactDOM.renderToString(
      React.createElement(ContextInjector, props)
    );
    res.send(`<!DOCTYPE html>${react.replace('// %CSS%', css.join(''))}`);
  });
});

export default router;
