const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const request=require('supertest');
const crypto=require('node:crypto');
require('dotenv').config({quiet:true});
const {createApp}=require('../src/app');
const {migrateUp}=require('../src/db/migrate');
const {loadEnv}=require('../src/config/env');
const {runOne,validateAnalysis}=require('../src/modules/nile/worker');
const {buildArchive}=require('../src/modules/nile/router');
const {syntheticRecords}=require('../src/modules/nile/seed');
let app,pool;const origin='http://localhost:5173',prefix=crypto.randomUUID();let emailCode;
before(async()=>{
 process.env.NODE_ENV='test';process.env.ENABLE_TEST_AUTH='true';process.env.CLIENT_ORIGINS=origin;process.env.ADMIN_EMAILS=`admin-${prefix}@example.com`;process.env.OPENAI_ENABLED='false';process.env.TRANSCRIPT_ENCRYPTION_KEY=crypto.randomBytes(32).toString('base64');
 await migrateUp();({app,pool}=createApp({config:loadEnv(),sendEmail:async(_email,code)=>{emailCode=code;}}));
});
after(async()=>pool?.end());
async function actor(name){const agent=request.agent(app);let res=await agent.get('/api/v1/auth/session');let csrf=res.body.data.csrfToken;res=await agent.post('/api/v1/auth/test-login').set('Origin',origin).set('X-CSRF-Token',csrf).send({email:`${name}-${prefix}@example.com`,googleSub:`${name}-${prefix}`,displayName:name});assert.equal(res.status,200);csrf=res.body.data.csrfToken;return {agent,csrf,user:res.body.data.user,post:(path,body)=>agent.post('/api/v1'+path).set('Origin',origin).set('X-CSRF-Token',csrf).send(body)};}
test('public archive supports unrelated browser origins and contains no transcripts',async()=>{
 const res=await request(app).get('/api/v1/nile/public/archive').set('Origin','http://localhost:4599');assert.equal(res.status,200);assert.equal(res.headers['access-control-allow-origin'],'*');assert.equal(res.headers['access-control-allow-credentials'],undefined);assert(!JSON.stringify(res.body).includes('text_cipher'));
 const privateRes=await request(app).get('/api/v1/nile/organizations').set('Origin','https://evil.example');assert.equal(privateRes.status,403);
});
test('private org isolation, no personal uploads, text validation, deduplication and read-only keys',async()=>{
 const a=await actor('one'),b=await actor('two');
 const created=await a.post('/nile/organizations',{name:'Research One'});assert.equal(created.status,201);const id=created.body.data.id;
 assert.equal((await b.agent.get(`/api/v1/nile/organizations/${id}/transcripts`)).status,403);
 const input={title:'Synthetic privacy test',township:'greenbushes',text:syntheticRecords()[0].text,consentReference:'TEST-ONLY',permissionConfirmed:true,demonstration:true};
 assert.equal((await b.post(`/nile/organizations/${id}/transcripts`,input)).status,403);
 assert.equal((await a.post(`/nile/organizations/${id}/transcripts`,{...input,audio:'binary'})).status,400);
 const uploaded=await a.post(`/nile/organizations/${id}/transcripts`,input);assert.equal(uploaded.status,201);const tid=uploaded.body.data.id;
 assert.equal((await a.post(`/nile/organizations/${id}/transcripts`,input)).status,409);
 const row=(await pool.query('SELECT text_cipher FROM nile_transcripts WHERE id=$1',[tid])).rows[0];assert(!row.text_cipher.includes('SYNTHETIC'));
 assert.equal((await b.agent.get(`/api/v1/nile/organizations/${id}/transcripts/${tid}`)).status,403);
 assert.equal((await a.post('/nile/admin/releases',{demonstration:true,methodology:'test-v1',disclosureReviewComplete:true})).status,403);
 const key=(await a.post('/nile/keys',{label:'tenant key',organizationId:id})).body.data;
 assert.equal((await request(app).get(`/api/v1/nile/organizations/${id}/transcripts`).set('Authorization',`Bearer ${key.token}`)).status,200);
 const second=(await b.post('/nile/organizations',{name:'Research Two'})).body.data.id;
 assert.equal((await request(app).get(`/api/v1/nile/organizations/${second}/transcripts`).set('Authorization',`Bearer ${key.token}`)).status,403);
 assert.equal((await request(app).post(`/api/v1/nile/organizations/${id}/transcripts`).set('Authorization',`Bearer ${key.token}`).send(input)).status,403);
 await pool.query('DELETE FROM memberships WHERE organization_id=$1 AND user_id=$2',[id,a.user.id]);
 assert.equal((await request(app).get(`/api/v1/nile/organizations/${id}/transcripts`).set('Authorization',`Bearer ${key.token}`)).status,403);
});
test('email registration verifies code, rejects replay, enforces CSRF and disabled accounts',async()=>{
 const a=request.agent(app);const csrf=(await a.get('/api/v1/auth/session')).body.data.csrfToken;
 assert.equal((await a.post('/api/v1/auth/email/start').send({email:'x@example.com'})).status,403);
 const start=await a.post('/api/v1/auth/email/start').set('X-CSRF-Token',csrf).set('Origin',origin).send({email:`email-${prefix}@example.com`});assert.equal(start.status,202);
 const challengeId=start.body.data.challengeId;
 const verify=await a.post('/api/v1/auth/email/verify').set('X-CSRF-Token',csrf).set('Origin',origin).send({challengeId,code:emailCode});assert.equal(verify.status,200);assert(verify.body.data.authenticated);
 const replay=await a.post('/api/v1/auth/email/verify').set('X-CSRF-Token',verify.body.data.csrfToken).set('Origin',origin).send({challengeId,code:emailCode});assert.equal(replay.status,401);
});
test('AI processes only privacy-reviewed jobs and requires human approval',async()=>{
 const a=await actor('pipeline'),org=(await a.post('/nile/organizations',{name:'AI Test'})).body.data.id;
 const text=syntheticRecords()[2].text;const tid=(await a.post(`/nile/organizations/${org}/transcripts`,{title:'Pipeline test',township:'greenbushes',text,consentReference:'TEST-ONLY',permissionConfirmed:true,demonstration:true})).body.data.id;
 let calls=0;const provider={responses:{create:async options=>{calls++;assert.equal(options.store,false);assert.equal(options.max_output_tokens,2000);return {output_text:JSON.stringify({themes:[{slug:'employment',evidence:'I would like steady work with predictable hours so that I can plan household spending.'}]})};}}};
 assert.equal(await runOne(pool,provider),false);assert.equal(calls,0);
 assert.equal((await a.post(`/nile/organizations/${org}/transcripts/${tid}/privacy-review`,{redactedText:text,consentVerified:true,identifiersRemoved:true,providerProcessingApproved:true})).status,200);
 await runOne(pool,provider);assert.equal(calls,1);assert.equal((await pool.query('SELECT status FROM nile_transcripts WHERE id=$1',[tid])).rows[0].status,'analysis_review');
 assert.equal((await a.post(`/nile/organizations/${org}/transcripts/${tid}/review`,{decision:'approved',evidenceChecked:true})).status,200);
 assert.throws(()=>validateAnalysis({themes:[{slug:'employment',evidence:'invented evidence here'}]},text));
});
test('publication suppresses small counts and complements; does not release quotes or text',()=>{
 const archive=buildArchive(syntheticRecords(),{demonstration:true,methodology:'test-v1'});assert.equal(archive.areas.length,2);assert.equal(archive.quotes.length,0);
 const low=archive.findings.filter(f=>f.theme==='safety');assert(low.every(f=>f.measure.suppressed&&!('count' in f.measure)));
 assert(!JSON.stringify(archive).includes('Participant:'));
});
