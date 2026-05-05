import { useState, useEffect } from 'react';
import axios from 'axios';

const Page = () => {
    
  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    quantity: '',
  });

  useEffect(() => {
    fetchProducts();
  }, []);
const alertdata = ()=>
{
    alert("Hello")
}
  const fetchProducts = async () => {
    try {
      const response = await axios.get("http://localhost:4000/products/get");
      setProducts(response.data.data);
    } catch (error) {
      console.error(error);
    }
  };
  const addProduct = async () => {
    try {
      const response = await axios.post("http://localhost:4000/products/create", newProduct);
      setProducts([...products, response.data]);
      setNewProduct({ name: '', description: '', price: '', quantity: '' });
    } catch (error) {
      console.error(error);
    }
  };
  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewProduct({
      ...newProduct,
      [name]: value,
    });
  };
  return (
    <div className="bg-gray-800 min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-3xl text-center font-bold text-white mb-4">Product CRUD App</h1>
      <div className="w-full max-w-md p-4 rounded shadow-lg bg-white mb-4">
        <input
          type="text"
          name="name"
          value={newProduct.name}
          onChange={handleChange}
          placeholder="Name"
          className="w-full p-2 mb-2 border border-gray-300 rounded focus:outline-none focus:border-blue-800"
        />
        <input
          type="text"
          name="description"
          value={newProduct.description}
          onChange={handleChange}
          placeholder="Description"
          className="w-full p-2 mb-2 border border-gray-300 rounded focus:outline-none focus:border-blue-800"
        />
        <input
          type="number"
          name="price"
          value={newProduct.price}
          onChange={handleChange}
          placeholder="Price"
          className="w-full p-2 mb-2 border border-gray-300 rounded focus:outline-none focus:border-blue-800"
        />
        <input
          type="number"
          name="quantity"
          value={newProduct.quantity}
          onChange={handleChange}
          placeholder="Quantity"
          className="w-full p-2 mb-2 border border-gray-300 rounded focus:outline-none focus:border-blue-800"
        />
        <button onClick={addProduct} className="w-full bg-black text-white py-2 rounded hover:bg-gray-700 mt-2">Add Product</button>
      </div>
      <div className="overflow-x-auto">
            <table className="w-full max-w-3xl bg-white shadow-lg rounded-lg overflow-hidden">
            <thead className="bg-black text-white">
                <tr>
                <th className="py-3 px-6 text-left">ID</th>
                    <th className="py-3 px-6 text-left">Name</th>
                    <th className="py-3 px-6 text-left">Description</th>
                    <th className="py-3 px-6 text-left">Price</th>
                    <th className="py-3 px-6 text-left">Quantity</th>
                    <th className="py-3 px-6 text-left">Action</th>
                </tr>
                </thead>
                <tbody>
                {products.map((product) => (
                <tr key={product._id} className="border-b border-gray-200">
                    <td className="py-4 px-6">{product._id}</td>
                    <td className="py-4 px-6">{product.name}</td>
                    <td className="py-4 px-6">{product.description}</td>
                    <td className="py-4 px-6">{product.price}</td>
                    <td className="py-4 px-6">{product.quantity}</td>
                <td> <button onClick={alertdata} className='text-white bg-black'> View </button>

                </td>
                </tr>
                ))}
                </tbody>
            </table>
        </div>
    </div>
  );

};

export default Page;