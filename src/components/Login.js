     import React, { useState } from 'react';
     import { Form, Button, Container, Row, Col } from 'react-bootstrap';

     function Login({ loginData, setLoginData, handleLogin, handleGoogleLogin }) {
       return (
         <Container className="mt-5">
           <Row className="justify-content-center">
             <Col md={6}>
               <div className="card shadow">
                 <div className="card-body">
                   <h2 className="card-title text-center">Iniciar Sesión en PlanificArte</h2>
                   <Form>
                     <Form.Group className="mb-3">
                       <Form.Label>Usuario</Form.Label>
                       <Form.Control
                         value={loginData.username}
                         onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                         placeholder="Ingresa tu usuario"
                       />
                     </Form.Group>
                     <Form.Group className="mb-3">
                       <Form.Label>Contraseña</Form.Label>
                       <Form.Control
                         type="password"
                         value={loginData.password}
                         onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                         placeholder="Ingresa tu contraseña"
                       />
                     </Form.Group>
                     <div className="text-center">
                       <Button variant="primary" onClick={handleLogin} className="me-2">
                         Iniciar Sesión
                       </Button>
                       <Button variant="outline-danger" onClick={handleGoogleLogin}>
                         <i className="bi bi-google me-2"></i>Iniciar con Google
                       </Button>
                     </div>
                   </Form>
                 </div>
               </div>
             </Col>
           </Row>
         </Container>
       );
     }

     export default Login;
     