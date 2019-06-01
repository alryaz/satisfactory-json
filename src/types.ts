export interface SaveGame {
    saveHeaderType: number;
    saveVersion: number;
    buildVersion: number;
    mapName: string;
    mapOptions: string;
    sessionName: string;
    playDurationSeconds: number;
    saveDateTime: string;
    sessionVisibility: number;
    objects: ActorOrComponent[];
    collected: ObjectReference[];
    missing: string;
}

export interface Actor {
    type: number;
    className: string;
    levelName: string;
    pathName: string;
    needTransform: number;
    transform: {
        rotation: number[];
        translation: number[];
        scale3d: number[];
    };
    wasPlacedInLevel: number;
    entity?: Entity;
}

export interface Component {
    type: number;
    className: string;
    levelName: string;
    pathName: string;
    outerPathName: string;
    entity?: Entity;
}

export type ActorOrComponent = Actor | Component;

export interface Entity {
    levelName?: string;
    pathName?: string;
    children?: ObjectReference[];
    properties: Property[];
    missing?: string;
    extra?: any;
}

export interface ObjectReference {
    levelName: string;
    pathName: string;
}

export interface BaseProperty {
    name: string;
    type: string;
    index: number;
}

export interface IntProperty extends BaseProperty {
    value: number;
}

export interface BoolProperty extends BaseProperty {
    value: number;
}

export interface FloatProperty extends BaseProperty {
    value: number;
}

export interface StrProperty extends BaseProperty {
    value: string;
}

export interface NameProperty extends BaseProperty {
    value: string;
}

export interface TextProperty extends BaseProperty {
    unknown1: number;
    unknown2: number;
    unknown3: number;
    unknown4: string;
    value: string;
}

export interface ByteProperty extends BaseProperty {
    unk1: string;
    unk2: string;
}

export interface EnumProperty extends BaseProperty {
    enum: string;
    value: string;
}

export interface ObjectProperty extends BaseProperty {
    value: {
        levelName: string;
        pathName: string;
    };
}

export interface StructProperty extends BaseProperty {
    structUnknown: string;
    value: any; // TODO!!
}

export interface ArrayProperty extends BaseProperty {
    structName?: string;
    structType?: string;
    structInnerType?: string;
    value: any; // TODO!!
}

export interface MapProperty extends BaseProperty { }

export type Property =
    | IntProperty
    | BoolProperty
    | FloatProperty
    | StrProperty
    | NameProperty
    | TextProperty
    | ByteProperty
    | EnumProperty
    | ObjectProperty
    | StructProperty
    | ArrayProperty
    | MapProperty;
