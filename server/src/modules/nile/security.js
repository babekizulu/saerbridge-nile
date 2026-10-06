"use strict";
const crypto = require('node:crypto');
const { forbidden, unauthorized, tooMany } = require('../../utils/errors');
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
function encryptionKey() {
 const key = Buffer.from(process.env.TRANSCRIPT_ENCRYPTION_KEY || '', 'base64');
 if(key.length !== 32) throw new Error('TRANSCRIPT_ENCRYPTION_KEY must be 32 random bytes encoded as base64');
 return key;
}
function encrypt(text) {
 const iv=crypto.randomBytes(12); const cipher=crypto.createCipheriv('aes-256-gcm',encryptionKey(),iv);
 return [iv.toString('base64'),cipher.update(text,'utf8','base64')+cipher.final('base64'),cipher.getAuthTag().toString('base64')].join('.');
}
function decrypt(text) {
 const [iv,data,tag]=text.split('.'); const decipher=crypto.createDecipheriv('aes-256-gcm',encryptionKey(),Buffer.from(iv,'base64'));
 decipher.setAuthTag(Buffer.from(tag,'base64')); return decipher.update(data,'base64','utf8')+decipher.final('utf8');
}
async function limit(pool,key,max,seconds=60) {
 const bucket=Math.floor(Date.now()/1000/seconds);
 const {rows}=await pool.query(`INSERT INTO usage_buckets(key,bucket,used) VALUES($1,$2,1)
 ON CONFLICT(key,bucket) DO UPDATE SET used=usage_buckets.used+1 RETURNING used`,[key,bucket]);
 if(rows[0].used>max) {const error=tooMany('Quota reached. Try again after the current rate window.');error.retryAfter=seconds-(Math.floor(Date.now()/1000)%seconds);throw error;}
}
function createAccess(pool) {
 return async function access(req,organizationId,write=false) {
   if(!req.currentUser || req.currentUser.account_status!=='active') throw unauthorized();
   if(req.apiKey && (write || req.apiKey.organization_id!==organizationId)) throw forbidden();
   const {rows}=await pool.query(`SELECT o.*,m.role AS member_role FROM organizations o
    LEFT JOIN memberships m ON m.organization_id=o.id AND m.user_id=$2 WHERE o.id=$1`,[organizationId,req.currentUser.id]);
   const org=rows[0];
   const platformAccess=org?.kind==='saerbridge' && req.currentUser.role==='admin' && !req.apiKey;
   if(!org || (!platformAccess && (!org.member_role || (write && org.member_role==='viewer')))) throw forbidden();
   return org;
 };
}
function keyAuth(pool,usersRepo) {
 return async(req,_res,next)=>{try{
  const header=req.get('authorization'); if(!header) return next();
  if(!header.startsWith('Bearer nile_')) throw unauthorized();
  const {rows}=await pool.query('SELECT * FROM api_keys WHERE token_hash=$1 AND revoked_at IS NULL AND expires_at>now()',[hash(header.slice(7))]);
  if(!rows[0]) throw unauthorized(); req.apiKey=rows[0]; req.currentUser=await usersRepo.findById(rows[0].user_id);
  if(req.currentUser?.account_status!=='active') throw unauthorized();
  await limit(pool,`key:${rows[0].id}`,60); next();
 }catch(error){next(error);}};
}
module.exports={hash,encrypt,decrypt,limit,createAccess,keyAuth};
