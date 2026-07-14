import * as migration_20260325_080247 from './20260325_080247';
import * as migration_20260714_170125_media_access_level from './20260714_170125_media_access_level';

export const migrations = [
  {
    up: migration_20260325_080247.up,
    down: migration_20260325_080247.down,
    name: '20260325_080247',
  },
  {
    up: migration_20260714_170125_media_access_level.up,
    down: migration_20260714_170125_media_access_level.down,
    name: '20260714_170125_media_access_level'
  },
];
