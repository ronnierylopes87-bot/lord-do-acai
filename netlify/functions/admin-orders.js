const { createClient } = require("@supabase/supabase-js");

const allowedStatuses = [
  "recebido",
  "preparando",
  "saiu_para_entrega",
  "entregue",
  "cancelado"
];

exports.handler = async (event) => {
  if (!["GET", "PATCH"].includes(event.httpMethod)) {
    return { statusCode: 405, body: JSON.stringify({ error: "Método não permitido" }) };
  }

  try {
    const db = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const headers = event.headers || {};
    const authHeader = headers.authorization || headers.Authorization || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");

    if (!token) {
      return { statusCode: 401, body: JSON.stringify({ error: "Acesso não autorizado" }) };
    }

    const { data: auth, error: authError } = await db.auth.getUser(token);
    if (
      authError ||
      !auth.user ||
      (auth.user.email || "").toLowerCase() !== (process.env.ADMIN_EMAIL || "").toLowerCase()
    ) {
      return { statusCode: 403, body: JSON.stringify({ error: "Acesso permitido somente ao administrador" }) };
    }

    if (event.httpMethod === "PATCH") {
      const input = JSON.parse(event.body || "{}");
      const orderId = input.order_id;
      const status = input.status;

      if (!orderId || !allowedStatuses.includes(status)) {
        return { statusCode: 400, body: JSON.stringify({ error: "Pedido ou status inválido" }) };
      }

      const { data, error } = await db
        .from("orders")
        .update({ status })
        .eq("id", orderId)
        .select("id,status")
        .single();

      if (error) throw error;

      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: data })
      };
    }

    const { data, error } = await db
      .from("orders")
      .select("id,customer_name,phone,address,total,payment_method,status,created_at,order_items(product_name,quantity,unit_price)")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orders: data || [] })
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Erro ao consultar ou atualizar pedidos" })
    };
  }
};
