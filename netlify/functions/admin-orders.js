const { createClient } = require("@supabase/supabase-js");

exports.handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Método não permitido" })
    };
  }

  try {
    const db = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const token = (event.headers.authorization || "").replace(/^Bearer\s+/i, "");

    if (!token) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "Acesso não autorizado" })
      };
    }

    const { data: auth, error: authError } = await db.auth.getUser(token);

    if (
      authError ||
      !auth.user ||
      auth.user.email !== process.env.ADMIN_EMAIL
    ) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: "Acesso permitido somente ao administrador" })
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
      body: JSON.stringify({ error: "Erro ao consultar pedidos" })
    };
  }
};
