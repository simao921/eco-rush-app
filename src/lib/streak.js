import { format, subDays } from "date-fns";

export function computeApprovedStreak(actions = [], extraDates = []) {
  if (!Array.isArray(actions) || actions.length === 0) {
    return extraDates.length > 0 ? 1 : 0;
  }

  const approvedDates = actions
    .filter((action) => action?.status === "aprovada" && action?.created_date)
    .map((action) => action.created_date);

  const allDates = [...approvedDates, ...extraDates].filter(Boolean);
  if (allDates.length === 0) return 0;

  const days = new Set(
    allDates.map((value) => format(new Date(value), "yyyy-MM-dd"))
  );

  let streak = 0;
  let check = new Date();

  while (true) {
    const key = format(check, "yyyy-MM-dd");
    if (!days.has(key)) break;
    streak += 1;
    check = subDays(check, 1);
  }

  return streak;
}
