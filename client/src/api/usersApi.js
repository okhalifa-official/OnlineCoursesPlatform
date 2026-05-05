import { apiFetch } from "./apiClient";

export async function getUsers() {
  return apiFetch("/users");
}

export async function getUserById(id) {
  return apiFetch(`/users/${id}`);
}

export async function createUser(userData) {
  return apiFetch("/users", {
    method: "POST",
    body: JSON.stringify(userData),
  });
}

export async function updateUser(id, userData) {
  return apiFetch(`/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(userData),
  });
}

export async function deleteUser(id) {
  return apiFetch(`/users/${id}`, {
    method: "DELETE",
  });
}

export async function getPendingInstructors() {
  return apiFetch("/users/pending-instructors");
}

export async function approveInstructor(id) {
  return apiFetch(`/users/${id}/approve-instructor`, {
    method: "PATCH",
  });
}

export async function rejectInstructor(id) {
  return apiFetch(`/users/${id}/reject-instructor`, {
    method: "PATCH",
  });
}