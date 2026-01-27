import { Client } from "./types";

export const ADMIN_EMAILS = [
  'matos.almeida.flavio@gmail.com',
  'lucas.peixoto19@live.com'
];

export const MOCK_CLIENT: Client = {
  id: "1",
  name: "MARCOS OLIVEIRA SANTOS",
  cep: "01001-000",
  address: "Praça da Sé",
  neighborhood: "Sé",
  city: "São Paulo",
  state: "SP",
  number: "100",
  complement: "",
  status: 'active'
};

// Direct link to the map image used in the HTML
export const MAP_IMAGE_URL = "https://lh3.googleusercontent.com/aida-public/AB6AXuBvaODgQ66Q6OdobqyWX2UbKYo3SxOJ_9idbifjB-LparfpgeIBg7EY7UsjgSfWeoNReaQPF1ypCC2ElgFeCPWwO4wT8V-liDYOT7VGxokkujjAXzG5QJ6p5J1X2siWUOq1zZJMIq8f8mdkmji-1JgHvP48c7v840ppRrVzTKU-NanUfEhG2EHNNFJ1RqGc9Xf7eVJepeopFf1oz_xKBWSCqGD5aQmokm39Pxmrfa3ImIUqSLyWnUPlJGBSVFNep91xS1QdqaqeGKh8";

// Placeholder for the attached logo image. Replace with your actual image URL.
export const LOGO_URL = "https://www.dropbox.com/scl/fi/155w53953hbeekjzhomc4/NOVOLOGO.png?rlkey=l8bpq45hwu08b656mojxq7kro&raw=1";

export const SALES_DATA = [
  { name: 'Jan', value: 400 },
  { name: 'Fev', value: 300 },
  { name: 'Mar', value: 600 },
  { name: 'Abr', value: 800 },
  { name: 'Mai', value: 500 },
  { name: 'Jun', value: 900 },
];

export const CLIENT_GROWTH_DATA = [
  { name: 'Jan', value: 12 },
  { name: 'Fev', value: 18 },
  { name: 'Mar', value: 15 },
  { name: 'Abr', value: 25 },
  { name: 'Mai', value: 32 },
  { name: 'Jun', value: 40 },
  { name: 'Jul', value: 38 },
  { name: 'Ago', value: 45 },
  { name: 'Set', value: 52 },
  { name: 'Out', value: 60 },
  { name: 'Nov', value: 75 },
  { name: 'Dez', value: 90 },
];