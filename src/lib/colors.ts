const FRIEND_COLORS = [
  "#e05c4b", // red
  "#f07c35", // orange
  "#2d6a5e", // teal
  "#7c5cbf", // purple
  "#2980b9", // blue
  "#27ae60", // green
  "#e6a817", // amber
  "#c2407a", // pink
];

export function assignColor(index: number): string {
  return FRIEND_COLORS[index % FRIEND_COLORS.length];
}

export { FRIEND_COLORS };
