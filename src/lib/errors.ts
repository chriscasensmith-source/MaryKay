export const SIGNUP_ERRORS: Record<string, string> = {
  name: "Please enter your name.",
  email: "Please enter a valid email address.",
  duplicate: "You're already signed up for this tour with that email.",
  full: "Sorry, this tour just filled up.",
  unavailable: "This tour is no longer available.",
  unknown: "Something went wrong. Please try again.",
};

export const SLOT_ERRORS: Record<string, string> = {
  title: "Please enter a title.",
  datetime: "Please pick a valid date and time.",
  language: "Please pick a valid language.",
  capacity: "Guides needed must be at least 1.",
  guests: "People attending must be 0 or more.",
};

export function errorMessage(map: Record<string, string>, code?: string): string | null {
  if (!code) return null;
  return map[code] ?? map.unknown ?? "Something went wrong. Please try again.";
}
