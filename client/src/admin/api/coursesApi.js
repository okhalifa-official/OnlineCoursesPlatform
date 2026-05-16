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

export async function getCourseStudents(id) {
  return adminFetch(`/courses/${id}/students`);
}

export async function resetExamAttempts(courseId, enrollmentId) {
  return adminFetch(
    `/courses/${courseId}/students/${enrollmentId}/reset-attempts`,
    { method: "PATCH" }
  );
}

export async function unenrollStudent(courseId, enrollmentId) {
  return adminFetch(`/courses/${courseId}/students/${enrollmentId}`, {
    method: "DELETE",
  });
}

export async function uploadStudentCertificate(courseId, enrollmentId, { name, mimeType, data }) {
  return adminFetch(`/courses/${courseId}/students/${enrollmentId}/certificate`, {
    method: "POST",
    body: JSON.stringify({ name, mimeType, data }),
  });
}

export async function removeStudentCertificate(courseId, enrollmentId) {
  return adminFetch(`/courses/${courseId}/students/${enrollmentId}/certificate`, {
    method: "DELETE",
  });
}