import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import path from 'path';

export type Memory = {
  id: string;
  image: string;
  title: string;
  description: string;
  owner: string;
  coinAddress: string;
  zoraUrl: string;
  timestamp: number;
};

type Data = { memories: Memory[] };

let db: Low<Data> | null = null;

export async function getDb() {
  if (!db) {
    db = new Low<Data>(new JSONFile<Data>(path.join(process.cwd(), 'db.json')));
    db.data = { memories: [] };
    await db.read();
    db.data ||= { memories: [] };
    await db.write();
  } else {
    await db.read();
  }
  return db;
} 