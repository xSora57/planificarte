// Pequeñas funciones para controlar la sesión

export function isAuthenticated() {
  return !!localStorage.getItem("token");
}

export function logout() {
  localStorage.removeItem("token");
}
