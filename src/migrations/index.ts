import * as migration_20260325_080247 from './20260325_080247';
import * as migration_20260714_170125_media_access_level from './20260714_170125_media_access_level';
import * as migration_20260715_042907_about_page_content from './20260715_042907_about_page_content';
import * as migration_20260718_164616_bishop_profile_fields from './20260718_164616_bishop_profile_fields';
import * as migration_20260719_051906_news_source_link from './20260719_051906_news_source_link';
import * as migration_20260719_115129_apps_collection from './20260719_115129_apps_collection';

export const migrations = [
  {
    up: migration_20260325_080247.up,
    down: migration_20260325_080247.down,
    name: '20260325_080247',
  },
  {
    up: migration_20260714_170125_media_access_level.up,
    down: migration_20260714_170125_media_access_level.down,
    name: '20260714_170125_media_access_level',
  },
  {
    up: migration_20260715_042907_about_page_content.up,
    down: migration_20260715_042907_about_page_content.down,
    name: '20260715_042907_about_page_content',
  },
  {
    up: migration_20260718_164616_bishop_profile_fields.up,
    down: migration_20260718_164616_bishop_profile_fields.down,
    name: '20260718_164616_bishop_profile_fields',
  },
  {
    up: migration_20260719_051906_news_source_link.up,
    down: migration_20260719_051906_news_source_link.down,
    name: '20260719_051906_news_source_link',
  },
  {
    up: migration_20260719_115129_apps_collection.up,
    down: migration_20260719_115129_apps_collection.down,
    name: '20260719_115129_apps_collection'
  },
];
