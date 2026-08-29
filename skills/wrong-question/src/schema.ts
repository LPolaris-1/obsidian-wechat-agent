import { resolveChapter } from "./chapters.js";
import { validateSourceImageReference } from "./routing.js";
import { buildWrongQuestionId } from "./identity.js";
import type { RawWrongQuestionInput, Subject, ValidatedWrongQuestion } from "./types.js";

const MAX = { question: 12000, normal: 4000, tag: 64 } as const;
const TOPIC_FALLBACK = "未分类知识点";

function text(value: unknown, field: string, max: number): string {
  if (typeof value !== "string") throw new Error(`${field} 必须是字符串`);
  const result = value.replace(/\r\n/g, "\n").trim();
  if (!result) throw new Error(`${field} 不能为空`);
  if (result.length > max) throw new Error(`${field} 超过长度限制`);
  return result;
}

function optionalText(value: unknown, field: string, max: number): string | undefined {
  if (value === undefined || value === null) return undefined;
  return text(value, field, max);
}

function subject(value: unknown): Subject {
  if (value !== "高数" && value !== "线代") throw new Error("subject 必须是高数或线代");
  return value;
}

function alias(input: RawWrongQuestionInput, camel: keyof RawWrongQuestionInput, snake: keyof RawWrongQuestionInput): unknown {
  return input[camel] ?? input[snake];
}

export function parseWrongQuestion(input: unknown): ValidatedWrongQuestion {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("错题输入必须是对象");
  const raw = input as RawWrongQuestionInput;
  const parsedSubject = subject(raw.subject);
  const chapterInfo = resolveChapter(parsedSubject, {
    chapterId: raw.chapterId ?? raw.chapter_id,
    chapterNumber: raw.chapterNumber ?? raw.chapter_number,
    chapter: raw.chapter,
  });
  const topic = raw.topic === undefined || raw.topic === null || (typeof raw.topic === "string" && !raw.topic.trim())
    ? TOPIC_FALLBACK
    : text(raw.topic, "topic", MAX.normal);
  const problemType = text(alias(raw, "problemType", "problem_type"), "problemType", MAX.normal);
  const question = text(raw.question, "question", MAX.question);
  const userError = text(alias(raw, "userError", "user_error"), "userError", MAX.normal);
  const errorReason = text(alias(raw, "errorReason", "error_reason"), "errorReason", MAX.normal);
  const correctSolution = text(alias(raw, "correctSolution", "correct_solution"), "correctSolution", MAX.normal);
  const keyPoint = text(alias(raw, "keyPoint", "key_point"), "keyPoint", MAX.normal);
  if (!Array.isArray(raw.tags) || raw.tags.length > 20 || raw.tags.some((tag) => typeof tag !== "string" || !tag.trim() || tag.length > MAX.tag)) {
    throw new Error("tags 必须是最多 20 个非空字符串");
  }
  const tags = [...new Set(raw.tags.map((tag) => tag.trim()))];
  const image = optionalText(alias(raw, "sourceImage", "source_image"), "sourceImage", MAX.normal);
  return {
    subject: parsedSubject,
    chapterId: chapterInfo.id,
    chapterNumber: chapterInfo.number,
    chapter: chapterInfo.name,
    questionId: buildWrongQuestionId(parsedSubject, chapterInfo.id, question),
    topic,
    problemType,
    question,
    userError,
    errorReason,
    correctSolution,
    keyPoint,
    tags,
    ...(image ? { sourceImage: validateSourceImageReference(image) } : {}),
  };
}
