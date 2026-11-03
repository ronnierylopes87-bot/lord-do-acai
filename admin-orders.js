const { createClient } = require("@supabase/supabase-js");
exports.handler = async () => {
  try { const db=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
    const {data,error}=await db.from("orders").select("id,customer_name,phone,address,total,payment_method,status,created_at,order_items(product_name,quantity,unit_price)").order("created_at",{ascending:false}).limit(100);
    if(error) throw error; return {statusCode:200,headers:{"Content-Type":"application/json"},body:JSON.stringify({orders:data||[]})};
  } catch(e){return {statusCode:500,body:JSON.stringify({error:e.message})};}
};