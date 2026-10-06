"use strict";
require('dotenv').config();
const {Pool}=require('pg');
const {encrypt,hash}=require('./security');
const {townships}=require('./catalog');
const {buildArchive}=require('./router');
function syntheticRecords(){return townships.flatMap(area=>Array.from({length:30},(_,i)=>{
 const statements=[
  i<18?['employment','I would like steady work with predictable hours so that I can plan household spending.']:null,
  i%2===0?['transport','Transport costs make it difficult to travel for interviews or training.']:null,
  i<12?['services','Reliable water and regular waste collection would make daily life easier.']:null,
  i<8?['safety','Better street lighting would help me feel safer walking home.']:null,
  i>=15?['enterprise','I want to grow a small local business and learn how to keep financial records.']:null,
  i>=12?['community','Neighbours help each other with information and shared tasks.']:null
 ].filter(Boolean);
 const text=`SYNTHETIC TEST ONLY. Fictional interview ${i+1}, ${area.name}. No real participant or research observation.\nInterviewer: What would improve everyday life in your area?\nParticipant: ${statements.map(s=>s[1]).join(' ')}\nInterviewer: Is there anything else?\nParticipant: Different households have different priorities; this is just an invented example.`;
 return {township:area.slug,title:`Synthetic ${area.name} ${String(i+1).padStart(2,'0')}`,text,analysis:{themes:statements.map(([slug,evidence])=>({slug,evidence}))},demonstration:true};
}));}
async function seedDemo(pool){
 const org=(await pool.query("SELECT id FROM organizations WHERE kind='saerbridge'")).rows[0].id;
 const uploader=(await pool.query("INSERT INTO users(google_sub,primary_email,display_name,account_status) VALUES('demo-seed-uploader','uploader@demo.invalid','Synthetic seed author','disabled') ON CONFLICT(google_sub) DO UPDATE SET display_name=EXCLUDED.display_name RETURNING id")).rows[0].id;
 const reviewer=(await pool.query("INSERT INTO users(google_sub,primary_email,display_name,account_status) VALUES('demo-seed-reviewer','reviewer@demo.invalid','Synthetic seed reviewer','disabled') ON CONFLICT(google_sub) DO UPDATE SET display_name=EXCLUDED.display_name RETURNING id")).rows[0].id;
 for(const t of syntheticRecords())await pool.query(`INSERT INTO nile_transcripts(organization_id,uploaded_by,township,title,text_cipher,content_hash,consent_reference,demonstration,status,privacy_reviewed_by,reviewed_by,analysis,model,prompt_version)
 VALUES($1,$2,$3,$4,$5,$6,'SYNTHETIC-NO-PARTICIPANT',true,'approved',$7,$7,$8,'deterministic-fixture','fixture-v1') ON CONFLICT(organization_id,content_hash) DO NOTHING`,[org,uploader,t.township,t.title,encrypt(t.text),hash(t.text.trim()),reviewer,t.analysis]);
 const rows=(await pool.query('SELECT * FROM nile_transcripts WHERE organization_id=$1 AND demonstration=true AND status=\'approved\'',[org])).rows;
 const existing=await pool.query('SELECT id FROM nile_releases WHERE demonstration=true AND withdrawn_at IS NULL');
 if(!existing.rows.length)await pool.query('INSERT INTO nile_releases(organization_id,published_by,archive,demonstration) VALUES($1,$2,$3,true)',[org,reviewer,buildArchive(rows,{demonstration:true,methodology:'synthetic-fixture-v1'})]);
}
if(require.main===module){if(process.env.NILE_DEMO_SEED!=='true')throw new Error('Set NILE_DEMO_SEED=true to explicitly seed fictional data');const pool=new Pool({connectionString:process.env.DATABASE_URL});seedDemo(pool).then(()=>pool.end()).catch(()=>{console.error('Seed failed');process.exitCode=1;pool.end();});}
module.exports={syntheticRecords,seedDemo};
