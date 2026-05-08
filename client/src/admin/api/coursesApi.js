import { adminFetch } from "./apiClient";

export async function getCourses() {
  return adminFetch("/courses");
}

export async function getCourseById(id) {
  return adminFetch(`/courses/${id}`);
}

export async function createCourse(courseData) {
  return adminFetch("/courses", {
    method: "POST",
    body: JSON.stringify(courseData),
  });
}

export async function updateCourse(id, courseData) {
  return adminFetch(`/courses/${id}`, {
    method: "PUT",
    body: JSON.stringify(courseData),
  });
}

export async function deleteCourse(id) {
  return adminFetch(`/courses/${id}`, {
    method: "DELETE",
  });
}

export async function archiveCourse(id) {
  return adminFetch(`/courses/${id}/archive`, {
    method: "PATCH",
  });
}

export async function restoreCourse(id) {
  return adminFetch(`/courses/${id}/restore`, {
    method: "PATCH",
  });
}