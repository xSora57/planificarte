import React, { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";

function AddProjectModal({ show, handleClose, addProject }) {
  const [form, setForm] = useState({
    name: "",
    client: "",
    status: "En progreso",
    image: null,
  });

  const handleSubmit = () => {
    addProject(form);
    setForm({ name: "", client: "", status: "En progreso", image: null });
    handleClose();
  };

  return (
    <Modal show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>Agregar Proyecto</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Nombre del Proyecto</Form.Label>
            <Form.Control
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Cliente</Form.Label>
            <Form.Control
              value={form.client}
              onChange={(e) => setForm({ ...form, client: e.target.value })}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Estado</Form.Label>
            <Form.Select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option>En progreso</option>
              <option>Completado</option>
              <option>Pendiente</option>
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Imagen (opcional)</Form.Label>
            <Form.Control
              type="file"
              accept="image/*"
              onChange={(e) =>
                setForm({ ...form, image: e.target.files[0] })
              }
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={handleSubmit}>
          Guardar
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default AddProjectModal;
