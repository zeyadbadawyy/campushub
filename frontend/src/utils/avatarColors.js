const avatarColors = [
  "#4f46e5",
  "#06b6d4",
  "#22c55e",
  "#f97316",
  "#ec4899"
];

export function getAvatarColor(id) {
  return avatarColors[id % avatarColors.length];
}