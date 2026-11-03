const { createClient } = require("@supabase/supabase-js");
exports.handler = async () => {
  try {
    const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const { data, error } = await db.from("products").select("id,name,price").eq("active", true).order("name");
    if (error) throw error;
    return { statusCode: 200, headers: {"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}, body: JSON.stringify({products:data||[]}) };
  } catch (e) { return { statusCode: 500, body: JSON.stringify({error:e.message}) }; }
};