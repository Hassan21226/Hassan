import {readFile,writeFile,mkdir,mkdtemp,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';

const account=process.env.CLOUDFLARE_ACCOUNT_ID;
const token=process.env.CLOUDFLARE_API_TOKEN;
const password=process.env.ADMIN_PASSWORD;
const name='lathat-alajdad-menu';
const databaseName='lathat-alajdad-menu-db';
const bucket='lathat-alajdad-menu-media';
const source='https://lathat-alajdad-menu.sacredkoala16.chatgpt.site';
if(!account||!token||!password)throw Error('Add CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN and ADMIN_PASSWORD to GitHub Actions secrets first.');
if(!/^[a-f0-9]{32}$/i.test(account))throw Error('Invalid Cloudflare account ID.');
if(password.length<12)throw Error('Use an admin password with at least 12 characters.');
async function api(path,method='GET',body){
 const res=await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}${path}`,{method,headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});
 const data=await res.json();
 if(!res.ok||!data.success)throw Error(`Cloudflare ${method} ${path.split('?')[0]} failed (${res.status}); check token permissions and that R2 is activated.`);
 return data.result;
}
function run(args,input){
 const result=spawnSync(process.execPath,['node_modules/wrangler/bin/wrangler.js',...args],{stdio:input===undefined?'inherit':['pipe','inherit','inherit'],input,env:process.env});
 if(result.error)throw result.error;
 if(result.status!==0)throw Error(`Wrangler ${args[0]} failed.`);
}
const action=process.argv[2];
if(action==='prepare'){
 let databases=[];
 for(let page=1;;page++){
  const list=await api(`/d1/database?per_page=100&page=${page}`);databases.push(...list);
  if(list.length<100)break;
 }
 let db=databases.find(x=>x.name===databaseName);
 if(!db)db=await api('/d1/database','POST',{name:databaseName});
 const listed=await api('/r2/buckets?name_contains='+encodeURIComponent(bucket));
 if(!listed.buckets.some(x=>x.name===bucket))await api('/r2/buckets','POST',{name:bucket});
 const query=async(sql,params=[])=>{
  const results=await api(`/d1/database/${db.uuid}/query`,'POST',{sql,params});
  if(results.some(x=>!x.success))throw Error('Database query failed.');
  return results;
 };
 await query('CREATE TABLE IF NOT EXISTS settings (id TEXT PRIMARY KEY, value TEXT NOT NULL)');
 const existing=await query('SELECT value FROM settings WHERE id = ?',['menu']);
 if(!existing[0]?.results?.length){
  console.log('Copying current menu and media before first publication.');
  const res=await fetch(source+'/api/menu');if(!res.ok)throw Error('Current menu is unavailable; migration stopped.');
  const {menu}=await res.json();if(!menu||!Array.isArray(menu.products))throw Error('Invalid source menu.');
  const media=new Map();
  for(const p of menu.products)for(const m of [...(p.media??[]),p.cooked].filter(Boolean)){
   if(!/^\/media\/[a-zA-Z0-9-]+$/.test(m.url))throw Error('Unexpected media URL; migration stopped.');
   media.set(m.url,m);
  }
  const temp=await mkdtemp(join(tmpdir(),'menu-migration-'));
  try{
   let i=0;for(const [url,m] of media){
    const file=join(temp,'asset');const asset=await fetch(source+url);if(!asset.ok)throw Error('Media download failed; migration stopped.');
    await writeFile(file,new Uint8Array(await asset.arrayBuffer()));
    run(['r2','object','put',bucket+'/'+url.split('/').pop(),'--file',file,'--content-type',asset.headers.get('content-type')||'application/octet-stream','--remote']);
    console.log(`Copied media ${++i}/${media.size}`);
   }
   await query('INSERT OR IGNORE INTO settings (id,value) VALUES (?,?)',['menu',JSON.stringify(menu)]);
  }finally{await rm(temp,{recursive:true,force:true});}
 }else console.log('Existing destination menu retained.');
 const config={name,main:'../build/sites-worker.ts',compatibility_date:'2026-05-15',compatibility_flags:['nodejs_compat'],workers_dev:true,d1_databases:[{binding:'DB',database_name:databaseName,database_id:db.uuid}],r2_buckets:[{binding:'BUCKET',bucket_name:bucket}]};
 await mkdir('.cloudflare-deploy',{recursive:true});await writeFile('.cloudflare-deploy/wrangler.json',JSON.stringify(config,null,2));
 console.log('Database, storage and build configuration are ready.');
}else if(action==='publish'){
 const redirect=JSON.parse(await readFile('.wrangler/deploy/config.json','utf8'));
 const {resolve}=await import('node:path');
 const config=resolve('.wrangler/deploy',redirect.configPath);
 const output=JSON.parse(await readFile(config,'utf8'));
 if(output.name!==name||!output.d1_databases?.some(x=>x.binding==='DB'&&x.database_name===databaseName)||!output.r2_buckets?.some(x=>x.binding==='BUCKET'&&x.bucket_name===bucket))throw Error('Unexpected deployment configuration; publication stopped.');
 // Set the password before enabling a first publication. Values travel via stdin.
 run(['secret','bulk','--config',config],JSON.stringify({ADMIN_PASSWORD:password}));
 run(['deploy','--config',config]);
 console.log('Publication finished. The public URL is shown in the Wrangler output above.');
}else throw Error('Expected prepare or publish.');
