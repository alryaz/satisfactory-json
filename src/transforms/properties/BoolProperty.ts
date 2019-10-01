import { Builder } from '../../engine/Builder';

export function transformBoolProperty(builder: Builder): void {
  builder
    .byte('value', false) // Tag.BoolVal
    .assertNullByte(false); // Tag.HasPropertyGuid
}
