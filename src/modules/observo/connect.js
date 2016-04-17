import React from 'react';
import createElement from 'recompose/createElement';
import createHelper from 'recompose/createHelper';

const defaultHandleError = error => {
  setTimeout(() => {
    throw error;
  });
};

export default createHelper(
  (
    mapObservables, {
      handleError = defaultHandleError
    } = {}
  ) => Component => (
    class ObservoConnect extends React.Component {
      static contextTypes = {
        observo: React.PropTypes.object.isRequired
      };

      mounted = false;

      state = {};

      componentWillMount() {
        const {
          observo: {
            observables,
            server
          }
        } = this.context;

        const obsMap = mapObservables(observables);
        this.subscriptions = [];

        Object.keys(obsMap)
          .forEach(prop => {
            if (!obsMap[prop]) {
              throw new Error(
                `ObservoConnectError: Impossible to find obs \`${prop}\` in \`${this.constructor.displayName}\``
              );
            }

            if (prop.match(/^on[A-Z]/)) {
              this.state[prop] = obsMap[prop].next.bind(obsMap[prop]);
            } else {
              this.subscriptions.push(obsMap[prop].subscribe({
                next: value => {
                  if (this.mounted)
                    this.setState({[prop]: value});
                  else
                    this.state[prop] = value;
                },
                error: handleError
              }));
            }
          });

        if (server)
          this.unsubscribe();
      }

      componentDidMount() {
        this.mounted = true;
      }

      componentWillUnmount() {
        this.unsubscribe();
      }

      unsubscribe() {
        this.subscriptions.forEach(subscription => {
          subscription.unsubscribe();
        });
      }

      render() {
        return createElement(Component, {
          ...this.props,
          ...this.state
        });
      }
    }
  )
, 'observoConnect');
