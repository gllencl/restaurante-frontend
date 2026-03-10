import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-lg mb-4">
      <div className="container">
        <Link className="navbar-brand fw-bold" to="/">🍴 Restaurantes</Link>
      </div>
    </nav>
  );
}