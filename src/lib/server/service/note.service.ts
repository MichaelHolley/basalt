import fs from "fs";
import path from "path";
import { eq, asc, desc, or, sql } from "drizzle-orm";
import { db } from "$lib/server/db";
import { notes } from "$lib/server/db/schema";
import { slugify } from "$lib/server/db/utils";

export function getAllNotes() {
  return db.select().from(notes).orderBy(asc(notes.title)).all();
}

export function getNotesBySpace(spaceId: string) {
  return db
    .select()
    .from(notes)
    .where(eq(notes.spaceId, spaceId))
    .orderBy(asc(notes.title))
    .all();
}

export function getNotesByRootSpace(rootSpace: string) {
  return db
    .select()
    .from(notes)
    .where(
      or(
        eq(notes.spaceId, rootSpace),
        sql`${notes.spaceId} LIKE ${rootSpace + "/%"}`,
      ),
    )
    .orderBy(asc(notes.title))
    .all();
}

export function getNote(id: string) {
  return db.select().from(notes).where(eq(notes.id, id)).get() ?? null;
}

export function createNote(title: string, spaceId: string, vaultPath: string): string {
  const slug = slugify(title);
  const id = `${spaceId}/${slug}.md`;

  const existing = db.select().from(notes).where(eq(notes.id, id)).get();
  if (existing) throw new Error(`A note named "${title}" already exists in this space`);

  const filePath = path.join(vaultPath, ...id.split("/"));
  fs.writeFileSync(filePath, "", "utf-8");

  const now = new Date();
  db.insert(notes).values({ id, spaceId, title, createdAt: now, updatedAt: now }).run();
  db.run(sql`INSERT INTO notes_fts(note_id, title, body) VALUES (${id}, ${title}, '')`);

  return id;
}

export function renameNote(id: string, title: string, vaultPath: string): string {
  const note = getNote(id);
  if (!note) throw new Error("Note not found");

  const slug = slugify(title);
  const parts = id.split("/");
  parts[parts.length - 1] = `${slug}.md`;
  const newId = parts.join("/");

  if (newId !== id) {
    const existing = db.select().from(notes).where(eq(notes.id, newId)).get();
    if (existing) throw new Error(`A note named "${title}" already exists in this space`);

    const oldPath = path.join(vaultPath, ...id.split("/"));
    const newPath = path.join(vaultPath, ...newId.split("/"));
    if (fs.existsSync(oldPath)) fs.renameSync(oldPath, newPath);

    db.run(sql`PRAGMA foreign_keys = OFF`);
    try {
      db.transaction((tx) => {
        tx.run(
          sql`UPDATE notes SET id = ${newId}, title = ${title}, updated_at = ${Date.now()} WHERE id = ${id}`,
        );
      });
    } finally {
      db.run(sql`PRAGMA foreign_keys = ON`);
    }
    db.run(
      sql`UPDATE notes_fts SET note_id = ${newId}, title = ${title} WHERE note_id = ${id}`,
    );
  } else {
    db.update(notes).set({ title, updatedAt: new Date() }).where(eq(notes.id, id)).run();
    db.run(sql`UPDATE notes_fts SET title = ${title} WHERE note_id = ${id}`);
  }

  return newId;
}

export function deleteNote(id: string, vaultPath: string): string {
  const note = getNote(id);
  if (!note) throw new Error("Note not found");

  const filePath = path.join(vaultPath, ...id.split("/"));
  if (fs.existsSync(filePath)) fs.rmSync(filePath);

  db.run(
    sql`DELETE FROM relations WHERE (source_type = 'note' AND source_id = ${id}) OR (target_type = 'note' AND target_id = ${id})`,
  );
  db.delete(notes).where(eq(notes.id, id)).run();
  db.run(sql`DELETE FROM notes_fts WHERE note_id = ${id}`);

  return note.spaceId;
}

export function getRecentNotes(limit: number) {
  return db.select().from(notes).orderBy(desc(notes.updatedAt)).limit(limit).all();
}

export function saveNoteContent(id: string, content: string, vaultPath: string): void {
  const note = getNote(id);
  if (!note) throw new Error("Note not found");

  const filePath = path.join(vaultPath, ...note.id.split("/"));
  fs.writeFileSync(filePath, content, "utf-8");

  db.update(notes).set({ updatedAt: new Date() }).where(eq(notes.id, id)).run();
  db.run(sql`DELETE FROM notes_fts WHERE note_id = ${id}`);
  db.run(
    sql`INSERT INTO notes_fts(note_id, title, body) VALUES (${id}, ${note.title}, ${content})`,
  );
}
