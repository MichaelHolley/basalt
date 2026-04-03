import fs from "fs";
import path from "path";
import { eq, asc, sql } from "drizzle-orm";
import { db } from "$lib/server/db";
import { spaces } from "$lib/server/db/schema";
import { slugify, renameSpace as renameSpaceInDb } from "$lib/server/db/utils";

export function getAllSpaces() {
  return db.select().from(spaces).orderBy(asc(spaces.id)).all();
}

export function getSpace(id: string) {
  return db.select().from(spaces).where(eq(spaces.id, id)).get() ?? null;
}

export function createSpace(name: string, parentId: string | undefined, vaultPath: string): string {
  const slug = slugify(name);
  const id = parentId ? `${parentId}/${slug}` : slug;

  const existing = db.select().from(spaces).where(eq(spaces.id, id)).get();
  if (existing) throw new Error(`A space named "${name}" already exists here`);

  const folderPath = path.join(vaultPath, ...id.split("/"));
  fs.mkdirSync(folderPath, { recursive: true });

  db.insert(spaces)
    .values({ id, parentId: parentId ?? null, name, createdAt: new Date() })
    .run();

  return id;
}

export function renameSpace(id: string, name: string, vaultPath: string): void {
  const existing = getSpace(id);
  if (!existing) throw new Error("Space not found");
  renameSpaceInDb(db, id, name, vaultPath);
}

export function deleteSpace(id: string, vaultPath: string): void {
  const folderPath = path.join(vaultPath, ...id.split("/"));
  if (fs.existsSync(folderPath)) {
    fs.rmSync(folderPath, { recursive: true, force: true });
  }

  db.run(sql`
    DELETE FROM notes_fts WHERE note_id IN (
      SELECT id FROM notes WHERE space_id = ${id} OR space_id LIKE ${id + "/%"}
    )
  `);
  db.delete(spaces).where(eq(spaces.id, id)).run();
}
