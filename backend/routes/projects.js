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

export default router;
