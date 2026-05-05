import { useState } from "react";
import { useNavigate } from "react-router-dom";
import UserForm, { emptyUser } from "../components/UserForm";
import { createUser } from "../api/usersApi";

export default function AddUser() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(emptyUser);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert("Password and Confirm Password do not match");
      return;
    }

    try {
      setLoading(true);

      const dataToSend = { ...formData };
      delete dataToSend.confirmPassword;

      await createUser(dataToSend);

      navigate("/users");
    } catch (error) {
      alert(error.message);
      console.error("Create user error:", error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <UserForm
      mode="add"
      formData={formData}
      setFormData={setFormData}
      onSubmit={handleSubmit}
      loading={loading}
    />
  );
}