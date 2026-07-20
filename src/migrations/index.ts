import * as migration_20260325_080247 from './20260325_080247';
import * as migration_20260714_170125_media_access_level from './20260714_170125_media_access_level';
import * as migration_20260715_042907_about_page_content from './20260715_042907_about_page_content';
import * as migration_20260718_164616_bishop_profile_fields from './20260718_164616_bishop_profile_fields';
import * as migration_20260719_051906_news_source_link from './20260719_051906_news_source_link';
import * as migration_20260719_115129_apps_collection from './20260719_115129_apps_collection';
import * as migration_20260719_125120_news_import_fields from './20260719_125120_news_import_fields';
import * as migration_20260719_145337_drop_parish_vicariate_enum from './20260719_145337_drop_parish_vicariate_enum';
import * as migration_20260719_145726_vicariates_collection from './20260719_145726_vicariates_collection';
import * as migration_20260719_152627_hero_overlay_settings from './20260719_152627_hero_overlay_settings';
import * as migration_20260719_171803_drop_legacy_status from './20260719_171803_drop_legacy_status';
import * as migration_20260719_171828_add_event_cancelled from './20260719_171828_add_event_cancelled';
import * as migration_20260720_155410_news_gallery from './20260720_155410_news_gallery';
import * as migration_20260720_163403_contact_public_qa from './20260720_163403_contact_public_qa';

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
    name: '20260719_115129_apps_collection',
  },
  {
    up: migration_20260719_125120_news_import_fields.up,
    down: migration_20260719_125120_news_import_fields.down,
    name: '20260719_125120_news_import_fields',
  },
  {
    up: migration_20260719_145337_drop_parish_vicariate_enum.up,
    down: migration_20260719_145337_drop_parish_vicariate_enum.down,
    name: '20260719_145337_drop_parish_vicariate_enum',
  },
  {
    up: migration_20260719_145726_vicariates_collection.up,
    down: migration_20260719_145726_vicariates_collection.down,
    name: '20260719_145726_vicariates_collection',
  },
  {
    up: migration_20260719_152627_hero_overlay_settings.up,
    down: migration_20260719_152627_hero_overlay_settings.down,
    name: '20260719_152627_hero_overlay_settings',
  },
  {
    up: migration_20260719_171803_drop_legacy_status.up,
    down: migration_20260719_171803_drop_legacy_status.down,
    name: '20260719_171803_drop_legacy_status',
  },
  {
    up: migration_20260719_171828_add_event_cancelled.up,
    down: migration_20260719_171828_add_event_cancelled.down,
    name: '20260719_171828_add_event_cancelled',
  },
  {
    up: migration_20260720_155410_news_gallery.up,
    down: migration_20260720_155410_news_gallery.down,
    name: '20260720_155410_news_gallery',
  },
  {
    up: migration_20260720_163403_contact_public_qa.up,
    down: migration_20260720_163403_contact_public_qa.down,
    name: '20260720_163403_contact_public_qa'
  },
];
