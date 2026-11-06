// ===== HelpDesk - Parcial No. 2 =====
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const archivo = path.join(__dirname, 'tickets.json');

// Configuración de EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Para leer los datos del formulario
app.use(express.urlencoded({ extended: true }));

// Bootstrap local (desde node_modules) y nuestros estilos
app.use('/bootstrap', express.static(path.join(__dirname, 'node_modules/bootstrap/dist')));
app.use(express.static(path.join(__dirname, 'public')));

// ---------- Funciones para manejar el JSON ----------
function leerTickets() {
  try {
    const contenido = fs.readFileSync(archivo, 'utf8');
    // si el archivo está vacío devolvemos un arreglo vacío
    if (contenido.trim() === '') {
      return [];
    }
    return JSON.parse(contenido);
  } catch (error) {
    // si no existe o está dañado, empezamos de cero
    return [];
  }
}

function guardarTickets(tickets) {
  fs.writeFileSync(archivo, JSON.stringify(tickets, null, 2));
}

// ---------- Rutas ----------

// Inicio
app.get('/', (req, res) => {
  res.render('index', { titulo: 'Inicio', activa: 'inicio' });
});

// Mostrar formulario
app.get('/reportar', (req, res) => {
  res.render('reportar', { titulo: 'Reportar falla', activa: 'reportar', exito: false, error: null });
});

// Guardar el reporte
app.post('/reportar', (req, res) => {
  const { solicitante, ubicacion, descripcion } = req.body;

  // validación sencilla
  if (!solicitante || !ubicacion || !descripcion) {
    return res.render('reportar', {
      titulo: 'Reportar falla',
      activa: 'reportar',
      exito: false,
      error: 'Todos los campos son obligatorios'
    });
  }

  const tickets = leerTickets();

  const nuevo = {
    id: Date.now(),
    solicitante: solicitante,
    ubicacion: ubicacion,
    descripcion: descripcion,
    fecha: new Date().toLocaleString('es-CO')
  };

  tickets.push(nuevo);
  guardarTickets(tickets);

  res.render('reportar', { titulo: 'Reportar falla', activa: 'reportar', exito: true, error: null });
});

// Panel de tickets
app.get('/panel', (req, res) => {
  const tickets = leerTickets();
  res.render('panel', { titulo: 'Panel de tickets', activa: 'panel', tickets: tickets });
});

// Resolver (eliminar) un ticket
app.post('/panel/resolver', (req, res) => {
  const id = Number(req.body.id);
  const tickets = leerTickets();

  const restantes = tickets.filter(t => t.id !== id);
  guardarTickets(restantes);

  res.redirect('/panel');
});

app.listen(PORT, () => {
  console.log('HelpDesk corriendo en http://localhost:' + PORT);
});
