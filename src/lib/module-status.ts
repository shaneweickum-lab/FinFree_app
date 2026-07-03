import { MODULES, getLessonsByModule } from "./content";
import type { Lesson, UserProgress } from "./types";

export type ModuleStatus = "locked" | "in-progress" | "complete";
export type LessonStatus = "locked" | "available" | "complete";

/** Lessons within a module unlock sequentially, mirroring the adaptive-remediation flow. */
export function getLessonStatus(lesson: Lesson, progress: UserProgress): LessonStatus {
  if (progress.completedLessonIds.includes(lesson.id)) return "complete";

  const siblings = getLessonsByModule(lesson.moduleId);
  const index = siblings.findIndex((l) => l.id === lesson.id);
  if (index <= 0) return "available";

  const previous = siblings[index - 1];
  return progress.completedLessonIds.includes(previous.id) ? "available" : "locked";
}

/** Modules unlock sequentially — module N requires module N-1 to be complete. */
export function getModuleStatus(moduleId: string, progress: UserProgress): ModuleStatus {
  const mod = MODULES.find((m) => m.id === moduleId);
  if (!mod) return "locked";

  if (progress.completedModuleIds.includes(moduleId)) return "complete";

  const previousModule = MODULES.find((m) => m.number === mod.number - 1);
  if (previousModule && !progress.completedModuleIds.includes(previousModule.id)) {
    return "locked";
  }
  return "in-progress";
}

export function getModuleProgressFraction(moduleId: string, progress: UserProgress): number {
  const lessons = getLessonsByModule(moduleId);
  if (lessons.length === 0) return 0;
  const done = lessons.filter((l) => progress.completedLessonIds.includes(l.id)).length;
  return done / lessons.length;
}

export function getOverallCourseProgressFraction(progress: UserProgress): number {
  return progress.completedModuleIds.length / MODULES.length;
}
