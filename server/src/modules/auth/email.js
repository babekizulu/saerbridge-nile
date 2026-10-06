"use strict";
const {Router}=require('express');
const crypto=require('node:crypto');
const {z}=require('zod');
const {wrap}=require('../../middleware/errorHandler');
const {badRequest,unauthorized}=require('../../utils/errors');
const {hash,limit}=require('../nile/security');
const {publicUser}=require('../users/usersRepo');
function createEmailRouter({pool,usersRepo,issueCsrfToken,sendEmail}){
 const router=Router();
 router.post('/email/start',wrap(async(req,res)=>{
  const parsed=z.object({email:z.string().email().max(254)}).strict().safeParse(req.body);if(!parsed.success)throw badRequest('Enter a valid email address');
  const email=parsed.data.email.toLowerCase().trim();await limit(pool,`email-ip:${hash(req.ip)}`,5,900);await limit(pool,`email-address:${hash(email)}`,3,900);
  if(!sendEmail)throw new (require('../../utils/errors').AppError)(503,'EMAIL_UNAVAILABLE','Email sign-in is not configured');
  const code=crypto.randomInt(10000000,100000000).toString();const {rows}=await pool.query("INSERT INTO email_challenges(email,token_hash,expires_at) VALUES($1,$2,now()+interval '10 minutes') RETURNING id",[email,hash(code)]);
  await sendEmail(email,code);res.status(202).json({data:{challengeId:rows[0].id,message:'Enter the code sent to your email. It expires in ten minutes.'}});
 }));
 router.post('/email/verify',wrap(async(req,res)=>{
  const parsed=z.object({challengeId:z.string().uuid(),code:z.string().regex(/^\d{8}$/)}).strict().safeParse(req.body);if(!parsed.success)throw badRequest('Enter the eight-digit sign-in code');
  await limit(pool,`verify:${hash(req.ip)}`,10,900);const {challengeId,code}=parsed.data;
  const c=await pool.connect();let user;
  try{await c.query('BEGIN');const {rows}=await c.query('SELECT * FROM email_challenges WHERE id=$1 FOR UPDATE',[challengeId]);const challenge=rows[0];
   if(!challenge||challenge.consumed_at||new Date(challenge.expires_at)<new Date()||challenge.attempts>=5)throw unauthorized('Invalid or expired sign-in code');
   await c.query('UPDATE email_challenges SET attempts=attempts+1 WHERE id=$1',[challengeId]);
   if(!crypto.timingSafeEqual(Buffer.from(challenge.token_hash),Buffer.from(hash(code)))){await c.query('COMMIT');throw unauthorized('Invalid or expired sign-in code');}
   await c.query('SELECT pg_advisory_xact_lock(hashtext($1))',[challenge.email]);
   const existing=await c.query('SELECT * FROM users WHERE lower(primary_email)=$1 AND deleted_at IS NULL',[challenge.email]);
   if(existing.rows.length>1)throw badRequest('Account requires support to resolve duplicate identities');
   user=existing.rows[0];if(!user){const added=await c.query("INSERT INTO users(primary_email,display_name) VALUES($1,'Saerbridge member') RETURNING *",[challenge.email]);user=added.rows[0];await c.query('INSERT INTO user_preferences(user_id) VALUES($1)',[user.id]);}
   if(user.account_status!=='active')throw unauthorized('Account unavailable');
   await c.query('UPDATE email_challenges SET consumed_at=now() WHERE id=$1',[challengeId]);await c.query('COMMIT');
  }catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}
  await new Promise((resolve,reject)=>req.session.regenerate(e=>e?reject(e):resolve()));req.session.userId=user.id;req.session.googleNonce=crypto.randomBytes(16).toString('hex');
  const csrfToken=issueCsrfToken(req);await new Promise((resolve,reject)=>req.session.save(e=>e?reject(e):resolve()));
  res.json({data:{authenticated:true,user:publicUser(await usersRepo.findById(user.id)),csrfToken,googleNonce:req.session.googleNonce}});
 }));return router;
}
async function sendResendEmail(email,code){
 const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({from:process.env.EMAIL_FROM,to:[email],subject:'Your Saerbridge sign-in code',text:`Your sign-in code is ${code}. It expires in ten minutes. If you did not request it, ignore this email.`}),signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw new Error('EMAIL_PROVIDER_FAILURE');
}
module.exports={createEmailRouter,sendResendEmail};
