import express from "express";
import Project from "../models/Project.js";
import { upload } from "../server.js";

const router = express.Router();

// Obtener proyectos
router.get("/", async (req, res) => {
  const projects = await Project.find();
  res.json(projects);
});

// Crear proyecto (con imagen)
router.post("/", upload.single("image"), async (req, res) => {
  const project = new Project({
    ...req.body,
    image: req.file ? `/uploads/${req.file.filename}` : null,
  });
  await project.save();
  res.json(project);
});

// Eliminar proyecto
router.delete("/:id", async (req, res) => {
  await Project.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});
router.put("/:id", auth, upload.single("image"), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, client_id, status } = req.body;

    let sql = "UPDATE projects SET name=?, client_id=?, status=? WHERE id=?";
    const params = [name, client_id, status, id];

    // Si sube nueva imagen
    if (req.file) {
      sql = "UPDATE projects SET name=?, client_id=?, status=?, image=? WHERE id=?";
      params.splice(3, 0, req.file.filename);
    }

    await db.query(sql, params);

    res.json({ message: "Proyecto actualizado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al editar proyecto" });
  }
});

export default router;
