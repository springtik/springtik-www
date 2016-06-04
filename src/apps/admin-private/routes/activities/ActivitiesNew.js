import React, {PropTypes} from 'react';
import api from '~/apps/admin-private/api';
import compose from 'recompose/compose';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import provide from '~/modules/observo/provide';
import connect from '~/modules/observo/connect';
import subscribe from '~/modules/observo/subscribeDeprecated';
import {Subject} from 'rxjs/Subject';
import {share} from 'rxjs/operator/share';
import {filter} from 'rxjs/operator/filter';
import {watchTask} from '~/modules/observables/operator/watchTask';
import Banner from '~/modules/components/Banner';
import ActivitiesForm from './ActivitiesForm';
import styles from './activities.scss';

export const ActivitiesNew = ({
  onSubmit,
  onDelete,
  onActivityChange,
  result = {},
  activity,
}) => (
  <div className={styles.section}>
    <Banner
      show={result.error}
      uiStyle="danger"
    >
      Une erreur est survenue, veuillez réessayer.
    </Banner>
    <ActivitiesForm
      {...{
        onSubmit,
        onDelete,
        onActivityChange,
        result,
        activity,
      }}
    />
  </div>
);

ActivitiesNew.propTypes = {
  result: PropTypes.shape({
    error: PropTypes.bool,
  }),
  onSubmit: PropTypes.func.isRequired,
  onDelete: PropTypes.func,
  onActivityChange: PropTypes.func.isRequired,
  activity: PropTypes.object,
};

export const provideObservables = () => {
  const submit$ = new Subject();
  const activity$ = new Subject();

  const result$ = submit$
    ::watchTask(model => api.activities.create(model))
    ::share();

  return {
    submit$,
    activity$,
    result$,
  };
};


export default compose(
  provide(provideObservables),
  connect(({
    submit$,
    result$,
    activity$,
  }) => ({
    onSubmit: submit$,
    result: result$,
    activity: activity$,
    onActivityChange: activity$,
  })),
  subscribe({
    observo: PropTypes.shape({
      observables: PropTypes.shape({
        result$: PropTypes.object.isRequired,
      }).isRequired,
    }).isRequired,
    router: PropTypes.shape({
      push: PropTypes.func.isRequired,
    }).isRequired,
  }, ({
    observo,
    router,
  }) => observo.observables.result$
    ::filter(({success}) => success)
    .subscribe(({
      output: {
        id,
      },
    }) => {
      router.push(`/activities/edit/${id}`);
    })
  ),
  withStyles(styles)
)(ActivitiesNew);
