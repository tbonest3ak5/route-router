const FRIEND_COLORS = [
  "#EF4444", // red
  "#F97316", // orange
  "#EAB308", // yellow
  "#22C55E", // green
  "#06B6D4", // cyan
  "#6366F1", // indigo
  "#A855F7", // purple
  "#EC4899", // pink
];

export function assignColor(index: number): string {
  return FRIEND_COLORS[index % FRIEND_COLORS.length];
}

export { FRIEND_COLORS };
