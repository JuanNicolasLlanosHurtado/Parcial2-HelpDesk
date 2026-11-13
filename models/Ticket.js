const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  solicitante: { type: String, required: true, trim: true },
  ubicacion: { type: String, required: true, trim: true },
  descripcion: { type: String, required: true, trim: true },
  fecha: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Ticket', ticketSchema);
