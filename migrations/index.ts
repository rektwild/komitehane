import * as migration_20260824_134330_initial_news_schema from './20260824_134330_initial_news_schema';
import * as migration_20260826_112500_author_role_ownership_model from './20260826_112500_author_role_ownership_model';
import * as migration_20260826_145000_single_founder_role from './20260826_145000_single_founder_role';
import * as migration_20260830_100915_r2_media_prefix from './20260830_100915_r2_media_prefix';
import * as migration_20260830_112053_normalize_user_roles from './20260830_112053_normalize_user_roles';
import * as migration_20260831_170545_add_blog_ingestion_and_tags from './20260831_170545_add_blog_ingestion_and_tags';

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
  {
    up: migration_20260830_100915_r2_media_prefix.up,
    down: migration_20260830_100915_r2_media_prefix.down,
    name: '20260830_100915_r2_media_prefix',
  },
  {
    up: migration_20260830_112053_normalize_user_roles.up,
    down: migration_20260830_112053_normalize_user_roles.down,
    name: '20260830_112053_normalize_user_roles',
  },
  {
    up: migration_20260831_170545_add_blog_ingestion_and_tags.up,
    down: migration_20260831_170545_add_blog_ingestion_and_tags.down,
    name: '20260831_170545_add_blog_ingestion_and_tags'
  },
];
