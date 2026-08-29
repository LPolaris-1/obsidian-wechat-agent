import { isValidChapter } from "./chapters.js";
import type { Subject, ValidatedWrongQuestion } from "./types.js";

export const WRONG_QUESTION_ROOT = "06-Resources/学习/考研/考研数学/错题本/原档案";
export const HIGH_MATH_ARCHIVE = `${WRONG_QUESTION_ROOT}/高数`;
export const LINEAR_ALGEBRA_ARCHIVE = `${WRONG_QUESTION_ROOT}/线代`;

const ILLEGAL_FILENAME = /[<>:"/\\|?*\u0000-\u001f]/g;
const MAX_FILENAME_LENGTH = 100;
const RESERVED_DEVICE = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\..*)?$/i;

export function archiveRootFor(subject: Subject): string {
  return subject === "高数" ? HIGH_MATH_ARCHIVE : LINEAR_ALGEBRA_ARCHIVE;
}

export function sanitizeFilename(value: string, fallback = "未命名错题"): string {
  const cleaned = value.replace(ILLEGAL_FILENAME, "-").replace(/\s+/g, " ").trim();
  let safe = Array.from(cleaned).slice(0, MAX_FILENAME_LENGTH).join("").replace(/[. ]+$/g, "");
  if (!safe || safe === "." || safe === ".." || RESERVED_DEVICE.test(safe)) safe = fallback;
  return safe;
}

export function resolveWrongQuestionTarget(question: ValidatedWrongQuestion): string {
  const prefix = `${question.questionId}-`;
  const suffix = sanitizeFilename(`${question.topic}-${question.problemType}`);
  const available = Math.max(1, MAX_FILENAME_LENGTH - Array.from(prefix).length);
  const readable = Array.from(suffix).slice(0, available).join("").replace(/[. ]+$/g, "") || "未命名错题";
  return `${archiveRootFor(question.subject)}/${prefix}${readable}.md`;
}

export function validateSourceImageReference(reference: string): string {
  const normalized = reference.replace(/\\/g, "/");
  if (!normalized || normalized.includes("\u0000") || normalized.startsWith("/") || /^[A-Za-z]:[\\/]/.test(reference) || /^[A-Za-z][A-Za-z0-9+.-]*:/.test(normalized)) {
    throw new Error("sourceImage 必须是 Vault-relative attachment reference");
  }
  const segments = normalized.split("/");
  if (segments.some((segment) => segment === ".." || segment === "")) {
    throw new Error("sourceImage 不得包含越界路径");
  }
  return normalized;
}

export function assertChapter(subject: Subject, chapter: string): void {
  if (!isValidChapter(subject, chapter)) throw new Error(`章节“${chapter}”不属于科目“${subject}”`);
}
