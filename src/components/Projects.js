import React, { useEffect, useState } from "react";
import { Table, Button, Modal, Form, Image } from "react-bootstrap";
import axios from "axios";

/* CONFIG BACKEND */
const isLocalhost = window.location.hostname === "localhost";
const backendURL = isLocalhost
  ? "http://localhost:5000"
  : "https://planificarte.onrender.com";

function Projects() {
  const [projects, setProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const [newProject, setNewProject] = useState({
    name: "",
    client_id: "",
    status: "En progreso",
    image: null,
  });

  /* Obtener proyectos */
  const getProjects = async () => {
    try {
      const res = await axios.get(`${backendURL}/api/projects`);
      setProjects(res.data);
    } catch (err) {
      console.error("❌ Error al obtener proyectos:", err);
    }
  };

  useEffect(() => {
    getProjects();
  }, []);

  /* Manejar formulario */
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "image") {
      setNewProject({ ...newProject, image: files[0] });
    } else {
      setNewProject({ ...newProject, [name]: value });
    }
  };

  /* Añadir proyecto */
  const addProject = async () => {
    const formData = new FormData();
    formData.append("name", newProject.name);
    formData.append("client_id", newProject.client_id || "");
    formData.append("status", newProject.status);
    if (newProject.image) formData.append("image", newProject.image);

    try {
      await axios.post(`${backendURL}/api/projects`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setShowModal(false);
      setNewProject({
        name: "",
        client_id: "",
        status: "En progreso",
        image: null,
      });

      getProjects();
    } catch (err) {
      console.error("❌ Error al guardar el proyecto:", err);
      alert("Error al guardar el proyecto");
    }
  };

  /* Eliminar proyecto */
  const deleteProject = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar este proyecto?")) return;
    try {
      await axios.delete(`${backendURL}/api/projects/${id}`);
      getProjects();
    } catch (err) {
      console.error("❌ Error al eliminar proyecto:", err);
    }
  };

  return (
    <div id="projects" className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3>Proyectos</h3>
        <Button onClick={() => setShowModal(true)}>+ Nuevo Proyecto</Button>
      </div>

      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Estado</th>
            <th>Imagen</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((p) => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td>{p.status}</td>
              <td>
                {p.image ? (
                  <Image
                    src={p.image}
                    alt={p.name}
                    thumbnail
                    width={100}
                    style={{ objectFit: "cover" }}
                  />
                ) : (
                  "Sin imagen"
                )}
              </td>
              <td>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => deleteProject(p.id)}
                >
                  Eliminar
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* Modal nuevo proyecto */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Agregar Proyecto</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Nombre</Form.Label>
              <Form.Control
                name="name"
                value={newProject.name}
                onChange={handleChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Estado</Form.Label>
              <Form.Select
                name="status"
                value={newProject.status}
                onChange={handleChange}
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
                name="image"
                accept="image/*"
                onChange={handleChange}
              />
            </Form.Group>
          </Form>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
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

export default Projects;
