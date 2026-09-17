import { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [products, setProducts] = useState([
    {
      code: "P001",
      name: "Kitty Hoodie",
      price: 70000,
      qty: 1,
    },
    {
      code: "P002",
      name: "Black Long Cardigan",
      price: 80000,
      qty: 1,
    },
  ]);

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    price: 0,
    qty: 0,
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [editIndex, setEditIndex] = useState(null);

  return (
    <>
      <h1> Myanmar Knitting Store </h1>
    </>
  );
}

export default App;
