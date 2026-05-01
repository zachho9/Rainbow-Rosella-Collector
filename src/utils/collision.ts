export function distance(ax: number, ay: number, bx: number, by: number): number {
  return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2)
}

export function isColliding(
  ax: number, ay: number, aRadius: number,
  bx: number, by: number, bRadius: number,
): boolean {
  return distance(ax, ay, bx, by) < aRadius + bRadius
}
