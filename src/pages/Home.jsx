import { useEffect, useState } from "react";
import { getRestaurants } from "../services/api";
import RestaurantList from "../components/RestaurantList";

export default function Home() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRestaurants()
      .then((data) => setRestaurants(data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container my-4">
      <h1 className="mb-4 text-primary">Lista de Restaurantes</h1>

      {loading ? (
        <div className="text-center my-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      ) : (
        <RestaurantList restaurants={restaurants} />
      )}
    </div>
  );
}