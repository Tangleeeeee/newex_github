export const CATEGORY_LABELS = {
  FOOD: "음식",
  TRAVEL: "여행",
  SPORTS: "운동",
  CULTURE: "문화",
  SOCIAL: "사교",
  LEARNING: "학습",
  NATURE: "자연",
  ENTERTAINMENT: "엔터테인먼트",
  OTHER: "기타",
} as const;

export const CATEGORIES = Object.keys(CATEGORY_LABELS) as Array<keyof typeof CATEGORY_LABELS>;
