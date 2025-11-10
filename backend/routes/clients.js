import express from "express";
import Client from "../models/Client.js";

const router = express.Router();

// Obtener todos los clientes
router.get("/", async (req, res) => {
  const clients = await Client.find();
  res.json(clients);
});

// Crear cliente
router.post("/", async (req, res) => {
  const client = new Client(req.body);
  await client.save();
  res.json(client);
});

// Eliminar cliente
router.delete("/:id", async (req, res) => {
  await Client.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

export default router;
