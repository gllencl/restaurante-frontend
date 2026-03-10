const API_URL = "http://localhost:4000";

export const getRestaurants = async () => {
  const res = await fetch(`${API_URL}/restaurants`);
  return res.json();
};

export const getDishes = async () => {
  const res = await fetch(`${API_URL}/dishes`);
  const data = await res.json();
  console.log(data);
  return data;
};

export const getOrders = async () => {
  const res = await fetch(`${API_URL}/orders`);
  return res.json();
};

export const getCustomers = async () => {
  const res = await fetch(`${API_URL}/customers`);
  return res.json();
};