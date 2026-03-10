import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getDishes, getOrders, getCustomers } from "../services/api";

export default function RestaurantPage() {
  const { id } = useParams();
  const [dishes, setDishes] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    getDishes().then(data => setDishes(data.filter(d => d.restaurantId === parseInt(id))));
    getOrders().then(data => setOrders(data.filter(o => o.restaurantId === parseInt(id))));
    getCustomers().then(setCustomers);
  }, [id]);

  return (
    <div className="container my-4">
      <h1 className="mb-4 text-primary">Restaurante {id}</h1>

      <h3 className="mt-4 mb-3 text-primary">Platos</h3>
      <ul className="list-group mb-5">
        {dishes.map(d => (
          <li
            key={d.id}
            className="list-group-item d-flex justify-content-between align-items-center"
          >
            {d.name}
            <span className="badge bg-success rounded-pill">${d.price}</span>
          </li>
        ))}
      </ul>

      <h3 className="mt-4 mb-3 text-primary">Pedidos</h3>
      <table className="table table-striped table-hover">
        <thead className="table-dark">
          <tr>
            <th>Pedido</th>
            <th>Cliente</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(o => {
            const customer = customers.find(c => c.id === o.customerId);
            return (
              <tr key={o.id}>
                <td>{o.id}</td>
                <td>{customer ? customer.name : "Desconocido"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}