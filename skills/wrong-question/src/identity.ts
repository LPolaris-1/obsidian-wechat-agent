import { createHash } from "node:crypto";
import type { Subject } from "./types.js";

export function normalizeQuestionForIdentity(question: string): string {
  return question.replace(/\r\n/g, "\n").trim().replace(/\s+/g, " ");
}

export function buildWrongQuestionId(subject: Subject, chapterId: string, question: string): string {
  const code = subject === "高数" ? "HM" : "LA";
  const chapterNumber = Number(chapterId.match(/-(\d+)$/)?.[1]);
  if (!Number.isInteger(chapterNumber) || chapterNumber < 1 || chapterNumber > 99) throw new Error("无效 chapterId");
  const canonical = `${subject}\n${chapterId}\n${normalizeQuestionForIdentity(question)}`;
  const digest = createHash("sha256").update(canonical, "utf8").digest("hex").slice(0, 12).toUpperCase();
  return `WQ-${code}${String(chapterNumber).padStart(2, "0")}-${digest}`;
}
