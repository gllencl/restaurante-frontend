import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  getDishes,
  getOrders,
  getCustomers,
  getRestaurants,
  getOrderDishes,
  getCategories,
} from "../services/api";
import * as XLSX from "xlsx";
import "./RestaurantPage.css";

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
    setLoading(true);
    setError("");

    Promise.all([getRestaurants(), getDishes(), getOrders(), getCustomers()])
      .then(([restaurantsData, dishesData, ordersData, customersData]) => {
        const selected = restaurantsData.find(
          (r) => r.restauranteID === restaurantId
        );
        setRestaurant(selected || null);
        setDishes(dishesData.filter((d) => d.restauranteID === restaurantId));
        setOrders(ordersData);
        setCustomers(customersData);

        return ordersData
          .filter((o) => o.restauranteID === restaurantId)
          .map((o) => o.pedidoID);
      })
      .then((orderIds) => {
        if (!orderIds.length) {
          setOrderDishesById(new Map());
          return null;
        }
        return Promise.all(
          orderIds.map((orderId) =>
            getOrderDishes(orderId)
              .then((items) => [orderId, items])
              .catch(() => [orderId, []])
          )
        ).then((entries) => {
          setOrderDishesById(new Map(entries));
        });
      })
      .catch(() => setError("No se pudieron cargar los datos del restaurante."))
      .finally(() => setLoading(false));

    getCategories()
      .then((categoriesData) => setCategories(categoriesData))
      .catch(() => setCategories([]));
  }, [id]);

  const customersById = useMemo(
    () => new Map(customers.map((c) => [c.clienteID, c])),
    [customers]
  );
  const dishesById = useMemo(
    () => new Map(dishes.map((d) => [d.platoID, d])),
    [dishes]
  );
  const categoriesById = useMemo(
    () => new Map(categories.map((c) => [c.categoriaID, c])),
    [categories]
  );

  const groupedDishes = useMemo(() => {
    const categoryOrder = [
      "Tapas y raciones",
      "Entrantes",
      "Pizzas",
      "Carnes",
      "Pescados",
      "Postres",
    ];
    const normalizeCategoryName = (name) => {
      if (name === "Platos internacionales") return "Pizzas";
      return name;
    };
    const groups = dishes.reduce((acc, dish) => {
      const category = categoriesById.get(dish.categoriaID);
      const key = normalizeCategoryName(category?.categoria ?? "Sin categoria");
      if (!acc[key]) acc[key] = [];
      acc[key].push(dish);
      return acc;
    }, {});

    return Object.entries(groups)
      .map(([category, items]) => ({
        category,
        items: items.sort((a, b) => a.plato.localeCompare(b.plato)),
      }))
      .sort((a, b) => {
        const indexA = categoryOrder.indexOf(a.category);
        const indexB = categoryOrder.indexOf(b.category);
        const inOrderA = indexA !== -1;
        const inOrderB = indexB !== -1;
        if (inOrderA && inOrderB) return indexA - indexB;
        if (inOrderA) return -1;
        if (inOrderB) return 1;
        return a.category.localeCompare(b.category);
      });
  }, [dishes, categoriesById]);

  if (loading) {
    return (
      <div className="text-center my-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return <p className="text-center text-danger mt-5">{error}</p>;
  }

  if (!restaurant) {
    return <p className="text-center text-danger mt-5">Restaurante no encontrado</p>;
  }

  const formatCurrency = (value) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return null;
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 2,
    }).format(numeric);
  };

  const normalizeDish = (value) => {
    if (value == null) return null;
    if (typeof value === "number") {
      return (
        dishesById.get(value) || {
          platoID: value,
          plato: `Plato #${value}`,
          precio: null,
          missing: true,
        }
      );
    }
    if (typeof value === "string") {
      return { plato: value, precio: null, missing: true };
    }
    if (typeof value === "object") {
      const platoId = value.platoID ?? value.id;
      return {
        platoID: platoId,
        plato: value.plato || value.nombre || value.name || (platoId ? `Plato #${platoId}` : "Plato"),
        precio: value.precio ?? value.price ?? null,
        missing: !value.plato && !value.nombre && !value.name,
      };
    }
    return null;
  };

  const normalizeOrderItem = (item) => {
    if (!item) return null;
    const quantity = Number(item.cantidad ?? item.quantity ?? 1);
    const dishFromMenu =
      item.platoID != null ? dishesById.get(item.platoID) : null;
    const dishRef =
      dishFromMenu ??
      (item.platoID != null || item.plato || item.dish
        ? normalizeDish(item.platoID ?? item.plato ?? item.dish)
        : normalizeDish(item));
    if (!dishRef) return null;
    return {
      ...dishRef,
      cantidad: Number.isFinite(quantity) ? quantity : 1,
    };
  };

  const getOrderDishesList = (order) => {
    if (!order) return [];
    const linkedItems = orderDishesById.get(order.pedidoID);
    if (Array.isArray(linkedItems) && linkedItems.length > 0) {
      return linkedItems.map(normalizeOrderItem).filter(Boolean);
    }
    if (Array.isArray(order.platos))
      return order.platos.map(normalizeOrderItem).filter(Boolean);
    if (Array.isArray(order.dishes))
      return order.dishes.map(normalizeOrderItem).filter(Boolean);
    if (Array.isArray(order.platoIDs))
      return order.platoIDs.map(normalizeOrderItem).filter(Boolean);
    if (order.platoID != null)
      return [normalizeOrderItem(order.platoID)].filter(Boolean);
    if (order.plato) return [normalizeOrderItem(order.plato)].filter(Boolean);
    return [];
  };

  const parseOrderDate = (value) => {
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const isWithinDateRange = (orderDate) => {
    if (!orderDate) return false;
    if (dateFrom) {
      const from = new Date(`${dateFrom}T00:00:00`);
      if (orderDate < from) return false;
    }
    if (dateTo) {
      const to = new Date(`${dateTo}T23:59:59`);
      if (orderDate > to) return false;
    }
    return true;
  };

  // Filtrar pedidos solo de este restaurante
  const restaurantOrders = orders.filter((o) => o.restauranteID === restaurantId);
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredOrders = restaurantOrders.filter((order) => {
    const orderDate = parseOrderDate(order.fecha);
    if (dateFrom || dateTo) {
      if (!isWithinDateRange(orderDate)) return false;
    }
    if (!normalizedSearch) return true;
    const customer = customersById.get(order.clienteID);
    const customerName = customer
      ? `${customer.nombre} ${customer.apellido1 ?? ""} ${customer.apellido2 ?? ""}`.trim()
      : "";
    const matchesCustomer = customerName.toLowerCase().includes(normalizedSearch);
    const matchesOrderId = String(order.pedidoID ?? "").includes(normalizedSearch);
    const matchesDish = getOrderDishesList(order).some((dish) =>
      String(dish.plato ?? "").toLowerCase().includes(normalizedSearch)
    );
    return matchesCustomer || matchesOrderId || matchesDish;
  });

  const getOrderTotal = (order) => {
    const orderDishes = getOrderDishesList(order);
    if (!orderDishes.length) return 0;
    return orderDishes.reduce((acc, dish) => {
      const numeric = Number(dish?.precio);
      const qty = Number(dish?.cantidad ?? 1);
      const lineTotal = Number.isFinite(numeric)
        ? numeric * (Number.isFinite(qty) ? qty : 1)
        : 0;
      return acc + lineTotal;
    }, 0);
  };

  const highlightMatch = (text) => {
    const value = String(text ?? "");
    if (!normalizedSearch) return value;
    const safeSearch = normalizedSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${safeSearch})`, "ig");
    const parts = value.split(regex);
    return parts.map((part, index) =>
      part.toLowerCase() === normalizedSearch ? (
        <mark key={`${value}-${index}`}>{part}</mark>
      ) : (
        part
      )
    );
  };

  const groupedOrders = filteredOrders.reduce((acc, order) => {
    const key = order.clienteID ?? "unknown";
    if (!acc[key]) acc[key] = [];
    acc[key].push(order);
    return acc;
  }, {});

  const orderGroups = Object.entries(groupedOrders)
    .map(([key, list]) => {
      const customer = customersById.get(Number(key)) || null;
      return {
        key,
        customer,
        orders: list.sort((a, b) => (a.pedidoID ?? 0) - (b.pedidoID ?? 0)),
      };
    })
    .sort((a, b) => {
      const nameA = a.customer
        ? `${a.customer.nombre} ${a.customer.apellido1 ?? ""}`.trim()
        : "Cliente desconocido";
      const nameB = b.customer
        ? `${b.customer.nombre} ${b.customer.apellido1 ?? ""}`.trim()
        : "Cliente desconocido";
      const totalA = a.orders.reduce((acc, order) => acc + getOrderTotal(order), 0);
      const totalB = b.orders.reduce((acc, order) => acc + getOrderTotal(order), 0);
      const countA = a.orders.length;
      const countB = b.orders.length;

      if (sortBy === "total") return totalB - totalA;
      if (sortBy === "orders") return countB - countA;
      return nameA.localeCompare(nameB);
    });

  const uniqueCustomers = new Set(
    filteredOrders.map((o) => o.clienteID).filter((idValue) => idValue != null)
  );

  const handleExportExcel = () => {
    const rows = [];

    filteredOrders.forEach((order) => {
      const customer = customersById.get(order.clienteID);
      const customerName = customer
        ? `${customer.nombre} ${customer.apellido1 ?? ""} ${customer.apellido2 ?? ""}`.trim()
        : "Desconocido";
      const orderDate = order.fecha
        ? new Date(order.fecha).toLocaleDateString("es-ES")
        : "";
      const orderTotal = getOrderTotal(order);
      const orderDishes = getOrderDishesList(order);

      if (orderDishes.length === 0) {
        rows.push({
          pedidoID: order.pedidoID ?? "",
          cliente: customerName,
          fecha: orderDate,
          plato: "",
          cantidad: "",
          precio: "",
          totalPedido: formatCurrency(orderTotal) ?? orderTotal,
        });
        return;
      }

      orderDishes.forEach((dish) => {
        rows.push({
          pedidoID: order.pedidoID ?? "",
          cliente: customerName,
          fecha: orderDate,
          plato: dish.plato,
          cantidad: dish.cantidad ?? 1,
          precio: formatCurrency(dish.precio) ?? dish.precio ?? "",
          totalPedido: formatCurrency(orderTotal) ?? orderTotal,
        });
      });
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Pedidos");
    XLSX.writeFile(workbook, `pedidos_restaurante_${restaurantId}.xlsx`);
  };

  return (
    <div className="container my-4">
      <div className="restaurant-header mb-4">
        <div>
          <h1 className="mb-1 text-primary">{restaurant.restaurante}</h1>
          <p className="text-muted mb-0">Barrio: {restaurant.barrio}</p>
        </div>
        <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
          Restaurante #{restaurant.restauranteID}
        </span>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="stat-card">
            <div className="stat-label">Platos disponibles</div>
            <div className="stat-value">{dishes.length}</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-card">
            <div className="stat-label">Pedidos filtrados</div>
            <div className="stat-value">{filteredOrders.length}</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-card">
            <div className="stat-label">Clientes activos</div>
            <div className="stat-value">{uniqueCustomers.size}</div>
          </div>
        </div>
      </div>

      <div className="section-header">
        <h3 className="mt-4 mb-3 text-primary">Platos</h3>
        <button
          className="section-toggle"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#dishesSection"
          aria-expanded="true"
          aria-controls="dishesSection"
        >
          <span className="section-chevron" aria-hidden="true"></span>
        </button>
      </div>
      <div className="collapse show" id="dishesSection">
        {dishes.length === 0 ? (
          <p>No hay platos disponibles</p>
        ) : (
          <div className="mb-5">
            {groupedDishes.map((group) => (
              <div key={group.category} className="dish-group">
                <h4 className="dish-group-title">{group.category}</h4>
                <div className="dishes-grid">
                  {group.items.map((d) => (
                    <div key={d.platoID} className="dish-card">
                      <div className="dish-header">
                        <h5 className="dish-name">{d.plato}</h5>
                        <span className="dish-price">
                          {formatCurrency(d.precio) ?? d.precio}
                        </span>
                      </div>
                      {d.descripcion && (
                        <p className="dish-desc">{d.descripcion}</p>
                      )}
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
        <button
          className="section-toggle"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#ordersSection"
          aria-expanded="true"
          aria-controls="ordersSection"
        >
          <span className="section-chevron" aria-hidden="true"></span>
        </button>
      </div>
      <div className="collapse show" id="ordersSection">
        {restaurantOrders.length === 0 ? (
          <p>No hay pedidos realizados</p>
        ) : (
          <>
          <div className="row g-3 mb-3">
            <div className="col-lg-4">
              <label className="form-label">Buscar cliente o pedido</label>
              <input
                type="text"
                className="form-control"
                placeholder="Ej: Ana, 73..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
              <div className="form-hint">Busca por cliente, pedido o plato</div>
            </div>
            <div className="col-lg-2 col-md-6">
              <label className="form-label">Desde</label>
              <input
                type="date"
                className="form-control"
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
              />
            </div>
            <div className="col-lg-2 col-md-6">
              <label className="form-label">Hasta</label>
              <input
                type="date"
                className="form-control"
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
              />
            </div>
            <div className="col-lg-2 col-md-6">
              <label className="form-label">Ordenar por</label>
              <select
                className="form-select"
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
              >
                <option value="name">Nombre</option>
                <option value="total">Gasto total</option>
                <option value="orders">Nº pedidos</option>
              </select>
            </div>
            <div className="col-lg-2">
              <label className="form-label invisible">Acciones</label>
              <button
                type="button"
                className="btn btn-outline-secondary btn-xs w-100"
                onClick={() => {
                  setSearchTerm("");
                  setDateFrom("");
                  setDateTo("");
                  setSortBy("name");
                }}
              >
                Limpiar
              </button>
              <button
                type="button"
                className="btn btn-outline-primary btn-xs w-100 mt-2"
                onClick={handleExportExcel}
                disabled={filteredOrders.length === 0}
              >
                Exportar Excel
              </button>
            </div>
          </div>
          {filteredOrders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">i</div>
              <div className="empty-title">Sin resultados</div>
              <div className="empty-text">
                No hay pedidos que coincidan con la búsqueda o el rango de fechas.
              </div>
            </div>
          ) : (
            <div className="orders-grid">
              {orderGroups.map((group, index) => {
                const customerName = group.customer
                  ? `${group.customer.nombre} ${group.customer.apellido1 ?? ""}`.trim()
                  : "Cliente desconocido";
                const collapseId = `collapse-${group.key}-${index}`;
                const groupTotal = group.orders.reduce(
                  (acc, order) => acc + getOrderTotal(order),
                  0
                );
                const groupOrdersWithItems = group.orders.filter(
                  (order) => getOrderTotal(order) > 0
                ).length;
                const groupAverage =
                  groupOrdersWithItems > 0 ? groupTotal / groupOrdersWithItems : 0;

                return (
                  <div key={group.key} className="order-card">
                    <button
                      className="order-card-toggle"
                      type="button"
                      data-bs-toggle="collapse"
                      data-bs-target={`#${collapseId}`}
                      aria-expanded="false"
                      aria-controls={collapseId}
                    >
                      <div className="order-card-header">
                        <div>
                          <h5 className="mb-1">{highlightMatch(customerName)}</h5>
                          <div className="text-muted small">
                            {group.orders.length} pedidos
                          </div>
                        </div>
                        <div className="order-card-meta">
                          {group.customer && (
                            <span className="badge bg-light text-dark border">
                              Cliente #{group.customer.clienteID}
                            </span>
                          )}
                          <span className="order-card-chevron" aria-hidden="true"></span>
                        </div>
                      </div>
                      <div className="order-summary">
                        <span>
                          Total cliente:{" "}
                          <strong>{formatCurrency(groupTotal) ?? groupTotal}</strong>
                        </span>
                        <span className="text-muted small">
                          Ticket medio: {formatCurrency(groupAverage) ?? groupAverage}
                        </span>
                      </div>
                    </button>
                    <div id={collapseId} className="collapse mt-3">
                      {group.orders.map((order, orderIndex) => {
                        const orderDishes = getOrderDishesList(order);
                        const orderTotal = orderDishes.reduce((acc, dish) => {
                          const numeric = Number(dish?.precio);
                          const qty = Number(dish?.cantidad ?? 1);
                          const lineTotal = Number.isFinite(numeric)
                            ? numeric * (Number.isFinite(qty) ? qty : 1)
                            : 0;
                          return acc + lineTotal;
                        }, 0);
                        const formattedTotal = formatCurrency(orderTotal);

                        return (
                          <div
                            key={order.pedidoID ?? `${group.key}-unknown`}
                            className="order-block"
                          >
                            <div className="order-title">
                              Pedido #{highlightMatch(order.pedidoID ?? "Sin ID")}
                              {order.fecha && (
                                <span className="text-muted small ms-2">
                                  {new Date(order.fecha).toLocaleDateString("es-ES")}
                                </span>
                              )}
                              <span className="badge bg-light text-dark border ms-2">
                                {orderDishes.length} platos
                              </span>
                              <span className="badge bg-primary-subtle text-primary border ms-2">
                                {formatCurrency(orderTotal) ?? orderTotal}
                              </span>
                            </div>
                            {orderDishes.length === 0 ? (
                              <div className="text-muted small">
                                Platos no disponibles para este pedido
                              </div>
                            ) : (
                              <div className="order-dishes">
                                {orderDishes.map((dish, index) => (
                                  <div
                                    key={`${order.pedidoID}-${dish.platoID ?? index}`}
                                    className="order-dish"
                                  >
                                    <span>{highlightMatch(dish.plato)}</span>
                                    <span className="text-muted">
                                      {dish.cantidad ? `${dish.cantidad} x ` : ""}
                                      {formatCurrency(dish.precio) ?? dish.precio ?? "-"}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                            {orderDishes.length > 0 && formattedTotal && (
                              <div className="order-total">
                                Total pedido: <strong>{formattedTotal}</strong>
                              </div>
                            )}
                            {orderIndex < group.orders.length - 1 && (
                              <div className="order-divider"></div>
                            )}
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
