import * as migration_20260325_080247 from './20260325_080247';

export const migrations = [
  {
    up: migration_20260325_080247.up,
    down: migration_20260325_080247.down,
    name: '20260325_080247'
  },
];
