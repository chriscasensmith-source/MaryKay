import type { TourLanguage } from "@prisma/client";

/** Badge text shown on public pages; English tours get no badge. */
export const LANGUAGE_BADGE: Record<TourLanguage, string | null> = {
  ENGLISH: null,
  SPANISH: "Español",
  BILINGUAL: "Bilingüe",
};

/** Labels for the admin form and slot details. */
export const LANGUAGE_LABEL: Record<TourLanguage, string> = {
  ENGLISH: "English",
  SPANISH: "Spanish (Español)",
  BILINGUAL: "Bilingual (Bilingüe)",
};

export const LANGUAGES: TourLanguage[] = ["ENGLISH", "SPANISH", "BILINGUAL"];
