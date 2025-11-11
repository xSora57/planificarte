import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Clients from "./components/Clients";
import Projects from "./components/Projects";
import Login from "./components/Login";
import { isAuthenticated } from "./utils/auth";
import "bootstrap/dist/css/bootstrap.min.css";

function PrivateRoute({ children }) {
  return isAuthenticated() ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/clients"
          element={
            <PrivateRoute>
              <Clients />
            </PrivateRoute>
          }
        />
        <Route
          path="/projects"
          element={
            <PrivateRoute>
              <Projects />
            </PrivateRoute>
          }
        />
        <Route path="/" element={<Navigate to="/clients" />} />
      </Routes>
    </Router>
  );
}

export default App;
