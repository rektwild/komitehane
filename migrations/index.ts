import * as migration_20260824_134330_initial_news_schema from './20260824_134330_initial_news_schema';

export const migrations = [
  {
    up: migration_20260824_134330_initial_news_schema.up,
    down: migration_20260824_134330_initial_news_schema.down,
    name: '20260824_134330_initial_news_schema'
  },
];
