import { SaveGame, Actor, Entity, Component, Property } from './types';
import { Archive, LoadingArchive, SavingArchive } from './Archive';
import transformActor from './transforms/Actor';
import transformEntity from './transforms/Entity';
import transformComponent from './transforms/Component';
import { ReadStream } from 'fs';

export async function sav2json(stream: ReadStream): Promise<SaveGame> {
  const saveGame: SaveGame = {
    saveHeaderType: 0,
    saveVersion: 0,
    buildVersion: 0,
    mapName: '',
    mapOptions: '',
    sessionName: '',
    playDurationSeconds: 0,
    saveDateTime: '',
    sessionVisibility: 0,
    actors: [],
    components: [],
    collected: [],
    missing: ''
  };
  await transform(new LoadingArchive(stream), saveGame);
  return saveGame;
}

export async function json2sav(saveGame: SaveGame): Promise<string> {
  const buffer = new SavingArchive(Buffer.from([]));
  await transform(buffer, saveGame);
  return buffer.getOutput();
}

async function transform(
  ar: Archive,
  saveGame: SaveGame
) {
  await transformHeader(ar, saveGame);

  const entryCount = {
    entryCount: saveGame.actors.length + saveGame.components.length
  };
  await ar.transformInt(entryCount.entryCount);

  for (let i = 0; i < entryCount.entryCount; i++) {
    await transformActorOrComponent(ar, saveGame, i);
  }

  await ar.transformInt(entryCount.entryCount);
  for (let i = 0; i < entryCount.entryCount; i++) {
    if (i < saveGame.actors.length) {
      const actor = saveGame.actors[i];
      await transformEntity(ar, actor.entity, true, actor.className);
    } else {
      const component = saveGame.components[i - saveGame.actors.length];
      await transformEntity(
        ar,
        component.entity,
        false,
        component.className
      );
    }
  }

  const collectedCount = {
    count: saveGame.collected.length
  };
  await ar.transformInt(collectedCount.count);
  for (let i = 0; i < collectedCount.count; i++) {
    if (ar.isLoading()) {
      saveGame.collected.push({ levelName: '', pathName: '' });
    }
    await ar.transformString(saveGame.collected[i].levelName);
    await ar.transformString(saveGame.collected[i].pathName);
  }

  // TODO missing
}

async function transformHeader(
  ar: Archive,
  saveGame: SaveGame
) {

  console.log('header');
  await ar.transformInt(saveGame.saveHeaderType);
  console.log('header2');
  await ar.transformInt(saveGame.saveVersion);
  await ar.transformInt(saveGame.buildVersion);
  await ar.transformString(saveGame.mapName);
  await ar.transformString(saveGame.mapOptions);
  await ar.transformString(saveGame.sessionName);
  await ar.transformInt(saveGame.playDurationSeconds);
  await ar.transformLong(saveGame.saveDateTime);
  if (saveGame.saveHeaderType > 4) {
    await ar.transformByte(saveGame.sessionVisibility);
  }
}

function transformActorOrComponent(
  ar: Archive,
  saveGame: SaveGame,
  id: number
) {
  const type = { type: id < saveGame.actors.length ? 1 : 0 };
  ar.transformInt(type.type);
  if (ar.isLoading()) {
    if (type.type === 1) {
      const actor = {
        type: 1,
        className: '',
        levelName: '',
        pathName: '',
        needTransform: 0,
        transform: {
          rotation: [],
          translation: [],
          scale3d: []
        },
        wasPlacedInLevel: 0,
        entity: {
          children: [],
          properties: []
        }
      };
      transformActor(ar, actor);
      saveGame.actors.push(actor);
    } else if (type.type === 0) {
      const component = {
        type: 0,
        className: '',
        levelName: '',
        pathName: '',
        outerPathName: '',
        entity: {
          properties: []
        }
      };
      transformComponent(ar, component);
      saveGame.components.push(component);
    } else {
      throw new Error(`Unknown type ${type.type}`);
    }
  } else {
    if (id < saveGame.actors.length) {
      transformActor(ar, saveGame.actors[id]);
    } else {
      transformComponent(
        ar,
        saveGame.components[id - saveGame.actors.length]
      );
    }
  }
}
