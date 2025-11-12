import React, { useEffect, useState } from "react";
import axios from "axios";
import { Modal, Button, Form } from "react-bootstrap";
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState("clients");
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [newClient, setNewClient] = useState({ name: "", email: "", phone: "" });
  const [newProject, setNewProject] = useState({ name: "", client_id: "", status: "En progreso", image: null });

  // 🎯 Obtener datos de clientes y proyectos
  const getClients = async () => {
    const res = await axios.get("http://localhost:5000/api/clients");
    setClients(res.data);
  };

  const getProjects = async () => {
    const res = await axios.get("http://localhost:5000/api/projects");
    setProjects(res.data);
  };

  useEffect(() => {
    getClients();
    getProjects();
  }, []);

  // ➕ Añadir Cliente
  const addClient = async () => {
    await axios.post("http://localhost:5000/api/clients", newClient);
    setShowClientModal(false);
    setNewClient({ name: "", email: "", phone: "" });
    getClients();
  };

  // ➕ Añadir Proyecto
  const addProject = async () => {
    const formData = new FormData();
    formData.append("name", newProject.name);
    formData.append("client_id", newProject.client_id);
    formData.append("status", newProject.status);
    if (newProject.image) formData.append("image", newProject.image);

    await axios.post("http://localhost:5000/api/projects", formData);
    setShowProjectModal(false);
    setNewProject({ name: "", client_id: "", status: "En progreso", image: null });
    getProjects();
  };

  // 🗑️ Eliminar Cliente / Proyecto
  const deleteClient = async (id) => {
    await axios.delete(`http://localhost:5000/api/clients/${id}`);
    getClients();
  };

  const deleteProject = async (id) => {
    await axios.delete(`http://localhost:5000/api/projects/${id}`);
    getProjects();
  };

  return (
    <div>
      {/* 🎨 Navbar */}
      <nav className="navbar navbar-dark bg-dark shadow">
        <div className="container">
          <span className="navbar-brand">🎨 PlanificArte</span>
        </div>
      </nav>

      <div className="container mt-4">
        <h2>Bienvenido a PlanificArte 🎨</h2>
        <p className="text-muted">
          Administra tus clientes, proyectos e imágenes de referencia.
        </p>

        {/* 🧭 Tabs */}
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
                onChange={(e) => setNewProject({ ...newProject, image: e.target.files[0] })}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowProjectModal(false)}>
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

