import https from 'https';
import fs from 'fs';

const T = process.env.GITHUB_TOKEN;
if (!T) { console.error('Set GITHUB_TOKEN env var'); process.exit(1); }
const RUN_ID = '23592139178';
const OUTPUT = 'd:/EparchyOfSegeheneytiWEB/build_log2.txt';

function g(p) {
  return new Promise((r,j) => {
    https.get({hostname:'api.github.com',path:p,headers:{Authorization:'token '+T,'User-Agent':'x',Accept:'application/vnd.github+json'}},res=>{
      let d='';res.on('data',c=>d+=c);res.on('end',()=>r(JSON.parse(d)));
    }).on('error',j);
  });
}

function getLog(url) {
  const u = new URL(url);
  return new Promise((resolve,reject)=>{
    https.get({hostname:u.hostname,path:u.pathname+u.search,headers:{Authorization:'token '+T,'User-Agent':'x',Accept:'application/vnd.github+json'}},res=>{
      if(res.statusCode>=300&&res.statusCode<400&&res.headers.location){return getLog(res.headers.location).then(resolve).catch(reject);}
      let d='';res.on('data',c=>d+=c);res.on('end',()=>resolve(d));
    }).on('error',reject);
  });
}

const jobs = await g('/repos/teklemariam-1/EparchyOfSegeheneytiWEB/actions/runs/'+RUN_ID+'/jobs');
const job = jobs.jobs.find(j=>j.conclusion==='failure') || jobs.jobs[0];
process.stdout.write('Job ID: '+job.id+' conclusion: '+job.conclusion+'\n');
job.steps.filter(s=>s.conclusion).forEach(s=>process.stdout.write(' step '+s.number+' '+s.name+' -> '+s.conclusion+'\n'));

const log = await getLog('https://api.github.com/repos/teklemariam-1/EparchyOfSegeheneytiWEB/actions/jobs/'+job.id+'/logs');
fs.writeFileSync(OUTPUT, log);
process.stdout.write('Saved '+log.length+' bytes to '+OUTPUT+'\n');

const lines = log.split('\n');
const failLine = lines.findIndex(l=>l.includes('Error')||l.includes('error')&&!l.includes('##[endgroup]'));
const from = failLine > 0 ? Math.max(0, failLine-3) : Math.max(0, lines.length-80);
process.stdout.write('\n=== FROM LINE '+from+' ===\n');
process.stdout.write(lines.slice(from, from+80).join('\n').slice(0,5000)+'\n');
