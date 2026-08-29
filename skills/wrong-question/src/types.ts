export type Subject = "高数" | "线代";

export interface RawWrongQuestionInput {
  subject?: unknown;
  chapter?: unknown;
  chapterId?: unknown;
  chapter_id?: unknown;
  chapterNumber?: unknown;
  chapter_number?: unknown;
  topic?: unknown;
  problemType?: unknown;
  problem_type?: unknown;
  question?: unknown;
  userError?: unknown;
  user_error?: unknown;
  errorReason?: unknown;
  error_reason?: unknown;
  correctSolution?: unknown;
  correct_solution?: unknown;
  keyPoint?: unknown;
  key_point?: unknown;
  tags?: unknown;
  sourceImage?: unknown;
  source_image?: unknown;
}

export interface ValidatedWrongQuestion {
  readonly subject: Subject;
  readonly chapterId: string;
  readonly chapterNumber: number;
  readonly chapter: string;
  readonly questionId: string;
  readonly topic: string;
  readonly problemType: string;
  readonly question: string;
  readonly userError: string;
  readonly errorReason: string;
  readonly correctSolution: string;
  readonly keyPoint: string;
  readonly tags: readonly string[];
  readonly sourceImage?: string;
}

export type ArchiveIntent = { readonly archive: true } | { readonly archive: false };

export interface WrongQuestionWritePlan {
  readonly questionId: string;
  readonly targetPath: string;
  readonly markdown: string;
  readonly attachment?: { readonly sourceReference: string };
}
