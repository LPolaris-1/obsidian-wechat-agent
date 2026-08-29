import type { Subject } from "./types.js";

export interface ChapterDefinition {
  readonly id: string;
  readonly subject: Subject;
  readonly number: number;
  readonly name: string;
}

export const HIGH_MATH_CHAPTERS = [
  "函数极限与连续", "数列极限", "一元函数微分学的概念", "一元函数微分学的计算",
  "应用(一)几何应用", "应用(二)中值定理、微分等式与微分不等式", "应用(三)物理应用与经济应用",
  "一元函数积分学的概念与性质", "一元函数积分学的计算", "应用(一)几何应用", "应用(二)积分等式与积分不等式",
  "应用(三)物理应用与经济应用", "多元函数微分学", "二重积分", "微分方程", "无穷级数",
  "多元函数积分学(一)", "多元函数积分学(二)",
] as const;

export const LINEAR_ALGEBRA_CHAPTERS = [
  "行列式", "矩阵", "线性方程组", "向量与方程组", "矩阵相似理论", "二次型",
] as const;

export const CHAPTERS: readonly ChapterDefinition[] = [
  ...HIGH_MATH_CHAPTERS.map((name, index) => ({ id: `high-math-${String(index + 1).padStart(2, "0")}`, subject: "高数" as const, number: index + 1, name })),
  ...LINEAR_ALGEBRA_CHAPTERS.map((name, index) => ({ id: `linear-algebra-${String(index + 1).padStart(2, "0")}`, subject: "线代" as const, number: index + 1, name })),
];

export function isValidChapter(subject: Subject, chapter: string): boolean {
  return CHAPTERS.some((item) => item.subject === subject && item.name === chapter);
}
