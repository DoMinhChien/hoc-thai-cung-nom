import { describeRepositories } from '@nom/core/testing';
import Dexie from 'dexie';
import { NomDatabase } from './db';
import { createDexieRepositories } from './dexie-repositories';

let db: NomDatabase;

describeRepositories(
  'Dexie (fake-indexeddb)',
  async () => {
    db = new NomDatabase('contract');
    return createDexieRepositories(db);
  },
  async () => {
    db.close();
    await Dexie.delete(db.name);
  },
);
