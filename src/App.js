import React, { useEffect, useState } from "react";
import axios from "axios";
import { Modal, Button, Form } from "react-bootstrap";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./App.css";


function App() {
  const [activeTab, setActiveTab] = useState("clients");
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [events, setEvents] = useState([]);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);

  const [newClient, setNewClient] = useState({ name: "", email: "", phone: "" });
  const [newProject, setNewProject] = useState({
    name: "",
    client_id: "",
    status: "En progreso",
    image: null,
  });
  const [newEvent, setNewEvent] = useState({ title: "", date: "", description: "" });
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Estados para autenticación
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [isLoggedIn, setIsLoggedIn] = useState(!!token);
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [showLoginModal, setShowLoginModal] = useState(!isLoggedIn);

  // Instancia de Axios con base URL (ajustada para incluir /api en las rutas)
const api = axios.create({ baseURL: ["http://localhost:5000", "http://192.168.0.145:5000"] });

  // Interceptor para agregar el token automáticamente
  api.interceptors.request.use(
    (config) => {
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Función para login local
  const handleLogin = async () => {
    try {
      const res = await axios.post("http://localhost:5000/api/login", loginData);
      const newToken = res.data.token;
      setToken(newToken);
      localStorage.setItem("token", newToken);
      setIsLoggedIn(true);
      setShowLoginModal(false);
      // Recargar datos después de login
      getClients();
      getProjects();
      getEvents();
    } catch (error) {
      alert("Error en login: " + (error.response?.data || "Credenciales inválidas"));
    }
  };

  // Función para login con Google
const handleGoogleLogin = () => {
  window.location.href = ["http://localhost:5000/auth/google", "http://192.168.0.145:5000/auth/google"];
};

  // Función para logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken("");
    setIsLoggedIn(false);
    setShowLoginModal(true);
  };

 // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get("token");
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
      localStorage.setItem("token", tokenFromUrl);
      setIsLoggedIn(true);
      setShowLoginModal(false);
      window.history.replaceState({}, document.title, window.location.pathname);
      getClients();
      getProjects();
      getEvents();
    }
  }, []);

  // Funciones para obtener datos (con try-catch para errores)
  const getClients = async () => {
    try {
      const res = await api.get("/api/clients");
      setClients(res.data);
    } catch (error) {
      console.error("Error al obtener clientes:", error);
    }
  };

  const getProjects = async () => {
    try {
      const res = await api.get("/api/projects");
      setProjects(res.data);
    } catch (error) {
      console.error("Error al obtener proyectos:", error);
    }
  };

  const getEvents = async () => {
    try {
      const res = await api.get("/api/events");
      setEvents(res.data);
    } catch (error) {
      console.error("Error al obtener eventos:", error);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (isLoggedIn) {
      getClients();
      getProjects();
      getEvents();
    }
  }, [isLoggedIn]);

  // Funciones para añadir elementos (usando 'api' con interceptor)
  const addClient = async () => {
    try {
      await api.post("/api/clients", newClient);
      setShowClientModal(false);
      setNewClient({ name: "", email: "", phone: "" });
      getClients();
    } catch (error) {
      console.error("Error al añadir cliente:", error);
    }
  };

  const addProject = async () => {
    try {
      const formData = new FormData();
      formData.append("name", newProject.name);
      formData.append("client_id", newProject.client_id);
      formData.append("status", newProject.status);
      if (newProject.image) formData.append("image", newProject.image);

      await api.post("/api/projects", formData);
      setShowProjectModal(false);
      setNewProject({ name: "", client_id: "", status: "En progreso", image: null });
      getProjects();
    } catch (error) {
      console.error("Error al añadir proyecto:", error);
    }
  };

  const addEvent = async () => {
    try {
      await api.post("/api/events", newEvent);
      setShowEventModal(false);
      setNewEvent({ title: "", date: "", description: "" });
      getEvents();
    } catch (error) {
      console.error("Error al añadir evento:", error);
    }
  };

  // Funciones para eliminar elementos (usando 'api' con interceptor)
  const deleteClient = async (id) => {
    try {
      await api.delete(`/api/clients/${id}`);
      getClients();
    } catch (error) {
      console.error("Error al eliminar cliente:", error);
    }
  };

  const deleteProject = async (id) => {
    try {
      await api.delete(`/api/projects/${id}`);
      getProjects();
    } catch (error) {
      console.error("Error al eliminar proyecto:", error);
    }
  };

  const deleteEvent = async (id) => {
    try {
      await api.delete(`/api/events/${id}`);
      getEvents();
    } catch (error) {
      console.error("Error al eliminar evento:", error);
    }
  };

  // Si no está logueado, muestra el modal de login
  if (!isLoggedIn) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Modal show={showLoginModal} onHide={() => {}} centered>
          <Modal.Header>
            <Modal.Title>Iniciar Sesión en PlanificArte</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Usuario</Form.Label>
                <Form.Control
                  value={loginData.username}
                  onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                  placeholder="Ingresa tu usuario"
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Contraseña</Form.Label>
                <Form.Control
                  type="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  placeholder="Ingresa tu contraseña"
                />
              </Form.Group>
            </Form>
            <div className="text-center">
              <Button variant="primary" onClick={handleLogin} className="me-2">
                Iniciar Sesión
              </Button>
              <Button variant="outline-danger" onClick={handleGoogleLogin}>
                <i className="bi bi-google me-2"></i>Iniciar con Google
              </Button>
            </div>
          </Modal.Body>
        </Modal>
      </div>
    );
  }

  return (
    <div>
      {/* Navbar con botón de logout */}
      <nav className="navbar navbar-dark bg-dark shadow">
        <div className="container d-flex justify-content-between">
          <span className="navbar-brand">🎨 PlanificArte</span>
          <Button variant="outline-light" onClick={handleLogout}>
            Cerrar Sesión
          </Button>
        </div>
      </nav>

      <div className="container mt-4">
        <h2>Bienvenido a PlanificArte 🎨</h2>
        <p className="text-muted">
          Administra tus clientes, proyectos y agenda artística.
        </p>

        {/* Tabs */}
        <ul className="nav nav-tabs">
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === "clients" ? "active" : ""}`}
              onClick={() => setActiveTab("clients")}
            >
              Clientes
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === "projects" ? "active" : ""}`}
              onClick={() => setActiveTab("projects")}
            >
              Proyectos
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === "calendar" ? "active" : ""}`}
              onClick={() => setActiveTab("calendar")}
            >
              Calendario
            </button>
          </li>
        </ul>

        <div className="tab-content mt-3">
          {/* CLIENTES */}
          {activeTab === "clients" && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h3>Clientes</h3>
                <Button onClick={() => setShowClientModal(true)}>+ Nuevo Cliente</Button>
              </div>

              <table className="table table-striped table-bordered">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Teléfono</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((c) => (
                    <tr key={c.id}>
                      <td>{c.name}</td>
                      <td>{c.email}</td>
                      <td>{c.phone}</td>
                      <td>
                        <Button variant="danger" size="sm" onClick={() => deleteClient(c.id)}>
                          Eliminar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* PROYECTOS */}
          {activeTab === "projects" && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h3>Proyectos</h3>
                <Button onClick={() => setShowProjectModal(true)}>+ Nuevo Proyecto</Button>
              </div>
              <div className="row">
                {projects.map((p) => (
                  <div className="col-md-4 mb-3" key={p.id}>
                    <div className="card shadow-sm">
                      {p.image && (
                        <img
                          src={`http://localhost:5000/uploads/${p.image}`}
                          className="card-img-top"
                          alt={p.name}
                          style={{ height: "180px", objectFit: "cover" }}
                        />
                      )}
                      <div className="card-body">
                        <h5 className="card-title">{p.name}</h5>
                        <p className="card-text text-muted">
                          Cliente: {p.client_name || "N/A"}
                        </p>
                        <p>
                          <span className="badge bg-info text-dark">{p.status}</span>
                        </p>
                        <Button variant="danger" size="sm" onClick={() => deleteProject(p.id)}>
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CALENDARIO */}
          {activeTab === "calendar" && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h3>Calendario</h3>
                <Button
                  onClick={() => {
                    setNewEvent({
                      ...newEvent,
                      date: selectedDate.toISOString().split("T")[0],
                    });
                    setShowEventModal(true);
                  }}
                >
                  + Nuevo Evento
                </Button>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <Calendar
                    onChange={setSelectedDate}
                    value={selectedDate}
                    className="shadow-sm rounded"
                  />
                </div>

                <div className="col-md-6">
                  <h5 className="mb-3">Eventos del día:</h5>
                  <ul className="list-group">
                    {events
                      .filter((e) => {
                        const eventDate = new Date(e.date).toISOString().split("T")[0];
                        const selected = selectedDate.toISOString().split("T")[0];
                        return eventDate === selected;
                      })
                      .map((e) => (
                        <li
                          key={e.id}
                          className="list-group-item d-flex justify-content-between align-items-center"
                        >
                          <div>
                            <strong>{e.title}</strong>
                            <br />
                            <small className="text-muted">{e.description}</small>
                          </div>
                          <Button variant="danger" size="sm" onClick={() => deleteEvent(e.id)}>
                            🗑
                          </Button>
                        </li>
                      ))}
                  </ul>
                </div>
              </div>

              {/* MODAL EVENTO */}
              <Modal show={showEventModal} onHide={() => setShowEventModal(false)}>
                <Modal.Header closeButton>
                  <Modal.Title>Agregar Evento</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  <Form>
                    <Form.Group>
                      <Form.Label>Título</Form.Label>
                      <Form.Control
                        value={newEvent.title}
                        onChange={(e) =>
                          setNewEvent({ ...newEvent, title: e.target.value })
                        }
                      />
                    </Form.Group>
                    <Form.Group>
                      <Form.Label>Fecha</Form.Label>
                      <Form.Control
                        type="date"
                        value={newEvent.date}
                        onChange={(e) =>
                          setNewEvent({ ...newEvent, date: e.target.value })
                        }
                      />
                    </Form.Group>
                    <Form.Group>
                      <Form.Label>Descripción</Form.Label>
                      <Form.Control
                        as="textarea"
                        value={newEvent.description}
                        onChange={(e) =>
                          setNewEvent({ ...newEvent, description: e.target.value })
                        }
                      />
                    </Form.Group>
                  </Form>
                </Modal.Body>
                <Modal.Footer>
                  <Button variant="secondary" onClick={() => setShowEventModal(false)}>
                    Cancelar
                  </Button>
                  <Button variant="primary" onClick={addEvent}>
                    Guardar
                  </Button>
                </Modal.Footer>
              </Modal>
            </div>
          )}
        </div>
      </div>

      {/* MODAL CLIENTE */}
      <Modal show={showClientModal} onHide={() => setShowClientModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Agregar Cliente</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>Nombre</Form.Label>
              <Form.Control
                value={newClient.name}
                onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Email</Form.Label>
              <Form.Control
                value={newClient.email}
                onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Teléfono</Form.Label>
              <Form.Control
                value={newClient.phone}
                onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowClientModal(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={addClient}>
            Guardar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* MODAL PROYECTO */}
      <Modal show={showProjectModal} onHide={() => setShowProjectModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Agregar Proyecto</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>Nombre</Form.Label>
              <Form.Control
                value={newProject.name}
                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Cliente</Form.Label>
              <Form.Select
                value={newProject.client_id}
                onChange={(e) => setNewProject({ ...newProject, client_id: e.target.value })}
              >
                <option value="">Seleccionar cliente</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group>
              <Form.Label>Estado</Form.Label>
              <Form.Select
                value={newProject.status} 
                onChange={(e) => setNewProject({ ...newProject, status: e.target.value })}
              >
                <option value="En progreso">En progreso</option>
                <option value="Completado">Completado</option>
                <option value="Pendiente">Pendiente</option>
              </Form.Select>
            </Form.Group>
            <Form.Group>
              <Form.Label>Imagen (opcional)</Form.Label>
              <Form.Control
                type="file"
                onChange={(e) =>
                  setNewProject({ ...newProject, image: e.target.files[0] })
                }
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowProjectModal(false)}
          >
            Cancelar
          </Button>
          <Button variant="primary" onClick={addProject}>
            Guardar
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default App;
