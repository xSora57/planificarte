import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Modal, Button, Form } from "react-bootstrap";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./App.css";

const isLocalhost = window.location.hostname === "localhost";
const backendURL = isLocalhost
  ? "http://localhost:5000"
  : "http://192.168.0.145:5000";

// Instancia global de axios
const api = axios.create({ baseURL: backendURL });

// Interceptor global – siempre usa el token del localStorage
api.interceptors.request.use(
  (config) => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      config.headers.Authorization = `Bearer ${storedToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

function App() {
  const [activeTab, setActiveTab] = useState("clients");
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [events, setEvents] = useState([]);
  const [stock, setStock] = useState([]);

  const [showClientModal, setShowClientModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);

  const [selectedDate, setSelectedDate] = useState(new Date());

  // Formularios
  const [newClient, setNewClient] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const [newProject, setNewProject] = useState({
    name: "",
    client_id: "",
    status: "En progreso",
    image: null,
  });

  const [newEvent, setNewEvent] = useState({
    title: "",
    date: "",
    description: "",
  });

  const [newProduct, setNewProduct] = useState({
    name: "",
    quantity: 0,
    image: null,
  });

  // Login
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [isLoggedIn, setIsLoggedIn] = useState(!!token);
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [showLoginModal, setShowLoginModal] = useState(!isLoggedIn);

  const handleLogin = async () => {
    try {
      const res = await axios.post(`${backendURL}/api/login`, loginData);
      const newToken = res.data.token;

      localStorage.setItem("token", newToken);
      setToken(newToken);
      setIsLoggedIn(true);
    } catch (err) {
      alert("Credenciales incorrectas");
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${backendURL}/auth/google`;
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
  };

  // Callback OAuth
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get("token");

    if (tokenFromUrl) {
      localStorage.setItem("token", tokenFromUrl);
      setToken(tokenFromUrl);
      setIsLoggedIn(true);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const getClients = useCallback(async () => {
    try {
      const res = await api.get("/api/clients");
      setClients(res.data);
    } catch (error) {
      console.error(error);
    }
  }, []);

  const addClient = async () => {
    try {
      await api.post("/api/clients", newClient);
      setShowClientModal(false);
      setNewClient({ name: "", email: "", phone: "" });
      getClients();
    } catch (error) {
      console.error(error);
    }
  };

  const deleteClient = async (id) => {
    try {
      await api.delete(`/api/clients/${id}`);
      getClients();
    } catch (error) {
      console.error(error);
    }
  };

  const getProjects = useCallback(async () => {
    try {
      const res = await api.get("/api/projects");
      setProjects(res.data);
    } catch (error) {
      console.error(error);
    }
  }, []);

    const addProject = async () => {
      try {
        const formData = new FormData();
        formData.append("name", newProject.name);
        formData.append("client_id", newProject.client_id);
        formData.append("status", newProject.status);
        if (newProject.image) formData.append("image", newProject.image);

        if (newProject.id) {
          await api.put(`/api/projects/${newProject.id}`, formData);
        } else {
          await api.post("/api/projects", formData);
        }

        setShowProjectModal(false);
        setNewProject({ name: "", client_id: "", status: "En progreso", image: null });
        getProjects();
      } catch (err) {
        console.error("Error al guardar proyecto:", err);
      }
    };

  const deleteProject = async (id) => {
    try {
      await api.delete(`/api/projects/${id}`);
      getProjects();
    } catch (err) {
      console.error(err);
    }
  };

  const getEvents = useCallback(async () => {
    try {
      const res = await api.get("/api/events");
      setEvents(res.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const addEvent = async () => {
    try {
      await api.post("/api/events", newEvent);
      setShowEventModal(false);
      setNewEvent({ title: "", date: "", description: "" });
      getEvents();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteEvent = async (id) => {
    try {
      await api.delete(`/api/events/${id}`);
      getEvents();
    } catch (err) {
      console.error(err);
    }
  };

  const getStock = useCallback(async () => {
    try {
      const res = await api.get("/api/stock");
      setStock(res.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const addProduct = async () => {
    try {
      const formData = new FormData();
      formData.append("name", newProduct.name);
      formData.append("quantity", newProduct.quantity);
      if (newProduct.image) formData.append("image", newProduct.image);

      await api.post("/api/stock", formData);

      setShowStockModal(false);
      setNewProduct({ name: "", quantity: 0, image: null });
      getStock();
    } catch (err) {
      console.error(err);
    }
  };

  const changeStock = async (id, value) => {
    try {
      await api.put(`/api/stock/${id}`, { change: value });
      getStock();
    } catch (err) {
      console.error(err);
    }
  };

const deleteProduct = async (id) => {
  if (!window.confirm("¿Eliminar este producto del stock?")) return;

  try {
    await api.delete(`/api/stock/${id}`);
    getStock();
  } catch (err) {
    console.error("Error al eliminar producto:", err);
  }
};

  useEffect(() => {
    if (isLoggedIn) {
      getClients();
      getProjects();
      getEvents();
      getStock();
    }
  }, [isLoggedIn]);

  if (!isLoggedIn) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Modal show centered>
          <Modal.Header>
            <Modal.Title>Iniciar Sesión</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group>
                <Form.Label>Usuario</Form.Label>
                <Form.Control
                  value={loginData.username}
                  onChange={(e) =>
                    setLoginData({ ...loginData, username: e.target.value })
                  }
                />
              </Form.Group>
              <Form.Group>
                <Form.Label>Contraseña</Form.Label>
                <Form.Control
                  type="password"
                  value={loginData.password}
                  onChange={(e) =>
                    setLoginData({ ...loginData, password: e.target.value })
                  }
                />
              </Form.Group>
            </Form>
            <div className="text-center mt-3">
              <Button onClick={handleLogin} className="me-2">
                Iniciar Sesión
              </Button>
              <Button variant="outline-danger" onClick={handleGoogleLogin}>
                Google
              </Button>
            </div>
          </Modal.Body>
        </Modal>
      </div>
    );
  }

  return (
    <div>
      {/* NAVBAR */}
      <nav className="navbar navbar-dark bg-dark p-2">
        <span className="navbar-brand">🎨 PlanificArte</span>
        <Button variant="outline-light" onClick={handleLogout}>
          Cerrar Sesión
        </Button>
      </nav>

      <div className="container mt-3">
        <h2>Bienvenido a PlanificArte 🎨</h2>

        {/* TABS */}
        <ul className="nav nav-tabs mt-3">
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

          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === "stock" ? "active" : ""}`}
              onClick={() => setActiveTab("stock")}
            >
              Stock
            </button>
          </li>
        </ul>

        {activeTab === "clients" && (
          <div className="mt-3">
            <Button onClick={() => setShowClientModal(true)}>
              + Nuevo Cliente
            </Button>

            <table className="table mt-3">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Teléfono</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td>{c.email}</td>
                    <td>{c.phone}</td>
                    <td>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => deleteClient(c.id)}
                      >
                        Eliminar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "projects" && (
          <div className="mt-3">
            <Button onClick={() => setShowProjectModal(true)}>
              + Nuevo Proyecto
            </Button>

            <div className="row mt-3">
              {projects.map((p) => (
                <div className="col-md-4" key={p.id}>
                  <div className="card shadow-sm mb-3">
                    {p.image && (
                      <img
                        src={`${backendURL}/uploads/${p.image}`}
                        className="card-img-top"
                        style={{ height: 180, objectFit: "cover" }}
                        alt=""
                      />
                    )}

                    <div className="card-body">
                      <h5>{p.name}</h5>
                      <p className="text-muted">
                        Cliente: {p.client_name || "N/A"}
                      </p>
                      <span className="badge bg-info">{p.status}</span>
                      <Button
                        variant="warning"
                        size="sm"
                        className="mt-2 me-2"
                        onClick={() => {
                          setNewProject(p);
                          setShowProjectModal(true);
                        }}
                      >
                        Editar
                      </Button>

                      <Button
                        variant="danger"
                        size="sm"
                        className="mt-2"
                        onClick={() => deleteProject(p.id)}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "calendar" && (
          <div className="mt-3">
            <Button
              onClick={() => {
                setNewEvent({
                  title: "",
                  date: selectedDate.toISOString().split("T")[0],
                  description: "",
                });
                setShowEventModal(true);
              }}
            >
              + Nuevo Evento
            </Button>

            <div className="row mt-3">
              <div className="col-md-6">
                <Calendar
                  onChange={(date) => {
                    setSelectedDate(date);
                    setNewEvent((prev) => ({
                      ...prev,
                      date: date.toISOString().split("T")[0],
                    }));
                  }}
                  value={selectedDate}
                  className="shadow-sm rounded"
                />
              </div>

              <div className="col-md-6">
                <h5>Eventos del día:</h5>
                <ul className="list-group">
{events
  .filter((e) => {
    const eventDate = new Date(e.date).toISOString().split("T")[0];
    const selected = selectedDate.toISOString().split("T")[0];
    return eventDate === selected;
  })
  .map((e) => (
    <li key={e.id} className="list-group-item d-flex justify-content-between">
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
          </div>
        )}

        {activeTab === "stock" && (
          <div className="mt-3">
            <Button onClick={() => setShowStockModal(true)}>
              + Nuevo Producto
            </Button>

            <div className="row mt-3">
              {stock.map((item) => (
                <div className="col-md-3" key={item.id}>
                  <div className="card shadow-sm mb-3 text-center">
                    {item.image && (
                      <img
                        src={`${backendURL}/uploads/${item.image}`}
                        className="card-img-top"
                        style={{ height: 150, objectFit: "cover" }}
                        alt=""
                      />
                    )}

                    <div className="card-body">
                      <h5>{item.name}</h5>
                      <p>Cantidad: {item.quantity}</p>

                      <div className="d-flex justify-content-center gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => changeStock(item.id, -1)}
                        >
                          -
                        </Button>

                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => changeStock(item.id, +1)}
                        >
                          +
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          className="mt-2"
                          onClick={() => deleteProduct(item.id)}
                        >
                          Eliminar
                        </Button>

                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MODAL EVENTO */}
        <Modal show={showEventModal} onHide={() => setShowEventModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Nuevo Evento</Modal.Title>
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
                  onChange={(e) =>
                    setNewClient({ ...newClient, name: e.target.value })
                  }
                />
              </Form.Group>

              <Form.Group>
                <Form.Label>Email</Form.Label>
                <Form.Control
                  value={newClient.email}
                  onChange={(e) =>
                    setNewClient({ ...newClient, email: e.target.value })
                  }
                />
              </Form.Group>

              <Form.Group>
                <Form.Label>Teléfono</Form.Label>
                <Form.Control
                  value={newClient.phone}
                  onChange={(e) =>
                    setNewClient({ ...newClient, phone: e.target.value })
                  }
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
            <Modal.Title>
              {newProject.id ? "Editar Proyecto" : "Nuevo Proyecto"}
            </Modal.Title>
          </Modal.Header>

          <Modal.Body className="p-3">
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Nombre</Form.Label>
                <Form.Control
                  value={newProject.name}
                  onChange={(e) =>
                    setNewProject({ ...newProject, name: e.target.value })
                  }
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Cliente</Form.Label>
                <Form.Select
                  value={newProject.client_id}
                  onChange={(e) =>
                    setNewProject({ ...newProject, client_id: e.target.value })
                  }
                >
                  <option value="">Seleccionar cliente</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Estado</Form.Label>
                <Form.Select
                  value={newProject.status}
                  onChange={(e) =>
                    setNewProject({ ...newProject, status: e.target.value })
                  }
                >
                  <option value="En progreso">En progreso</option>
                  <option value="Completado">Completado</option>
                  <option value="Pendiente">Pendiente</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
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
            <Button variant="secondary" onClick={() => setShowProjectModal(false)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={addProject}>
              {newProject.id ? "Guardar Cambios" : "Guardar"}
            </Button>
          </Modal.Footer>
        </Modal>

        {/* MODAL STOCK */}
        <Modal show={showStockModal} onHide={() => setShowStockModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Añadir Producto</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group>
                <Form.Label>Nombre del producto</Form.Label>
                <Form.Control
                  value={newProduct.name}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, name: e.target.value })
                  }
                />
              </Form.Group>

              <Form.Group>
                <Form.Label>Cantidad inicial</Form.Label>
                <Form.Control
                  type="number"
                  value={newProduct.quantity}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, quantity: e.target.value })
                  }
                />
              </Form.Group>

              <Form.Group>
                <Form.Label>Imagen</Form.Label>
                <Form.Control
                  type="file"
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, image: e.target.files[0] })
                  }
                />
              </Form.Group>
            </Form>
          </Modal.Body>

          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowStockModal(false)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={addProduct}>
              Guardar
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </div>
  );
}

export default App;
