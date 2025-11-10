import mongoose from "mongoose";

const projectSchema = new mongoose.Schema({
  name: String,
  client: String,
  status: String,
  image: String, // ruta del archivo subido
});

export default mongoose.model("Project", projectSchema);
