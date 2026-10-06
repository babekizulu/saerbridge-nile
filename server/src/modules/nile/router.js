"use strict";
const {Router}=require('express');
const {z}=require('zod');
const crypto=require('node:crypto');
const {wrap}=require('../../middleware/errorHandler');
const {requireAuth,requireAdmin}=require('../../middleware/auth');
const {badRequest,forbidden,notFound,conflict}=require('../../utils/errors');
const {hash,encrypt,decrypt,limit,createAccess,keyAuth}=require('./security');
const {townships,themes,emptyArchive}=require('./catalog');
const uuid=z.string().uuid();
const textSchema=z.string().min(80).max(40000).refine(s=>!/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(s),'Plain transcript text only');
function parse(schema,value){const r=schema.safeParse(value);if(!r.success)throw badRequest('Invalid input',r.error.flatten());return r.data;}
function createNileRouter({pool,usersRepo}) {
 const router=Router(),access=createAccess(pool);
 const audit=(req,org,action,id)=>pool.query('INSERT INTO nile_audit(actor_id,organization_id,action,resource_id) VALUES($1,$2,$3,$4)',[req.currentUser.id,org,action,id||null]);
 router.use(keyAuth(pool,usersRepo));
 router.get('/public/archive',wrap(async(req,res)=>{
  await limit(pool,`public:${hash(req.ip)}`,120);
  const {rows}=await pool.query(`SELECT archive,demonstration FROM nile_releases WHERE withdrawn_at IS NULL ORDER BY created_at DESC LIMIT 1`);
  res.set('Cache-Control','public, max-age=60').json({data:rows[0]?.archive||emptyArchive(),meta:{demonstration:rows[0]?.demonstration||false,nextCursor:null}});
 }));
 router.get('/catalog',(_req,res)=>res.json({data:{townships,themes}}));
 router.get('/organizations',requireAuth,wrap(async(req,res)=>{
  const {rows}=await pool.query(`SELECT o.*,m.role FROM organizations o LEFT JOIN memberships m ON m.organization_id=o.id AND m.user_id=$1
   WHERE m.user_id=$1 OR (o.kind='saerbridge' AND $2='admin') ORDER BY o.name`,[req.currentUser.id,req.currentUser.role]);res.json({data:rows});
 }));
 router.post('/organizations',requireAuth,wrap(async(req,res)=>{
  const {name}=parse(z.object({name:z.string().trim().min(3).max(100)}).strict(),req.body);
  await limit(pool,`org-create:${req.currentUser.id}`,3,86400);
  const c=await pool.connect();try{await c.query('BEGIN');const {rows}=await c.query('INSERT INTO organizations(name) VALUES($1) RETURNING *',[name]);
   await c.query("INSERT INTO memberships VALUES($1,$2,'owner')",[rows[0].id,req.currentUser.id]);await c.query('COMMIT');res.status(201).json({data:rows[0]});
  }catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}
 }));
 router.post('/organizations/:org/members',requireAuth,wrap(async(req,res)=>{
  const org=await access(req,parse(uuid,req.params.org),true);if(org.member_role!=='owner')throw forbidden('Organization owner required');
  const input=parse(z.object({email:z.string().email(),role:z.enum(['researcher','viewer'])}).strict(),req.body);
  const {rows}=await pool.query("SELECT id FROM users WHERE lower(primary_email)=lower($1) AND account_status='active'",[input.email]);
  if(rows.length!==1)throw badRequest('The member must have a unique registered account.');
  await pool.query('INSERT INTO memberships VALUES($1,$2,$3) ON CONFLICT DO NOTHING',[org.id,rows[0].id,input.role]);await audit(req,org.id,'member.add',rows[0].id);res.status(201).json({data:{added:true}});
 }));
 router.get('/organizations/:org/transcripts',wrap(async(req,res)=>{
  const org=await access(req,parse(uuid,req.params.org));
  const {rows}=await pool.query(`SELECT id,title,township,status,demonstration,created_at,analysis,failure_code FROM nile_transcripts WHERE organization_id=$1 ORDER BY created_at DESC LIMIT 100`,[org.id]);res.set('Cache-Control','no-store').json({data:rows});
 }));
 router.post('/organizations/:org/transcripts',requireAuth,wrap(async(req,res)=>{
  const org=await access(req,parse(uuid,req.params.org),true);
  const body=parse(z.object({title:z.string().trim().min(3).max(120),township:z.enum(['greenbushes','walmer-township']),text:textSchema,
   consentReference:z.string().trim().min(4).max(200),permissionConfirmed:z.literal(true),demonstration:z.boolean().default(false)}).strict(),req.body);
  await limit(pool,`upload:${org.id}`,20,3600);
  try{const {rows}=await pool.query(`INSERT INTO nile_transcripts(organization_id,uploaded_by,township,title,text_cipher,content_hash,consent_reference,demonstration)
   VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id,status`,[org.id,req.currentUser.id,body.township,body.title,encrypt(body.text),hash(body.text.trim()),body.consentReference,body.demonstration]);
   await audit(req,org.id,'transcript.upload',rows[0].id);res.status(201).json({data:rows[0]});
  }catch(e){if(e.code==='23505')throw conflict('This transcript already exists in this organization.');throw e;}
 }));
 router.get('/organizations/:org/transcripts/:id',requireAuth,wrap(async(req,res)=>{
  const org=await access(req,parse(uuid,req.params.org),true);const {rows}=await pool.query('SELECT * FROM nile_transcripts WHERE id=$1 AND organization_id=$2',[parse(uuid,req.params.id),org.id]);
  if(!rows[0])throw notFound();const t=rows[0];await audit(req,org.id,'transcript.read',t.id);
  res.set('Cache-Control','no-store').json({data:{id:t.id,title:t.title,text:decrypt(t.text_cipher),status:t.status,consentReference:t.consent_reference,analysis:t.analysis}});
 }));
 router.post('/organizations/:org/transcripts/:id/privacy-review',requireAuth,wrap(async(req,res)=>{
  const org=await access(req,parse(uuid,req.params.org),true),id=parse(uuid,req.params.id);
  const body=parse(z.object({redactedText:textSchema,consentVerified:z.literal(true),identifiersRemoved:z.literal(true),providerProcessingApproved:z.literal(true)}).strict(),req.body);
  const c=await pool.connect();try{await c.query('BEGIN');
   const {rows}=await c.query(`UPDATE nile_transcripts SET text_cipher=$3,status='queued',privacy_reviewed_by=$4
     WHERE id=$1 AND organization_id=$2 AND status='privacy_review' RETURNING id`,[id,org.id,encrypt(body.redactedText),req.currentUser.id]);
   if(!rows.length)throw conflict('Transcript is unavailable or is not awaiting privacy review.');
   await c.query('INSERT INTO nile_jobs(transcript_id) VALUES($1)',[id]);await c.query('COMMIT');
  }catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}
  await audit(req,org.id,'transcript.privacy-approved',id);res.json({data:{status:'queued'}});
 }));
 router.post('/organizations/:org/transcripts/:id/review',requireAuth,wrap(async(req,res)=>{
  const org=await access(req,parse(uuid,req.params.org),true),id=parse(uuid,req.params.id);
  const body=parse(z.object({decision:z.enum(['approved','rejected']),evidenceChecked:z.literal(true)}).strict(),req.body);
  const {rows}=await pool.query(`UPDATE nile_transcripts SET status=$3,reviewed_by=$4 WHERE id=$1 AND organization_id=$2 AND status='analysis_review'
   AND ($5<>'saerbridge' OR uploaded_by<>$4) RETURNING id`,[id,org.id,body.decision,req.currentUser.id,org.kind]);
  if(!rows.length)throw conflict('Analysis review required; Saerbridge public research needs a reviewer other than its uploader.');
  await audit(req,org.id,`analysis.${body.decision}`,id);res.json({data:{status:body.decision}});
 }));
 router.delete('/organizations/:org/transcripts/:id',requireAuth,wrap(async(req,res)=>{
  const org=await access(req,parse(uuid,req.params.org),true),id=parse(uuid,req.params.id);
  await pool.query('DELETE FROM nile_transcripts WHERE id=$1 AND organization_id=$2',[id,org.id]);await audit(req,org.id,'transcript.deleted',id);res.status(204).end();
 }));
 router.post('/admin/releases',requireAdmin,wrap(async(req,res)=>{
  const input=parse(z.object({demonstration:z.boolean(),methodology:z.string().min(5).max(120),disclosureReviewComplete:z.literal(true)}).strict(),req.body);
  const {rows}=await pool.query(`SELECT t.* FROM nile_transcripts t JOIN organizations o ON o.id=t.organization_id WHERE o.kind='saerbridge' AND t.status='approved' AND t.demonstration=$1`,[input.demonstration]);
  if(!rows.length)throw badRequest('No approved Saerbridge transcripts available.');
  const archive=buildArchive(rows,input);const result=await pool.query('INSERT INTO nile_releases(organization_id,published_by,archive,demonstration) VALUES($1,$2,$3,$4) RETURNING id',[rows[0].organization_id,req.currentUser.id,archive,input.demonstration]);
  await audit(req,rows[0].organization_id,'release.publish',result.rows[0].id);res.status(201).json({data:result.rows[0]});
 }));
 router.post('/admin/releases/:id/withdraw',requireAdmin,wrap(async(req,res)=>{
  const id=parse(uuid,req.params.id);await pool.query('UPDATE nile_releases SET withdrawn_at=now() WHERE id=$1',[id]);await audit(req,null,'release.withdraw',id);res.json({data:{withdrawn:true}});
 }));
 router.get('/keys',requireAuth,wrap(async(req,res)=>{const {rows}=await pool.query('SELECT id,label,organization_id,created_at,expires_at,revoked_at FROM api_keys WHERE user_id=$1',[req.currentUser.id]);res.json({data:rows});}));
 router.post('/keys',requireAuth,wrap(async(req,res)=>{
  const input=parse(z.object({label:z.string().min(2).max(80),organizationId:uuid.nullable().default(null)}).strict(),req.body);
  if(input.organizationId)await access(req,input.organizationId);
  await limit(pool,`keys:${req.currentUser.id}`,10,86400);const token='nile_'+crypto.randomBytes(32).toString('hex');
  const {rows}=await pool.query('INSERT INTO api_keys(user_id,organization_id,label,token_hash) VALUES($1,$2,$3,$4) RETURNING id,expires_at',[req.currentUser.id,input.organizationId,input.label,hash(token)]);
  res.set('Cache-Control','no-store').status(201).json({data:{...rows[0],token}});
 }));
 router.delete('/keys/:id',requireAuth,wrap(async(req,res)=>{await pool.query('UPDATE api_keys SET revoked_at=now() WHERE id=$1 AND user_id=$2',[parse(uuid,req.params.id),req.currentUser.id]);res.status(204).end();}));
 return router;
}
function buildArchive(rows,{demonstration,methodology}) {
 const archive=emptyArchive(); const date=new Date().toISOString().slice(0,10);
 for(const area of townships){const records=rows.filter(t=>t.township===area.slug);if(records.length<10)continue;
  const provenance={demonstration,wave:date.slice(0,7),fieldwork:'See source study register',methodology,source:demonstration?'Synthetic Saerbridge test transcripts':'Saerbridge reviewed research',interviews:records.length};
  archive.areas.push({...area,provenance});for(const theme of themes){const count=records.filter(t=>t.analysis?.themes?.some(x=>x.slug===theme.slug)).length;
   archive.findings.push({id:`${area.slug}-${theme.slug}-${date}`,area:area.slug,theme:theme.slug,title:theme.name,
    summary:`${demonstration?'Synthetic test interviews':'Reviewed interviews'} include accounts of ${theme.name.toLowerCase()}. These qualitative samples do not estimate township population prevalence.`,
    measure:count<10 || records.length-count<10?{suppressed:true,reason:'MINIMUM_SAMPLE_THRESHOLD',minimumRequired:10}:{suppressed:false,count,total:records.length},provenance,evidence:'Reviewed'});
  }
 }
 archive.releases=[{id:`release-${date}`,title:demonstration?'Synthetic township pilot':'Saerbridge township research',description:'Aggregate reviewed themes; no transcripts or participant locations.',date,version:date,findingIds:archive.findings.map(f=>f.id),demonstration}];return archive;
}
module.exports={createNileRouter,buildArchive};
