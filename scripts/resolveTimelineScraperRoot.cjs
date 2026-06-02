'use strict';

const fs = require('node:fs');
const path = require('node:path');

function resolveTimelineScraperRoot(startDir = __dirname) {
  const fromEnv = String(process.env.TIMELINE_SCRAPER_ROOT || '').trim();
  if (fromEnv) {
    const resolved = path.resolve(fromEnv);
    if (fs.existsSync(path.join(resolved, 'package.json'))) {
      return resolved;
    }
  }

  let dir = startDir;
  for (let depth = 0; depth < 6; depth += 1) {
    const sibling = path.join(dir, 'timeline-scraper');
    if (fs.existsSync(path.join(sibling, 'package.json'))) {
      return sibling;
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      break;
    }
    dir = parent;
  }

  return null;
}

function timelineScraperEnvPath(startDir = __dirname) {
  const root = resolveTimelineScraperRoot(startDir);
  return root ? path.join(root, '.env') : null;
}

function findScrapperEnvPath() {
  const fromEnv = timelineScraperEnvPath(path.resolve(__dirname, '../..'));
  if (fromEnv && fs.existsSync(fromEnv)) {
    return fromEnv;
  }

  throw new Error(
    'Missing timeline-scraper/.env — clone https://github.com/feyzullah/timeline-scraper '
      + 'as a sibling directory or set TIMELINE_SCRAPER_ROOT',
  );
}

module.exports = {
  findScrapperEnvPath,
  resolveTimelineScraperRoot,
};
