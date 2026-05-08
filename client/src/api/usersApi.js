import { adminFetch } from "./apiClient";

export async function getUsers() {
  return adminFetch("/users");
}

export async function getUserById(id) {
  return adminFetch(`/users/${id}`);
}

export async function createUser(userData) {
  return adminFetch("/users", {
    method: "POST",
    body: JSON.stringify(userData),
  });
}

export async function updateUser(id, userData) {
  return adminFetch(`/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(userData),
  });
}

export async function deleteUser(id) {
  return adminFetch(`/users/${id}`, {
    method: "DELETE",
  });
}

export async function getPendingInstructors() {
  return adminFetch("/users/pending-instructors");
}

export async function approveInstructor(id) {
  return adminFetch(`/users/${id}/approve-instructor`, {
    method: "PATCH",
  });
}

export async function rejectInstructor(id) {
  return adminFetch(`/users/${id}/reject-instructor`, {
    method: "PATCH",
  });
}