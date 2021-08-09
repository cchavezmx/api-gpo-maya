const mongoose = require('mongoose')
const { Schema } = mongoose

const ClientesSchema = new Schema({
  isActive: {
    type: Boolean,
    default: true,
    required: false
  },
  nombre: {
    type: String,
    required: false
  },
  phone: {
    type: String
  },
  address: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  lotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'lotes'
  }],
  pagos: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'pagos'
  }]

}, { timestamps: true })

const Clientes = mongoose.model('Clientes', ClientesSchema)

module.exports = {
  Clientes
}
