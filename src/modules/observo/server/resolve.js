import {combineLatestStatic} from 'rxjs/operator/combineLatest';
import {map} from 'rxjs/operator/map';
import {from} from 'rxjs/observable/from';
import joinRoutesPath from '../utils/joinRoutesPath';

export default (props, callback) => {
  const {routes} = props;
  const props$ = from([props]);
  const initialStates = routes.reduce(
    (
      initialStates,
      {
        component: {
          getObservables,
          resolveOnServer,
        },
      },
      index
    ) => {
      if (!resolveOnServer)
        return initialStates;

      const path = joinRoutesPath(routes.slice(0, index + 1));
      const observables = getObservables({props$});
      const serverObservables = resolveOnServer
        .map(name =>
          observables[name]
            ::map(data => ({[name]: data}))
        );

      const initialState$ = combineLatestStatic(serverObservables, (...chunks) =>
        chunks.reduce((data, chunk) => ({...data, ...chunk}), {})
      );

      initialStates.push(initialState$::map(res => ({[path]: res})));
      return initialStates;
    }
    , []
  );

  let lastValue;

  combineLatestStatic(initialStates, (...chunks) =>
    chunks.reduce((data, chunk) => ({...data, ...chunk}), {})
  ).subscribe({
    next(value) {
      lastValue = value;
    },
    error(error) {
      callback(error);
    },
    complete() {
      callback(null, lastValue || {});
    },
  });
};
