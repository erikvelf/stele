function heightOf(renderIds: string[], heights: number[], id: string): number {
  'worklet';
  const index = renderIds.indexOf(id);
  return index < 0 ? 0 : (heights.at(index) ?? 0);
}

// Rows keep the slots they were rendered into; a sequence only says where
// each one should appear. Offsets are the difference between the two.
export function topOfId(
  sequence: string[],
  renderIds: string[],
  heights: number[],
  id: string
): number {
  'worklet';
  let top = 0;
  for (let index = 0; index < sequence.length; index += 1) {
    const other = sequence.at(index) ?? '';
    if (other === id) {
      break;
    }
    top += heightOf(renderIds, heights, other);
  }
  return top;
}

export function movedOrder(
  order: string[],
  id: string,
  toIndex: number
): string[] {
  'worklet';
  const rest = order.filter(other => other !== id);
  rest.splice(toIndex, 0, id);
  return rest;
}

// Steps into a neighbour's slot once the finger has passed its midpoint.
export function targetIndexFor(
  order: string[],
  renderIds: string[],
  heights: number[],
  id: string,
  travel: number
): number {
  'worklet';
  const fromIndex = order.indexOf(id);
  if (fromIndex < 0) {
    return 0;
  }
  if (travel === 0) {
    return fromIndex;
  }
  const direction = travel > 0 ? 1 : -1;
  let remaining = Math.abs(travel);
  let index = fromIndex;
  for (
    let neighbor = fromIndex + direction;
    neighbor >= 0 && neighbor < order.length;
    neighbor += direction
  ) {
    const height = heightOf(renderIds, heights, order.at(neighbor) ?? '');
    if (remaining < height / 2) {
      break;
    }
    remaining -= height;
    index = neighbor;
  }
  return index;
}

// `order` with every id absent from `ids` dropped and every new one appended,
// so a sequence already on screen keeps its arrangement.
export function mergedOrder(order: string[], ids: string[]): string[] {
  const next = new Set(ids);
  const kept = order.filter(id => next.has(id));
  return [...kept, ...ids.filter(id => !order.includes(id))];
}

export function sameOrder(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((id, index) => id === b.at(index));
}
