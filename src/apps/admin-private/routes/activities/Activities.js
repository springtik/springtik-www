import React, {PropTypes} from 'react';
import Link from 'react-router/lib/Link';
import classNames from 'classnames';
import Rx from 'rxjs/Rx';
import compose from 'recompose/compose';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import provide from '~/modules/observo/provide';
import connect from '~/modules/observo/connect';
import api from '~/apps/admin-private/api';
import Toolbar from '~/modules/components/Toolbar';
import List from '~/modules/components/List';
import Select from '~/modules/components/Select';
import ListItem from '~/modules/components/ListItem';
import styles from './activities.scss';

const statusOptions = [
  {value: 'review', label: 'À relire'},
  {value: 'published', label: 'Publiée'},
];

export class Activities extends React.Component {
  static propTypes = {
    location: PropTypes.shape({
      query: PropTypes.object.isRequired,
      pathname: PropTypes.string.isRequired,
    }).isRequired,
    activities: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
      })
    ),
    children: PropTypes.node,
  };

  static contextTypes = {
    router: React.PropTypes.object,
  };

  handleStatusChange = status => {
    this.context.router.push({
      pathname: this.props.location.pathname,
      query: {status},
    });
  };

  render() {
    const {
      activities,
      children,
    } = this.props;

    return (
      <main>
        <Toolbar>
          <Link
            to={{
              pathname: '/activities/new',
              query: this.props.location.query,
            }}
          >
            <i className="fa fa-plus-circle" />Créer une activité
          </Link>
        </Toolbar>
        <div className={styles.workspace}>
          <div className={classNames(styles.section, styles['list-section'])}>
            <div>
              <Select
                className={styles.statusSelect}
                placeholder="Filtrer.."
                searchable={false}
                value={this.props.location.query.status || ''}
                options={statusOptions}
                onChange={this.handleStatusChange}
              />
            </div>
            <List className={styles.list}>
              {activities
                .map(({id, name}, index) =>
                  <ListItem key={index}>
                    <Link
                      activeClassName="active"
                      to={{
                        pathname: `/activities/edit/${id}`,
                        query: this.props.location.query,
                      }}
                    >
                      {`#${id} - ${name}`}
                    </Link>
                  </ListItem>
              )}
            </List>
          </div>
          {children}
        </div>
      </main>
    );
  }
}

export const provideObservables = ({props$}) => {
  const activities$ = Rx.Observable.merge(
      props$,
      Rx.Observable.merge(
        api.activities.created$,
        api.activities.updated$,
        api.activities.deleted$
      )
      .takeUntil(props$.last())
    )
    .withLatestFrom(props$, (_, {
      location: {
        query: {
          status,
        },
      },
    }) => {
      if (status)
        return {status};

      return undefined;
    })
    .switchMap(query =>
      api.activities.$fetchAll(query)
    )
    .filter(({success}) => success)
    .map(({output}) => output)
    .startWith([])
    .publishReplay(1)
    .refCount();

  const categories$ = props$
    .take(1)
    .switchMap(() => api.categories.$fetchAll({level: 2}))
    .filter(({success}) => success)
    .map(({output}) => output)
    .startWith([])
    .publishReplay(1)
    .refCount();

  return {activities$, categories$};
};

export default compose(
  provide(provideObservables, {
    resolveOnServer: [
      'activities$',
    ],
  }),
  connect(({
    activities$,
  }) => ({
    activities: activities$,
  })),
  withStyles(styles)
)(Activities);
