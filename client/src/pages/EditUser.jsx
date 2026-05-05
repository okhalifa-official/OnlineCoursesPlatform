import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import UserForm, { emptyUser } from "../components/UserForm";
import { getUserById, updateUser } from "../api/usersApi";

export default function EditUser() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState(emptyUser);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const user = await getUserById(id);

        setFormData({
          ...emptyUser,
          ...user,
          password: "",
          confirmPassword: "",
        });
      } catch (error) {
        alert(error.message);
        console.error("Load user error:", error.message);
      } finally {
        setPageLoading(false);
      }
    }

    loadUser();
  }, [id]);

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setLoading(true);

      const dataToSend = { ...formData };
      delete dataToSend.confirmPassword;
      delete dataToSend.password;

      await updateUser(id, dataToSend);

      navigate("/users");
    } catch (error) {
      alert(error.message);
      console.error("Update user error:", error.message);
    } finally {
      setLoading(false);
    }
  }

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-[#F2F2F2] flex items-center justify-center">
        <p className="font-bold">Loading user...</p>
      </div>
    );
  }

  return (
    <UserForm
      mode="edit"
      formData={formData}
      setFormData={setFormData}
      onSubmit={handleSubmit}
      loading={loading}
    />
  );
}