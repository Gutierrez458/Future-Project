CREATE OR REPLACE FUNCTION ventas_por_producto(limit_items integer)
RETURNS TABLE(
  nombre_producto text,
  cantidad_total_vendida bigint,
  monto_total_generado numeric
)
LANGUAGE sql
AS $$
SELECT
  p.nombre AS nombre_producto,
  SUM(pi.quantity) AS cantidad_total_vendida,
  SUM(pi.quantity * COALESCE(pi.unit_price, 0)) AS monto_total_generado
FROM purchase_item pi
JOIN product p ON p.id = pi.product_id
GROUP BY p.nombre
ORDER BY cantidad_total_vendida DESC
LIMIT limit_items;
$$;
