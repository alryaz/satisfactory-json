import { Builder } from '../../../engine/Builder';

export function transformRailroadTrackPosition(builder: Builder): void {
  builder
    //.obj('value')
    .str('levelName')
    .str('pathName')
    .float('offset')
    .float('forward');
  //.endObj();
}
