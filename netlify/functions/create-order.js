const { createClient } = require("@supabase/supabase-js");
exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: JSON.stringify({error:"Método não permitido"}) };
  try {
    const input = JSON.parse(event.body || "{}");
    if (!input.customer_name || !input.phone || !input.address || !input.payment_method || !Array.isArray(input.items) || !input.items.length) throw new Error("Preencha seus dados e adicione produtos.");
    const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const ids = [...new Set(input.items.map(x => x.product_id))];
    const { data: products, error: pe } = await db.from("products").select("id,name,price,active").in("id", ids).eq("active", true);
    if (pe) throw pe;
    const byId = new Map((products||[]).map(p => [String(p.id),p]));
    const items = input.items.map(x => { const p=byId.get(String(x.product_id)); const q=Number(x.quantity); if(!p || !Number.isInteger(q) || q<1 || q>50) throw new Error("Produto ou quantidade inválida."); return {product_id:p.id,product_name:p.name,quantity:q,unit_price:Number(p.price)}; });
    const total = items.reduce((s,x)=>s+x.quantity*x.unit_price,0);
    const { data: order, error: oe } = await db.from("orders").insert({customer_name:String(input.customer_name).trim(),phone:String(input.phone).trim(),address:String(input.address).trim(),total,payment_method:String(input.payment_method),status:" recebido " .trim()}).select("id").single();
    if (oe) throw oe;
    const rows=items.map(x=>({...x,order_id:order.id}));
    const { error: ie }=await db.from("order_items").insert(rows);
    if(ie){await db.from("orders").delete().eq("id",order.id);throw ie;}
    return {statusCode:201,headers:{"Content-Type":"application/json"},body:JSON.stringify({order_id:order.id,total})};
  } catch(e){return {statusCode:400,headers:{"Content-Type":"application/json"},body:JSON.stringify({error:e.message||"Erro ao criar pedido"})};}
};