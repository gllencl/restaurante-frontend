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
    // Cargar restaurante
    getRestaurants()
      .then(data => setRestaurant(data.find(r => r.restauranteID === parseInt(id))));

    // Cargar platos
    getDishes()
      .then(data => setDishes(data.filter(d => d.restauranteID === parseInt(id))));

    // Cargar pedidos
    getOrders()
      .then(data => setOrders(data));

    // Cargar clientes
    getCustomers()
      .then(setCustomers)
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

  // Filtrar pedidos solo de este restaurante
  const filteredOrders = orders.filter(o => o.restauranteID === restaurant.restauranteID);

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
              className="list-group-item d-flex justify-content-between align-items-start flex-column flex-md-row"
            >
              <div>
                <strong>{d.plato}</strong>
                {d.descripcion && (
                  <div className="text-muted small">{d.descripcion}</div>
                )}
              </div>
              <span className="badge bg-success rounded-pill mt-2 mt-md-0">${d.precio}</span>
            </li>
          ))}
        </ul>
      )}

      <h3 className="mt-4 mb-3 text-primary">Pedidos</h3>
      {filteredOrders.length === 0 ? (
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
            {filteredOrders.map(o => {
              const customer = customers.find(c => c.clienteID === o.clienteID);
              return (
                <tr key={o.pedidoID}>
                  <td>{o.pedidoID}</td>
                  <td>{customer ? `${customer.nombre} ${customer.apellido1}` : "Desconocido"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}