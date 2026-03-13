const API_URL = import.meta.env.VITE_API_URL || "http://51.210.22.156:4000";

export const getRestaurants = async () => {
  const res = await fetch(`${API_URL}/restaurants`);
  return res.json();
};

export const getDishes = async () => {
  const res = await fetch(`${API_URL}/dishes`);
  return res.json();
};

export const getOrders = async () => {
  const res = await fetch(`${API_URL}/orders`);
  return res.json();
};

export const getCustomers = async () => {
  const res = await fetch(`${API_URL}/customers`);
  return res.json();
};
