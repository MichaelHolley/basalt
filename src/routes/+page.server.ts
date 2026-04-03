import { getRecentNotes } from "$lib/server/service/note.service";
import { getOpenTodos } from "$lib/server/service/todo.service";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = () => {
  return {
    recentNotes: getRecentNotes(8),
    openTodos: getOpenTodos(10),
  };
};
