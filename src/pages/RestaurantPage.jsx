// src/pages/RestaurantPage.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getDishes, getOrders, getCustomers, getRestaurants } from "../services/api";

export default function RestaurantPage() {
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [dishes, setDishes] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getRestaurants(),
      getDishes(),
      getOrders(),
      getCustomers()
    ])
      .then(([restaurantsData, dishesData, ordersData, customersData]) => {
        // Restaurante seleccionado
        const foundRestaurant = restaurantsData.find(
          r => r.restauranteID === parseInt(id)
        );
        setRestaurant(foundRestaurant);

        // Filtrar platos por restauranteID
        setDishes(dishesData.filter(d => d.restauranteID === parseInt(id)));

        // Filtrar pedidos por restauranteID
        const filteredOrders = ordersData.filter(o => o.restauranteID === parseInt(id));
        setOrders(filteredOrders);

        // Guardamos clientes
        setCustomers(customersData);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="text-center my-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return <p className="text-center text-danger mt-5">Restaurante no encontrado</p>;
  }

  // Mapa de clientes usando clienteID y nombre completo
  const customersMap = {};
  customers.forEach(c => {
    customersMap[c.clienteID] = `${c.nombre} ${c.apellido1} ${c.apellido2}`;
  });

  return (
    <div className="container my-4">
      <h1 className="mb-2 text-primary">{restaurant.restaurante}</h1>
      <p className="text-muted mb-4">Barrio: {restaurant.barrio}</p>

      <h3 className="mt-4 mb-3 text-primary">Platos</h3>
      {dishes.length === 0 ? (
        <p>No hay platos disponibles</p>
      ) : (
        <ul className="list-group mb-5">
          {dishes.map(d => (
            <li
              key={d.platoID}
              className="list-group-item d-flex justify-content-between align-items-center"
            >
              {d.plato}
              <span className="badge bg-success rounded-pill">${d.precio}</span>
            </li>
          ))}
        </ul>
      )}

      <h3 className="mt-4 mb-3 text-primary">Pedidos</h3>
      {orders.length === 0 ? (
        <p>No hay pedidos realizados</p>
      ) : (
        <table className="table table-striped table-hover">
          <thead className="table-dark">
            <tr>
              <th>Pedido</th>
              <th>Cliente</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(o => (
              <tr key={o.pedidoID}>
                <td>{o.pedidoID}</td>
                <td>{customersMap[o.clienteID] || "Desconocido"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}