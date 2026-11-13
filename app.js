// ===== HelpDesk - Seguridad (sesiones) y MongoDB =====
require('dotenv').config();

const express = require('express');
const path = require('path');
const session = require('express-session');
const mongoose = require('mongoose');
const Ticket = require('./models/Ticket'); // Modelo de MongoDB

const app = express();
const PORT = 3000;

// Configuración (se lee del archivo .env; si no existe, usa valores del laboratorio)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/helpdeskDB';
const SESSION_SECRET = process.env.SESSION_SECRET || 'claveSecretaClaseNode2026';
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || '12345';

// ---------- 1. Conexión a MongoDB (local: mongodb://127.0.0.1:27017/helpdeskDB) ----------
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Conectado exitosamente a MongoDB (local)'))
  .catch(err => console.error('Error de conexión:', err));

// ---------- 2. Configuraciones base ----------
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use('/bootstrap', express.static(path.join(__dirname, 'node_modules/bootstrap/dist')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax' }
}));

// Deja disponible "loginAdmin" en todas las vistas (lo usa el menú)
app.use((req, res, next) => {
  res.locals.loginAdmin = !!(req.session && req.session.esAdmin);
  next();
});

// Middleware de protección
function verificarAutenticacion(req, res, next) {
  if (req.session && req.session.esAdmin) {
    return next();
  }
  res.redirect('/login');
}

// ---------- RUTAS PÚBLICAS ----------
app.get('/', (req, res) => {
  res.render('index', { titulo: 'Inicio', activa: 'inicio' });
});

app.get('/reportar', (req, res) => {
  res.render('reportar', { titulo: 'Reportar falla', activa: 'reportar', exito: false, error: null });
});

// Guardar el reporte en MongoDB (async/await)
app.post('/reportar', async (req, res) => {
  const { solicitante, ubicacion, descripcion } = req.body;

  if (!solicitante || !ubicacion || !descripcion) {
    return res.render('reportar', {
      titulo: 'Reportar falla',
      activa: 'reportar',
      exito: false,
      error: 'Todos los campos son obligatorios'
    });
  }

  try {
    const nuevoTicket = new Ticket({ solicitante, ubicacion, descripcion });
    await nuevoTicket.save(); // Guarda el documento en MongoDB

    res.render('reportar', { titulo: 'Reportar falla', activa: 'reportar', exito: true, error: null });
  } catch (error) {
    console.error('Error al guardar el ticket:', error);
    res.render('reportar', {
      titulo: 'Reportar falla',
      activa: 'reportar',
      exito: false,
      error: 'Error al guardar en la base de datos.'
    });
  }
});

// ---------- RUTAS DE AUTENTICACIÓN ----------
app.get('/login', (req, res) => {
  if (req.session.esAdmin) {
    return res.redirect('/admin');
  }
  res.render('login', { titulo: 'Login', activa: 'login', errorLogin: null });
});

app.post('/login', (req, res) => {
  const { usuario, contrasena } = req.body;

  if (usuario === ADMIN_USER && contrasena === ADMIN_PASS) {
    // regenerate() crea una sesión nueva (evita fijación de sesión)
    req.session.regenerate(err => {
      if (err) {
        return res.render('login', { titulo: 'Login', activa: 'login', errorLogin: 'No se pudo iniciar la sesión' });
      }
      req.session.esAdmin = true;
      res.redirect('/admin');
    });
  } else {
    res.render('login', { titulo: 'Login', activa: 'login', errorLogin: 'Credenciales incorrectas' });
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

// ---------- RUTAS PROTEGIDAS (ADMIN + MONGODB) ----------
app.get('/admin', verificarAutenticacion, async (req, res) => {
  try {
    // .find() trae todos los documentos de la colección (más recientes primero)
    const tickets = await Ticket.find().sort({ fecha: -1 });
    res.render('panel', { titulo: 'Panel de tickets', activa: 'admin', tickets: tickets });
  } catch (error) {
    console.error('Error al leer los tickets:', error);
    res.render('panel', { titulo: 'Panel de tickets', activa: 'admin', tickets: [] });
  }
});

// Compatibilidad con la ruta anterior
app.get('/panel', (req, res) => res.redirect('/admin'));

app.post('/admin/resolver', verificarAutenticacion, async (req, res) => {
  try {
    // MongoDB usa '_id' en lugar de 'id'
    await Ticket.findByIdAndDelete(req.body.idTicket);
  } catch (error) {
    console.error('Error al eliminar el ticket:', error);
  }
  res.redirect('/admin');
});

app.listen(PORT, () => {
  console.log('HelpDesk corriendo en http://localhost:' + PORT);
});
