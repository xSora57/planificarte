import React, { useEffect, useState } from "react";
import { Table, Button, Modal, Form, Image } from "react-bootstrap";
import axios from "axios";

function Projects() {
  const [projects, setProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
const [newProject, setNewProject] = useState({
  name: "",
  client_id: "",
  status: "",
  image: null
});

  // Obtener todos los proyectos
  const getProjects = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/projects");
      setProjects(res.data);
    } catch (err) {
      console.error("❌ Error al obtener proyectos:", err);
    }
  };

  useEffect(() => {
    getProjects();
  }, []);

  // Manejar campos del formulario
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "image") {
      setNewProject({ ...newProject, image: files[0] });
    } else {
      setNewProject({ ...newProject, [name]: value });
    }
  };

  // Añadir nuevo proyecto
  const addProject = async () => {
  const formData = new FormData();
  formData.append("name", newProject.name);
  formData.append("client_id", newProject.client_id || "");
  formData.append("status", newProject.status || "En progreso");
  if (newProject.image) formData.append("image", newProject.image);

  try {
    await axios.post("http://localhost:5000/api/projects", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    setShowModal(false);
    setNewProject({ name: "", client_id: "", status: "", image: null });
    getProjects();
  } catch (err) {
    console.error("❌ Error al guardar el proyecto:", err);
    alert("Error al guardar el proyecto");
  }
};

  // Eliminar proyecto
  const deleteProject = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar este proyecto?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/projects/${id}`);
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
            <th>Descripción</th>
            <th>Imagen</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((p) => (
            <tr key={p.id}>
              <td>{p.nombre}</td>
              <td>{p.descripcion}</td>
              <td>
                {p.imagen ? (
                  <Image
                    src={`http://localhost:5000/uploads/${p.imagen}`}
                    alt={p.nombre}
                    thumbnail
                    width="100"
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

      {/* Modal para agregar proyecto */}
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
              <Form.Label>Descripción</Form.Label>
              <Form.Control
                name="description"
                value={newProject.description}
                onChange={handleChange}
              />
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
