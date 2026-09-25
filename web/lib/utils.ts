export function middleEllipsis(str: string, len: number) {
  if (!str) return "";
  if (str.length <= len) return str;
  const half = Math.floor(len / 2);
  return `${str.slice(0, half)}...${str.slice(-half)}`;
}
