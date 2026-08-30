import * as migration_20260824_134330_initial_news_schema from './20260824_134330_initial_news_schema';
import * as migration_20260826_112500_author_role_ownership_model from './20260826_112500_author_role_ownership_model';
import * as migration_20260826_145000_single_founder_role from './20260826_145000_single_founder_role';

export const migrations = [
  {
    up: migration_20260824_134330_initial_news_schema.up,
    down: migration_20260824_134330_initial_news_schema.down,
    name: '20260824_134330_initial_news_schema',
  },
  {
    up: migration_20260826_112500_author_role_ownership_model.up,
    down: migration_20260826_112500_author_role_ownership_model.down,
    name: '20260826_112500_author_role_ownership_model',
  },
  {
    up: migration_20260826_145000_single_founder_role.up,
    down: migration_20260826_145000_single_founder_role.down,
    name: '20260826_145000_single_founder_role',
  },
];
