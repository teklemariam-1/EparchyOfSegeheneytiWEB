import https from 'https';

const TOKEN = process.env.GITHUB_TOKEN;
if (!TOKEN) { console.error('Set GITHUB_TOKEN env var'); process.exit(1); }
const JOB_ID = '68695539933';

function get(path, hostname = 'api.github.com') {
  return new Promise((resolve, reject) => {
    https.get({
      hostname, path,
      headers: { Authorization: 'token ' + TOKEN, 'User-Agent': 'ci', Accept: 'application/vnd.github+json' }
    }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const u = new URL(res.headers.location);
        return resolve(get(u.pathname + u.search, u.hostname));
      }
      let d = ''; res.on('data', c => d += c); res.on('end', () => resolve(d));
    }).on('error', reject);
  });
}

const log = await get(`/repos/teklemariam-1/EparchyOfSegeheneytiWEB/actions/jobs/${JOB_ID}/logs`);
const lines = log.split('\n');
// Find build step start
const buildStart = lines.findIndex(l => l.toLowerCase().includes('vercel build'));
const relevant = lines.slice(buildStart >= 0 ? buildStart : Math.max(0, lines.length - 100));
// Print up to 150 lines
process.stdout.write(relevant.slice(0, 150).join('\n'));
