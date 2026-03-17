import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { getDishes, getOrders, getCustomers, getRestaurants, getOrderDishes, getCategories } from "../services/api";
import * as XLSX from "xlsx";
import "./RestaurantPage.css";

const money = (v) => { const n = Number(v); return Number.isFinite(n) ? new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(n) : null; };
const lower = (v) => String(v ?? "").toLowerCase();
const parse = (v) => { if (!v) return null; const d = new Date(v); return Number.isNaN(d.getTime()) ? null : d; };
const mapBy = (arr, key) => new Map(arr.map((x) => [x[key], x]));

export default function RestaurantPage() {
  const { id } = useParams();
  const restaurantId = Number(id);
  const [restaurant, setRestaurant] = useState(null);
  const [dishes, setDishes] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orderDishesById, setOrderDishesById] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState("name");

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true); setError("");
      try {
        const [r, d, o, c] = await Promise.all([getRestaurants(), getDishes(), getOrders(), getCustomers()]);
        if (!alive) return;
        setRestaurant(r.find((x) => x.restauranteID === restaurantId) || null);
        setDishes(d.filter((x) => x.restauranteID === restaurantId));
        setOrders(o); setCustomers(c);
        const ids = o.filter((x) => x.restauranteID === restaurantId).map((x) => x.pedidoID);
        if (ids.length) {
          const entries = await Promise.all(ids.map((id) => getOrderDishes(id).then((items) => [id, items]).catch(() => [id, []])));
          if (alive) setOrderDishesById(new Map(entries));
        } else setOrderDishesById(new Map());
        const cats = await getCategories(); if (alive) setCategories(cats);
      } catch { if (alive) { setError("No se pudieron cargar los datos del restaurante."); setCategories([]); } }
      finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, [restaurantId]);

  const customersById = useMemo(() => mapBy(customers, "clienteID"), [customers]);
  const dishesById = useMemo(() => mapBy(dishes, "platoID"), [dishes]);
  const categoriesById = useMemo(() => mapBy(categories, "categoriaID"), [categories]);

  const normDish = (v) => {
    if (v == null) return null;
    if (typeof v === "number") return dishesById.get(v) || { platoID: v, plato: `Plato #${v}`, precio: null, missing: true };
    if (typeof v === "string") return { plato: v, precio: null, missing: true };
    if (typeof v === "object") {
      const id = v.platoID ?? v.id;
      return { platoID: id, plato: v.plato || v.nombre || v.name || (id ? `Plato #${id}` : "Plato"), precio: v.precio ?? v.price ?? null, missing: !v.plato && !v.nombre && !v.name };
    }
    return null;
  };
  const normItem = (i) => {
    if (!i) return null;
    const qty = Number(i.cantidad ?? i.quantity ?? 1);
    const dish = i.platoID != null ? dishesById.get(i.platoID) : null;
    const ref = dish ?? (i.platoID != null || i.plato || i.dish ? normDish(i.platoID ?? i.plato ?? i.dish) : normDish(i));
    if (!ref) return null;
    return { ...ref, cantidad: Number.isFinite(qty) ? qty : 1 };
  };
  const orderItems = (o) => {
    if (!o) return [];
    const linked = orderDishesById.get(o.pedidoID);
    if (Array.isArray(linked) && linked.length) return linked.map(normItem).filter(Boolean);
    if (Array.isArray(o.platos)) return o.platos.map(normItem).filter(Boolean);
    if (Array.isArray(o.dishes)) return o.dishes.map(normItem).filter(Boolean);
    if (Array.isArray(o.platoIDs)) return o.platoIDs.map(normItem).filter(Boolean);
    if (o.platoID != null) return [normItem(o.platoID)].filter(Boolean);
    if (o.plato) return [normItem(o.plato)].filter(Boolean);
    return [];
  };
  const orderTotal = (o) => orderItems(o).reduce((s, d) => s + (Number.isFinite(Number(d?.precio)) ? Number(d.precio) * (Number.isFinite(Number(d?.cantidad)) ? Number(d.cantidad) : 1) : 0), 0);

  const groupedDishes = useMemo(() => {
    const order = ["Tapas y raciones", "Entrantes", "Pizzas", "Carnes", "Pescados", "Postres"];
    const normCat = (n) => (n === "Platos internacionales" ? "Pizzas" : n);
    const groups = dishes.reduce((acc, dish) => {
      const cat = categoriesById.get(dish.categoriaID);
      const key = normCat(cat?.categoria ?? "Sin categoria");
      (acc[key] ??= []).push(dish);
      return acc;
    }, {});
    return Object.entries(groups)
      .map(([category, items]) => ({ category, items: items.sort((a, b) => a.plato.localeCompare(b.plato)) }))
      .sort((a, b) => {
        const ia = order.indexOf(a.category), ib = order.indexOf(b.category);
        if (ia !== -1 && ib !== -1) return ia - ib;
        if (ia !== -1) return -1; if (ib !== -1) return 1;
        return a.category.localeCompare(b.category);
      });
  }, [dishes, categoriesById]);

  const q = lower(searchTerm.trim());
  const restaurantOrders = orders.filter((o) => o.restauranteID === restaurantId);
  const filteredOrders = restaurantOrders.filter((o) => {
    const d = parse(o.fecha);
    if (dateFrom || dateTo) {
      if (!d) return false;
      if (dateFrom && d < new Date(`${dateFrom}T00:00:00`)) return false;
      if (dateTo && d > new Date(`${dateTo}T23:59:59`)) return false;
    }
    if (!q) return true;
    const c = customersById.get(o.clienteID);
    const name = c ? `${c.nombre} ${c.apellido1 ?? ""} ${c.apellido2 ?? ""}`.trim() : "";
    return lower(name).includes(q) || String(o.pedidoID ?? "").includes(q) || orderItems(o).some((d2) => lower(d2.plato).includes(q));
  });

  const orderGroups = Object.entries(filteredOrders.reduce((acc, o) => { (acc[o.clienteID ?? "unknown"] ??= []).push(o); return acc; }, {}))
    .map(([key, list]) => ({ key, customer: customersById.get(Number(key)) || null, orders: list.sort((a, b) => (a.pedidoID ?? 0) - (b.pedidoID ?? 0)) }))
    .sort((a, b) => {
      const nameA = a.customer ? `${a.customer.nombre} ${a.customer.apellido1 ?? ""}`.trim() : "Cliente desconocido";
      const nameB = b.customer ? `${b.customer.nombre} ${b.customer.apellido1 ?? ""}`.trim() : "Cliente desconocido";
      const totalA = a.orders.reduce((s, o) => s + orderTotal(o), 0);
      const totalB = b.orders.reduce((s, o) => s + orderTotal(o), 0);
      if (sortBy === "total") return totalB - totalA;
      if (sortBy === "orders") return b.orders.length - a.orders.length;
      return nameA.localeCompare(nameB);
    });

  const highlight = (t) => {
    const v = String(t ?? "");
    if (!q) return v;
    const safe = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(${safe})`, "ig");
    return v.split(re).map((p, i) => (lower(p) === q ? <mark key={`${v}-${i}`}>{p}</mark> : p));
  };

  const exportExcel = () => {
    const rows = [];
    filteredOrders.forEach((o) => {
      const c = customersById.get(o.clienteID);
      const name = c ? `${c.nombre} ${c.apellido1 ?? ""} ${c.apellido2 ?? ""}`.trim() : "Desconocido";
      const date = o.fecha ? new Date(o.fecha).toLocaleDateString("es-ES") : "";
      const total = orderTotal(o);
      const items = orderItems(o);
      if (!items.length) {
        rows.push({ pedidoID: o.pedidoID ?? "", cliente: name, fecha: date, plato: "", cantidad: "", precio: "", totalPedido: money(total) ?? total });
      } else {
        items.forEach((d) => rows.push({ pedidoID: o.pedidoID ?? "", cliente: name, fecha: date, plato: d.plato, cantidad: d.cantidad ?? 1, precio: money(d.precio) ?? d.precio ?? "", totalPedido: money(total) ?? total }));
      }
    });
    const ws = XLSX.utils.json_to_sheet(rows); const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pedidos");
    XLSX.writeFile(wb, `pedidos_restaurante_${restaurantId}.xlsx`);
  };

  if (loading) return (
    <div className="text-center my-5"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Cargando...</span></div></div>
  );
  if (error) return <p className="text-center text-danger mt-5">{error}</p>;
  if (!restaurant) return <p className="text-center text-danger mt-5">Restaurante no encontrado</p>;

  const stats = [
    { label: "Platos disponibles", value: dishes.length },
    { label: "Pedidos filtrados", value: filteredOrders.length },
    { label: "Clientes activos", value: new Set(filteredOrders.map((o) => o.clienteID).filter((x) => x != null)).size },
  ];

  return (
    <div className="container my-4">
      <div className="restaurant-header mb-4">
        <div>
          <h1 className="mb-1 text-primary">{restaurant.restaurante}</h1>
          <p className="text-muted mb-0">Barrio: {restaurant.barrio}</p>
        </div>
        <span className="badge bg-primary-subtle text-primary border border-primary-subtle">Restaurante #{restaurant.restauranteID}</span>
      </div>

      <div className="row g-3 mb-4">
        {stats.map((s) => (
          <div key={s.label} className="col-md-3">
            <div className="stat-card"><div className="stat-label">{s.label}</div><div className="stat-value">{s.value}</div></div>
          </div>
        ))}
      </div>

      <div className="section-header">
        <h3 className="mt-4 mb-3 text-primary">Platos</h3>
        <button className="section-toggle" type="button" data-bs-toggle="collapse" data-bs-target="#dishesSection" aria-expanded="true" aria-controls="dishesSection"><span className="section-chevron" aria-hidden="true"></span></button>
      </div>
      <div className="collapse show" id="dishesSection">
        {dishes.length === 0 ? (
          <p>No hay platos disponibles</p>
        ) : (
          <div className="mb-5">
            {groupedDishes.map((g) => (
              <div key={g.category} className="dish-group">
                <h4 className="dish-group-title">{g.category}</h4>
                <div className="dishes-grid">
                  {g.items.map((d) => (
                    <div key={d.platoID} className="dish-card">
                      <div className="dish-header">
                        <h5 className="dish-name">{d.plato}</h5>
                        <span className="dish-price">{money(d.precio) ?? d.precio}</span>
                      </div>
                      {d.descripcion && <p className="dish-desc">{d.descripcion}</p>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="section-header">
        <h3 className="mt-4 mb-3 text-primary">Pedidos por cliente</h3>
        <button className="section-toggle" type="button" data-bs-toggle="collapse" data-bs-target="#ordersSection" aria-expanded="true" aria-controls="ordersSection"><span className="section-chevron" aria-hidden="true"></span></button>
      </div>
      <div className="collapse show" id="ordersSection">
        {restaurantOrders.length === 0 ? (
          <p>No hay pedidos realizados</p>
        ) : (
          <>
            <div className="row g-3 mb-3">
              <div className="col-lg-4">
                <label className="form-label">Buscar cliente o pedido</label>
                <input type="text" className="form-control" placeholder="Ej: Ana, 73..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                <div className="form-hint">Busca por cliente, pedido o plato</div>
              </div>
              <div className="col-lg-2 col-md-6">
                <label className="form-label">Desde</label>
                <input type="date" className="form-control" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              </div>
              <div className="col-lg-2 col-md-6">
                <label className="form-label">Hasta</label>
                <input type="date" className="form-control" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </div>
              <div className="col-lg-2 col-md-6">
                <label className="form-label">Ordenar por</label>
                <select className="form-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="name">Nombre</option>
                  <option value="total">Gasto total</option>
                  <option value="orders">Nº pedidos</option>
                </select>
              </div>
              <div className="col-lg-2">
                <label className="form-label invisible">Acciones</label>
                <button type="button" className="btn btn-outline-secondary btn-xs w-100" onClick={() => { setSearchTerm(""); setDateFrom(""); setDateTo(""); setSortBy("name"); }}>Limpiar</button>
                <button type="button" className="btn btn-outline-primary btn-xs w-100 mt-2" onClick={exportExcel} disabled={filteredOrders.length === 0}>Exportar Excel</button>
              </div>
            </div>
            {filteredOrders.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">i</div>
                <div className="empty-title">Sin resultados</div>
                <div className="empty-text">No hay pedidos que coincidan con la búsqueda o el rango de fechas.</div>
              </div>
            ) : (
              <div className="orders-grid">
                {orderGroups.map((g, i) => {
                  const name = g.customer ? `${g.customer.nombre} ${g.customer.apellido1 ?? ""}`.trim() : "Cliente desconocido";
                  const idc = `collapse-${g.key}-${i}`;
                  const total = g.orders.reduce((s, o) => s + orderTotal(o), 0);
                  const withItems = g.orders.filter((o) => orderTotal(o) > 0).length;
                  const avg = withItems > 0 ? total / withItems : 0;
                  return (
                    <div key={g.key} className="order-card">
                      <button className="order-card-toggle" type="button" data-bs-toggle="collapse" data-bs-target={`#${idc}`} aria-expanded="false" aria-controls={idc}>
                        <div className="order-card-header">
                          <div>
                            <h5 className="mb-1">{highlight(name)}</h5>
                            <div className="text-muted small">{g.orders.length} pedidos</div>
                          </div>
                          <div className="order-card-meta">
                            {g.customer && <span className="badge bg-light text-dark border">Cliente #{g.customer.clienteID}</span>}
                            <span className="order-card-chevron" aria-hidden="true"></span>
                          </div>
                        </div>
                        <div className="order-summary">
                          <span>Total cliente: <strong>{money(total) ?? total}</strong></span>
                          <span className="text-muted small">Ticket medio: {money(avg) ?? avg}</span>
                        </div>
                      </button>
                      <div id={idc} className="collapse mt-3">
                        {g.orders.map((o, idx) => {
                          const items = orderItems(o);
                          const totalOrder = items.reduce((s, d) => s + (Number.isFinite(Number(d?.precio)) ? Number(d.precio) * (Number.isFinite(Number(d?.cantidad)) ? Number(d.cantidad) : 1) : 0), 0);
                          const totalFmt = money(totalOrder);
                          return (
                            <div key={o.pedidoID ?? `${g.key}-unknown`} className="order-block">
                              <div className="order-title">
                                Pedido #{highlight(o.pedidoID ?? "Sin ID")}
                                {o.fecha && <span className="text-muted small ms-2">{new Date(o.fecha).toLocaleDateString("es-ES")}</span>}
                                <span className="badge bg-light text-dark border ms-2">{items.length} platos</span>
                                <span className="badge bg-primary-subtle text-primary border ms-2">{money(totalOrder) ?? totalOrder}</span>
                              </div>
                              {items.length === 0 ? (
                                <div className="text-muted small">Platos no disponibles para este pedido</div>
                              ) : (
                                <div className="order-dishes">
                                  {items.map((d, j) => (
                                    <div key={`${o.pedidoID}-${d.platoID ?? j}`} className="order-dish">
                                      <span>{highlight(d.plato)}</span>
                                      <span className="text-muted">
                                        {d.cantidad ? `${d.cantidad} x ` : ""}{money(d.precio) ?? d.precio ?? "-"}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {items.length > 0 && totalFmt && <div className="order-total">Total pedido: <strong>{totalFmt}</strong></div>}
                              {idx < g.orders.length - 1 && <div className="order-divider"></div>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
