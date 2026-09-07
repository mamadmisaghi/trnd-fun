// D1 mirror of the portable PostgreSQL indexer schema in apps/indexer.
// Runtime access stays behind prepared statements in worker/index.js.
export const tables = {
  indexerState: "indexer_state",
  launches: "launches",
  trades: "trades",
  rawEvents: "raw_events",
};
