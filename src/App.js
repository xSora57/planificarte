import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Modal, Button, Form, ListGroup } from "react-bootstrap";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./App.css";
import confetti from "canvas-confetti";

/* CONFIG BACKEND */
const isLocalhost = window.location.hostname === "localhost";

// URL del backend en Render (reemplaza con tu URL real)
const renderBackendURL = "https://planificarte.onrender.com";

const backendURL = isLocalhost ? "http://localhost:5000" : renderBackendURL;

/* Instancia Axios */
const api = axios.create({ baseURL: backendURL });

api.interceptors.request.use(
  (config) => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) config.headers.Authorization = `Bearer ${storedToken}`;
    return config;
  },
  (error) => Promise.reject(error)
);
/* APP */
function App() {
  /*  Estados  */
  const [activeTab, setActiveTab] = useState("clients"); // views: clients, projects, calendar, stock, profile, achievements
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [events, setEvents] = useState([]);
  const [stock, setStock] = useState([]);
  const [achievements, setAchievements] = useState([]);

  const [selectedDate, setSelectedDate] = useState(new Date());

  const [showClientModal, setShowClientModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [shopItems, setShopItems] = useState([]);
  const [profile, setProfile] = useState({ username: "", email: "", avatar: "" });

  /* Formularios */
  const [newClient, setNewClient] = useState({ name: "", email: "", phone: "" });
  const [newProject, setNewProject] = useState({ name: "", client_id: "", status: "En progreso", image: null });
  const [newEvent, setNewEvent] = useState({ title: "", date: "", description: "" });
  const [newProduct, setNewProduct] = useState({ name: "", quantity: 0, image: null });

  /* Login */
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [isLoggedIn, setIsLoggedIn] = useState(!!token);
  const [loginData, setLoginData] = useState({ username: "", password: "" });

  /* XP / Nivel */
  const [xpInfo, setXpInfo] = useState({ xp: 0, level: 1 });
  const [oldLevel, setOldLevel] = useState(1); // para detectar subida

  /*  Helpers  */
  const decodeTokenUsername = () => {
    try {
      const t = localStorage.getItem("token");
      if (!t) return null;
      const p = JSON.parse(atob(t.split(".")[1]));
      return p.username || null;
    } catch {
      return null;
    }
  };

  /*  Fetchers  */
  const getClients = useCallback(async () => {
    try {
      const res = await api.get("/api/clients");
      setClients(res.data);
    } catch (err) {
      console.error("getClients:", err);
    }
  }, []);

  const getProjects = useCallback(async () => {
    try {
      const res = await api.get("/api/projects");
      setProjects(res.data);
    } catch (err) {
      console.error("getProjects:", err);
    }
  }, []);

  const getEvents = useCallback(async () => {
    try {
      const res = await api.get("/api/events");
      setEvents(res.data);
    } catch (err) {
      console.error("getEvents:", err);
    }
  }, []);

  const getStock = useCallback(async () => {
    try {
      const res = await api.get("/api/stock");
      setStock(res.data);
    } catch (err) {
      console.error("getStock:", err);
    }
  }, []);

  const getXP = useCallback(async () => {
    try {
      const res = await api.get("/api/user/xp");
      const newLevel = res.data.level || 1;
      if (newLevel > oldLevel) {
        confetti();
        
      }
      setOldLevel(newLevel);
      setXpInfo(res.data);
    } catch (err) {
      console.error("getXP:", err);
    }
  }, [oldLevel]);

  const getAchievements = useCallback(async () => {
    try {
      const res = await api.get("/api/achievements");
      setAchievements(res.data);
    } catch (err) {
      console.error("getAchievements:", err);
    }
  }, []);
  const getShop = useCallback(async () => {
    try {
      const res = await api.get("/api/shop");
      setShopItems(res.data);
    } catch (err) {
      console.error("getShop:", err);
    }
  }, []);
  const getProfile = useCallback(async () => {
    try {
      const res = await api.get("/api/user/profile");
      setProfile(res.data);
    } catch (err) {
      console.error("getProfile:", err);
    }
  }, []);

  /*  Login handlers  */
  const handleLogin = async () => {
    try {
      const res = await axios.post(`${backendURL}/api/login`, loginData);
      const newToken = res.data.token;
      localStorage.setItem("token", newToken);
      setToken(newToken);
      setIsLoggedIn(true);
    } catch {
      alert("Credenciales incorrectas");
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${backendURL}/auth/google`;
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    setToken("");
  };

  /*  On login, cargar datos  */
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

useEffect(() => {
  if (isLoggedIn) {
    getClients();
    getProjects();
    getEvents();
    getStock();
    getXP();
    getAchievements();
    getShop();
    getProfile();
  }
}, [
  isLoggedIn,
  getClients,
  getProjects,
  getEvents,
  getStock,
  getXP,
  getAchievements,
  getShop,
  getProfile
]);


  const addXP = async (amount) => {
    try {
      await api.post("/api/user/xp/add", { amount });
      await getXP();
    } catch (err) {
      console.warn("addXP failed:", err);
      await getXP();
    }
  };

  /*  CRUD Clientes  */
  const addClient = async () => {
    try {
      await api.post("/api/clients", newClient);
      setShowClientModal(false);
      setNewClient({ name: "", email: "", phone: "" });
      await getClients();
      await api.post("/api/user/achievements/1");
      await api.post("/api/user/xp/add", { amount: 50 });

    } catch (err) {
      console.error("addClient:", err);
    }
  };

  const deleteClient = async (id) => {
    try {
      await api.delete(`/api/clients/${id}`);
      await getClients();
    } catch (err) {
      console.error("deleteClient:", err);
    }
  };

  /*  CRUD Proyectos  */
  const addProject = async () => {
    try {
      const formData = new FormData();
      formData.append("name", newProject.name);
      formData.append("client_id", newProject.client_id);
      formData.append("status", newProject.status);
      if (newProject.image instanceof File) {
        formData.append("image", newProject.image);
      }

      if (newProject.id) {
        await api.put(`/api/projects/${newProject.id}`, formData);
      } else {
        await api.post("/api/projects", formData);
      }
      await api.post("/api/user/achievements/2");
      await api.post("/api/user/xp/add", { amount: 75 });

      setShowProjectModal(false);
      setNewProject({ name: "", client_id: "", status: "En progreso", image: null });
      await getProjects();
      await addXP(newProject.id ? 15 : 25); 
    } catch (err) {
      console.error("addProject:", err);
    }
  };

  const deleteProject = async (id) => {
    try {
      await api.delete(`/api/projects/${id}`);
      await getProjects();
    } catch (err) {
      console.error("deleteProject:", err);
    }
  };

  /*  CRUD Eventos  */
  const addEvent = async () => {
    try {
      await api.post("/api/events", newEvent);
      setShowEventModal(false);
      setNewEvent({ title: "", date: "", description: "" });
      await getEvents();
      await api.post("/api/user/achievements/3");
      await api.post("/api/user/xp/add", { amount: 40 });
    } catch (err) {
      console.error("addEvent:", err);
    }
  };

  const deleteEvent = async (id) => {
    try {
      await api.delete(`/api/events/${id}`);
      await getEvents();
    } catch (err) {
      console.error("deleteEvent:", err);
    }
  };

  /*  CRUD Stock  */
  const addProduct = async () => {
    try {
      const formData = new FormData();
      formData.append("name", newProduct.name);
      formData.append("quantity", newProduct.quantity);
      if (newProduct.image) formData.append("image", newProduct.image);

      await api.post("/api/stock", formData);
      setShowStockModal(false);
      setNewProduct({ name: "", quantity: 0, image: null });
      await getStock();
      await api.post("/api/user/achievements/4");
      await api.post("/api/user/xp/add", { amount: 30 });
    } catch (err) {
      console.error("addProduct:", err);
    }
  };

  const changeStock = async (id, value) => {
    try {
      await api.put(`/api/stock/${id}`, { change: value });
      await getStock();
    } catch (err) {
      console.error("changeStock:", err);
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm("¿Eliminar este producto del stock?")) return;
    try {
      await api.delete(`/api/stock/${id}`);
      await getStock();
    } catch (err) {
      console.error("deleteProduct:", err);
    }
  };

  const buyItem = async (id) => {
    try {
      await api.post(`/api/shop/buy/${id}`);
      alert("¡Comprado!");
      await getXP();
      await getShop();
    } catch (err) {
      alert("No tienes suficientes puntos");
    }
  };

  /*  Achievements (logros)  */
  const claimAchievement = async (achievementId) => {
    try {
      await api.post(`/api/user/achievements/${achievementId}`);
      // refrescar lista
      await getAchievements();
      await getXP(); // si el backend añade XP al logro, reflejarlo
    } catch (err) {
      console.error("claimAchievement:", err);
    }
  };
const [showRegister, setShowRegister] = useState(false);
const [registerData, setRegisterData] = useState({
  username: "",
  email: "",
  password: "",
});

const handleRegister = async () => {
  try {
    const res = await axios.post(`${backendURL}/api/register`, registerData);
    alert(res.data || "Registro completado. Ya puedes iniciar sesión.");
    setShowRegister(false);
    // opcional: limpiar campos
    setRegisterData({ username: "", email: "", password: "" });
  } catch (err) {
    console.error("register error:", err);
    const msg = err.response?.data || err.message || "Error al registrar";
    alert("Error al registrar: " + msg);
  }
};
const uploadAvatar = async (file) => {
  const formData = new FormData();
  formData.append("avatar", file);

  try {
    const res = await api.post("/api/user/avatar", formData);
    setProfile((prev) => ({ ...prev, avatar: res.data.avatar }));
    alert("Avatar actualizado");
  } catch (err) {
    console.error("uploadAvatar:", err);
  }
};


  /*  UI  */
if (!isLoggedIn) {
  return (
    <>
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
            <Button variant="link" onClick={() => setShowRegister(true)}>
              Crear cuenta nueva
            </Button>
          </div>
        </Modal.Body>
      </Modal>

      {/* Modal de Registro — IMPORTANTE: dentro del mismo return */}
      <Modal show={showRegister} onHide={() => setShowRegister(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Crear Cuenta</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form>
            <Form.Group className="mb-2">
              <Form.Label>Usuario</Form.Label>
              <Form.Control
                value={registerData.username}
                onChange={(e) =>
                  setRegisterData({ ...registerData, username: e.target.value })
                }
              />
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                value={registerData.email}
                onChange={(e) =>
                  setRegisterData({ ...registerData, email: e.target.value })
                }
              />
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Label>Contraseña</Form.Label>
              <Form.Control
                type="password"
                value={registerData.password}
                onChange={(e) =>
                  setRegisterData({ ...registerData, password: e.target.value })
                }
              />
            </Form.Group>
          </Form>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRegister(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleRegister}>
            Registrarse
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}


  /* Layout principal: contenido + menu derecho */
  return (
    <div>
      <nav className="navbar navbar-dark bg-dark p-2">
        <span className="navbar-brand">🎨 PlanificArte</span>

        <div className="d-flex align-items-center gap-3 text-white">
          <strong>Nivel {xpInfo.level}</strong>
          <div className="progress" style={{ width: 150, height: 8, background: "#444" }}>
            <div className="progress-bar bg-success" style={{ width: `${Math.min((xpInfo.xp / (xpInfo.level * 100)) * 100, 100)}%` }}></div>
          </div>
        </div>

        <Button variant="outline-light" onClick={handleLogout}>Cerrar Sesión</Button>
      </nav>

      <div className="container-fluid mt-3">
        <div className="row">
          {/* Main content */}
          <div className="col-md-9">
            <h2>Bienvenido a PlanificArte 🎨</h2>

            {/* TABS */}
            <ul className="nav nav-tabs mt-3">
              <li className="nav-item"><button className={`nav-link ${activeTab === "clients" ? "active" : ""}`} onClick={() => setActiveTab("clients")}>Clientes</button></li>
              <li className="nav-item"><button className={`nav-link ${activeTab === "projects" ? "active" : ""}`} onClick={() => setActiveTab("projects")}>Proyectos</button></li>
              <li className="nav-item"><button className={`nav-link ${activeTab === "calendar" ? "active" : ""}`} onClick={() => setActiveTab("calendar")}>Calendario</button></li>
              <li className="nav-item"><button className={`nav-link ${activeTab === "stock" ? "active" : ""}`} onClick={() => setActiveTab("stock")}>Stock</button></li>
            </ul>

            {/* Vistas */}
            {activeTab === "clients" && (
              <div className="mt-3">
                <Button onClick={() => setShowClientModal(true)}>+ Nuevo Cliente</Button>
                <table className="table mt-3">
                  <thead><tr><th>Nombre</th><th>Email</th><th>Teléfono</th><th></th></tr></thead>
                  <tbody>{clients.map(c => (
                    <tr key={c.id}><td>{c.name}</td><td>{c.email}</td><td>{c.phone}</td>
                      <td><Button variant="danger" size="sm" onClick={() => deleteClient(c.id)}>Eliminar</Button></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}

            {activeTab === "projects" && (
              <div className="mt-3">
                <Button onClick={() => { setNewProject({ name: "", client_id: "", status: "En progreso", image: null }); setShowProjectModal(true); }}>+ Nuevo Proyecto</Button>
                <div className="row mt-3">
                  {projects.map(p => (
                    <div className="col-md-4" key={p.id}>
                      <div className="card shadow-sm mb-3">
                        {p.image && (
                          <img
                            src={p.image}
                            className="card-img-top"
                            style={{ height: 180, objectFit: "cover" }}
                            alt="imagen del proyecto"
                          />
                        )}
                        <div className="card-body">
                          <h5>{p.name}</h5>
                          <p className="text-muted">Cliente: {p.client_name || "N/A"}</p>
                          <span className="badge bg-info">{p.status}</span>
                          <div className="mt-2">
                            <Button variant="warning" size="sm" className="me-2" onClick={() => { setNewProject(p); setShowProjectModal(true); }}>Editar</Button>
                            <Button variant="danger" size="sm" onClick={() => deleteProject(p.id)}>Eliminar</Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "calendar" && (
              <div className="mt-3">
                <Button onClick={() => { setNewEvent({ title: "", date: selectedDate.toISOString().split("T")[0], description: "" }); setShowEventModal(true); }}>+ Nuevo Evento</Button>
                <div className="row mt-3">
                  <div className="col-md-6">
                    <Calendar onChange={(date) => { setSelectedDate(date); setNewEvent(prev => ({ ...prev, date: date.toISOString().split("T")[0] })); }} value={selectedDate} className="shadow-sm rounded" />
                  </div>
                  <div className="col-md-6">
                    <h5>Eventos del día:</h5>
                    <ul className="list-group">
                      {events.filter(e => new Date(e.date).toISOString().split("T")[0] === selectedDate.toISOString().split("T")[0]).map(e => (
                        <li key={e.id} className="list-group-item d-flex justify-content-between">
                          <div><strong>{e.title}</strong><br /><small className="text-muted">{e.description}</small></div>
                          <Button variant="danger" size="sm" onClick={() => deleteEvent(e.id)}>🗑</Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "stock" && (
              <div className="mt-3">
                <Button onClick={() => setShowStockModal(true)}>+ Nuevo Producto</Button>
                <div className="row mt-3">
                  {stock.map(item => (
                    <div className="col-md-3" key={item.id}>
                      <div className="card shadow-sm mb-3 text-center">
                        {item.image && <img src={item.image} className="card-img-top" style={{ height: 150, objectFit: "cover" }} alt="" />}
                        <div className="card-body">
                          <h5>{item.name}</h5>
                          <p>Cantidad: {item.quantity}</p>
                          <div className="d-flex justify-content-center gap-2">
                            <Button size="sm" variant="secondary" onClick={() => changeStock(item.id, -1)}>-</Button>
                            <Button size="sm" variant="primary" onClick={() => changeStock(item.id, +1)}>+</Button>
                            <Button variant="danger" size="sm" className="mt-2" onClick={() => deleteProduct(item.id)}>Eliminar</Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <div className="col-md-3">
            <div className="card sticky-top" style={{ top: 20 }}>
              <div className="card-body">
                <h6>Cuenta</h6>
                <div className="mb-3 d-flex align-items-center gap-2">
                      <img
                        src={profile.avatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                        alt="avatar"
                        width={48}
                        height={48}
                        className="rounded"
                        style={{ objectFit: "cover" }}
                      />
                  <div>
                    <div style={{ fontWeight: 600 }}>{decodeTokenUsername() || "Usuario"}</div>
                    <small className="text-muted">Nivel {xpInfo.level} — {xpInfo.xp} XP</small>
                  </div>
                </div>

                <div className="d-grid gap-2">
                  <Button variant={activeTab === "profile" ? "primary" : "outline-primary"} onClick={() => setActiveTab("profile")}>👤 Perfil</Button>
                  <Button variant={activeTab === "achievements" ? "primary" : "outline-primary"} onClick={() => setActiveTab("achievements")}>🏆 Logros</Button>
                  <Button variant={activeTab === "shop" ? "primary" : "outline-primary"}  onClick={() => setActiveTab("shop")}>  🛒 Tienda</Button>

                </div>

                <hr />
                <small className="text-muted">Consejos</small>
                <ul className="small">
                  <li>Crear proyectos da más XP.</li>
                  <li>Reclama logros para recompensas.</li>
                </ul>
              </div>
            </div>

            {/* Contenido de las páginas perfil/logros en la misma columna derecha */}
            <div className="mt-3">
              {activeTab === "profile" && (
                <div className="card">
                  <div className="card-body">
                    <h5 className="card-title">Perfil</h5>
                    <div className="text-center mb-3">
                      <img
                        src={
                          profile.avatar
                            ? `${backendURL}/uploads/${profile.avatar}`
                            : "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                        }
                        alt="avatar"
                        width={80}
                        height={80}
                        className="rounded"
                        style={{ objectFit: "cover" }}
                      />

                      <input
                        type="file"
                        accept="image/*"
                        className="form-control mt-2"
                        onChange={(e) => uploadAvatar(e.target.files[0])}
                      />

                    </div>
                    <p><strong>Usuario:</strong> {decodeTokenUsername() || "Usuario"}</p>
                    <p><strong>Nivel:</strong> {xpInfo.level}</p>
                    <p><strong>XP:</strong> {xpInfo.xp} / {xpInfo.level * 100}</p>
                    <div className="progress mb-2" style={{ height: 10 }}>
                      <div className="progress-bar" role="progressbar" style={{ width: `${Math.min((xpInfo.xp / (xpInfo.level * 100)) * 100, 100)}%` }} />
                    </div>
                    <Button onClick={getXP} size="sm">Actualizar XP</Button>
                  </div>
                </div>
              )}

              {activeTab === "achievements" && (
                <div className="card">
                  <div className="card-body">
                    <h5 className="card-title">Logros</h5>
                    <ListGroup variant="flush">
                      {achievements.length === 0 && <div className="text-muted">Cargando logros...</div>}
                      {achievements.map(a => (
                        <ListGroup.Item key={a.id} className="d-flex justify-content-between align-items-center">
                          <div>
                            <div style={{ fontWeight: 600 }}>{a.title}</div>
                            <small className="text-muted">{a.description}</small>
                            <div><small className="text-muted">Recompensa XP: {a.xp_reward || 0}</small></div>
                            {a.achieved_date && <small className="text-success">Completado: {a.achieved_date.split("T")[0]}</small>}
                          </div>
                          <div>
                            {!a.achieved_date ? (
                              <Button size="sm" onClick={() => claimAchievement(a.id)}>Reclamar</Button>
                            ) : (
                              <Button size="sm" variant="outline-success" disabled>Conseguido</Button>
                            )}
                          </div>
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  </div>
                </div>
              )}
              {activeTab === "shop" && (
                <div className="card">
                  <div className="card-body">
                    <h5 className="card-title">Tienda</h5>
                    <p>Puntos disponibles: {xpInfo.points || 0}</p>
                    <ListGroup>
                      {shopItems.map(item => (
                        <ListGroup.Item key={item.id} className="d-flex justify-content-between align-items-center">
                          <div>
                            <strong>{item.name}</strong>
                            <br />
                            <small>{item.description}</small>
                          </div>
                          <div>
                            <Button size="sm" onClick={() => buyItem(item.id)}>
                              Comprar ({item.price} pts)
                            </Button>
                          </div>
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/*  MODALS  */}

      {/* REGISTER */}
      <Modal show={showRegister} onHide={() => setShowRegister(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Crear Cuenta</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form>
            <Form.Group className="mb-2">
              <Form.Label>Usuario</Form.Label>
              <Form.Control
                value={registerData.username}
                onChange={(e) =>
                  setRegisterData({ ...registerData, username: e.target.value })
                }
              />
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                value={registerData.email}
                onChange={(e) =>
                  setRegisterData({ ...registerData, email: e.target.value })
                }
              />
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Label>Contraseña</Form.Label>
              <Form.Control
                type="password"
                value={registerData.password}
                onChange={(e) =>
                  setRegisterData({ ...registerData, password: e.target.value })
                }
              />
            </Form.Group>
          </Form>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRegister(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleRegister}>
            Registrarse
          </Button>
        </Modal.Footer>
      </Modal>


      {/* EVENT */}
      <Modal show={showEventModal} onHide={() => setShowEventModal(false)}>
        <Modal.Header closeButton><Modal.Title>Nuevo Evento</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group><Form.Label>Título</Form.Label><Form.Control value={newEvent.title} onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))} /></Form.Group>
            <Form.Group><Form.Label>Fecha</Form.Label><Form.Control type="date" value={newEvent.date} onChange={(e) => setNewEvent(prev => ({ ...prev, date: e.target.value }))} /></Form.Group>
            <Form.Group><Form.Label>Descripción</Form.Label><Form.Control as="textarea" value={newEvent.description} onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))} /></Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEventModal(false)}>Cancelar</Button>
          <Button variant="primary" onClick={addEvent}>Guardar</Button>
        </Modal.Footer>
      </Modal>

      {/* CLIENT */}
      <Modal show={showClientModal} onHide={() => setShowClientModal(false)}>
        <Modal.Header closeButton><Modal.Title>Agregar Cliente</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group><Form.Label>Nombre</Form.Label><Form.Control value={newClient.name} onChange={(e) => setNewClient(prev => ({ ...prev, name: e.target.value }))} /></Form.Group>
            <Form.Group><Form.Label>Email</Form.Label><Form.Control value={newClient.email} onChange={(e) => setNewClient(prev => ({ ...prev, email: e.target.value }))} /></Form.Group>
            <Form.Group><Form.Label>Teléfono</Form.Label><Form.Control value={newClient.phone} onChange={(e) => setNewClient(prev => ({ ...prev, phone: e.target.value }))} /></Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowClientModal(false)}>Cancelar</Button>
          <Button variant="primary" onClick={addClient}>Guardar</Button>
        </Modal.Footer>
      </Modal>

      {/* PROJECT */}
      <Modal show={showProjectModal} onHide={() => setShowProjectModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{newProject.id ? "Editar Proyecto" : "Nuevo Proyecto"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3"><Form.Label>Nombre</Form.Label><Form.Control value={newProject.name} onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))} /></Form.Group>
            <Form.Group className="mb-3"><Form.Label>Cliente</Form.Label>
              <Form.Select value={newProject.client_id} onChange={(e) => setNewProject(prev => ({ ...prev, client_id: e.target.value }))}>
                <option value="">Seleccionar cliente</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3"><Form.Label>Estado</Form.Label>
              <Form.Select value={newProject.status} onChange={(e) => setNewProject(prev => ({ ...prev, status: e.target.value }))}>
                <option value="En progreso">En progreso</option>
                <option value="Completado">Completado</option>
                <option value="Pendiente">Pendiente</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3"><Form.Label>Imagen (opcional)</Form.Label><Form.Control type="file" onChange={(e) => setNewProject(prev => ({ ...prev, image: e.target.files[0] }))} /></Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowProjectModal(false)}>Cancelar</Button>
          <Button variant="primary" onClick={addProject}>{newProject.id ? "Guardar Cambios" : "Guardar"}</Button>
        </Modal.Footer>
      </Modal>

      {/* STOCK */}
      <Modal show={showStockModal} onHide={() => setShowStockModal(false)}>
        <Modal.Header closeButton><Modal.Title>Añadir Producto</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group><Form.Label>Nombre del producto</Form.Label><Form.Control value={newProduct.name} onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))} /></Form.Group>
            <Form.Group><Form.Label>Cantidad inicial</Form.Label><Form.Control type="number" value={newProduct.quantity} onChange={(e) => setNewProduct(prev => ({ ...prev, quantity: e.target.value }))} /></Form.Group>
            <Form.Group><Form.Label>Imagen</Form.Label><Form.Control type="file" onChange={(e) => setNewProduct(prev => ({ ...prev, image: e.target.files[0] }))} /></Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowStockModal(false)}>Cancelar</Button>
          <Button variant="primary" onClick={addProduct}>Guardar</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default App;
