import type { IncomingMessage, ServerResponse } from 'http';
import { getAuthenticatedAdminFromRequest, sendJson } from '../_lib/adminAuthServer';
import { getSupabaseServerClient } from '../_lib/supabaseServer';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const admin=getAuthenticatedAdminFromRequest(req);
  if(!admin) return sendJson(res,401,{success:false,error:'Authentication required.'});
  if(req.method!=='GET') return sendJson(res,405,{success:false,error:'Method not allowed.'});
  const db=getSupabaseServerClient(true);
  if(!db) return sendJson(res,500,{success:false,error:'Supabase server configuration is missing.'});
  const {data,error}=await db.from('tool_favorites').select('tool_slug,created_at').gte('created_at',new Date(Date.now()-90*86400000).toISOString());
  if(error) return sendJson(res,500,{success:false,error:error.message});
  return sendJson(res,200,{success:true,favorites:data||[]});
}
