const FRIEND_COLORS = [
  "#2d6a5e", // teal (primary)
  "#6b8e7a", // sage
  "#c17f59", // terracotta
  "#7c9eb2", // slate blue
  "#a67c52", // warm brown
  "#8b7355", // mocha
  "#5c8a8a", // ocean
  "#9b8b7a", // taupe
];

export function assignColor(index: number): string {
  return FRIEND_COLORS[index % FRIEND_COLORS.length];
}

export { FRIEND_COLORS };
