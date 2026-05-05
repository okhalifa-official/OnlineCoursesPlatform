import { apiFetch } from "./apiClient";

export async function getCourses() {
  return apiFetch("/courses");
}

export async function getCourseById(id) {
  return apiFetch(`/courses/${id}`);
}

export async function createCourse(courseData) {
  return apiFetch("/courses", {
    method: "POST",
    body: JSON.stringify(courseData),
  });
}

export async function updateCourse(id, courseData) {
  return apiFetch(`/courses/${id}`, {
    method: "PUT",
    body: JSON.stringify(courseData),
  });
}

export async function deleteCourse(id) {
  return apiFetch(`/courses/${id}`, {
    method: "DELETE",
  });
}

export async function archiveCourse(id) {
  return apiFetch(`/courses/${id}/archive`, {
    method: "PATCH",
  });
}

export async function restoreCourse(id) {
  return apiFetch(`/courses/${id}/restore`, {
    method: "PATCH",
  });
}