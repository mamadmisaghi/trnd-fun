export function nextRange(cursor, target, batchSize) {
  if (cursor >= target) return null;
  const fromBlock = cursor + 1n;
  const toBlock = fromBlock + batchSize - 1n > target ? target : fromBlock + batchSize - 1n;
  return { fromBlock, toBlock };
}

export function rewindHeight(cursor, startBlock, rewindBlocks) {
  const candidate = cursor > rewindBlocks ? cursor - rewindBlocks : startBlock;
  return candidate < startBlock ? startBlock : candidate;
}

export function retryBackoff(failures, baseMs, maximumMs) {
  const exponent = Math.max(0, Math.min(10, failures - 1));
  return Math.min(maximumMs, baseMs * (2 ** exponent));
}
