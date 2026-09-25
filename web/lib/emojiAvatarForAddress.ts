const emojis = ["🌈", "🦄", "🔥", "🌊", "🍀", "⚡", "🌙", "🍉", "🎈", "🐙"];
const colors = [
  "#FF6B6B",
  "#4ECDC4",
  "#FFD93D",
  "#6C5CE7",
  "#00B894",
  "#FD79A8",
  "#0984E3",
  "#E17055",
];

export function emojiAvatarForAddress(address: string) {
  let hash = 0;
  for (let i = 0; i < address.length; i++) {
    hash = (hash * 31 + address.charCodeAt(i)) >>> 0;
  }
  return {
    emoji: emojis[hash % emojis.length],
    color: colors[hash % colors.length],
  };
}
