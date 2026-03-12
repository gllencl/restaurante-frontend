import { useEffect, useState } from "react";
import RestaurantList from "../components/RestaurantList";
import { getRestaurants } from "../services/api";
import "./Home.css"; // Nuevo CSS específico para Home

export default function Home() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRestaurants()
      .then((data) => setRestaurants(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="text-center my-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <section className="home-banner text-center d-flex align-items-center justify-content-center">
        <div className="banner-text">
          <h1>Nuestros Restaurantes</h1>
          <p>Descubre los mejores platos y menús de nuestra ciudad</p>
        </div>
      </section>

      <div className="container my-5">
        <RestaurantList restaurants={restaurants} />
      </div>
    </div>
  );
}