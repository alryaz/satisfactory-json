import { Builder } from '../../engine/Builder';

export function transformPlayerState(builder: Builder) {
  builder
    .obj('extra')
    .hexRemaining('unknown', '_entityLength')
    .endObj()
}