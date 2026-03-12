import { Link } from "react-router-dom";

export default function RestaurantList({ restaurants }) {
  return (
    <div className="row">
      {restaurants.map(r => (
        <div key={r.restauranteID} className="col-lg-4 col-md-6 mb-4">
          <div className="card h-100 shadow-sm rounded-4 border-0">
            <div className="card-body d-flex flex-column">
              <h5 className="card-title fw-bold">{r.restaurante}</h5>
              <p className="card-text text-muted mb-3">Barrio: {r.barrio}</p>
              <Link to={`/restaurant/${r.restauranteID}`} className="btn btn-primary mt-auto">
                Ver Restaurante
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}