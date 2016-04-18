import React, {PropTypes} from 'react';
import Rx from 'rxjs/Rx';
import '~/modules/rx-extended/watchTask';
import compose from 'recompose/compose';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import provide from '~/modules/observo/provide';
import connect from '~/modules/observo/connect';
import subscribe from '~/modules/observo/subscribe';
import Banner from '~/modules/components/Banner';
import api from '~/apps/admin-private/api';
import CategoriesForm from './CategoriesForm';
import styles from './categories.scss';

export const CategoriesEdit = ({
  category,
  onCategoryChange,
  onSubmit,
  onDelete,
  result,
  deleteResult,
}) => (
  <div className={styles.section}>
    <Banner
      show={Boolean(result.success)}
      uiStyle="success"
    >
      La catégorie a bien été modifiée.
    </Banner>
    <Banner
      show={Boolean(result.error || deleteResult.error)}
      uiStyle="danger"
    >
      Une erreur est survenue, veuillez réessayer.
    </Banner>
    <CategoriesForm
      {...{
        result,
        deleteResult,
        category,
        onCategoryChange,
        onSubmit,
        onDelete,
        disabled: !category,
      }}
    />
  </div>
);

CategoriesEdit.propTypes = {
  deleteResult: PropTypes.object,
  result: PropTypes.object,
  category: PropTypes.object,
  onCategoryChange: PropTypes.func,
  onSubmit: PropTypes.func,
  onDelete: PropTypes.func,
};

export const provideObservables = ({
  category$,
  props$,
}) => {
  const submit$ = new Rx.Subject();
  const delete$ = new Rx.Subject();
  const categoryChange$ = new Rx.Subject();

  const deleteResult$ = delete$
    .filter(() =>
      window.confirm('Êtes vous sûr de vouloir supprimer la catégorie ?')
    )
    .withLatestFrom(props$)
    .map(([, {params: {categoryId}}]) => categoryId)
    .watchTask(id => api.categories.delete(id))
    .merge(
      props$
        .map(({params: {id}}) => id)
        .distinctUntilChanged()
        .mapTo({idle: true})
    )
    .publishReplay(1)
    .refCount();

  category$ = category$.merge(categoryChange$);

  const result$ = submit$
    .withLatestFrom(category$, (model, {id}) => ({
      ...model,
      id,
      keywords: model.keywords || [],
    }))
    .watchTask(model => api.categories.update(model))
    .publishReplay(1)
    .refCount();

  return {
    submit$,
    categoryChange$,
    delete$,
    category$,
    result$,
    deleteResult$,
  };
};

export default compose(
  provide(provideObservables),
  subscribe({
    observo: PropTypes.shape({
      observables: PropTypes.shape({
        deleteResult$: PropTypes.object.isRequired,
      }).isRequired,
    }).isRequired,
    router: PropTypes.shape({
      push: PropTypes.func.isRequired,
    }).isRequired,
  }, ({
    observo: {
      observables: {
        deleteResult$,
      },
    },
    router,
  }) => deleteResult$
    .filter(({success}) => success)
    .subscribe(() => {
      router.push('/categories');
    })
  ),
  connect(({
    submit$,
    category$,
    categoryChange$,
    delete$,
    result$,
    deleteResult$,
  }) => ({
    onSubmit: submit$,
    category: category$,
    onCategoryChange: categoryChange$,
    onDelete: delete$,
    result: result$,
    deleteResult: deleteResult$,
  })),
  withStyles(styles)
)(CategoriesEdit);
