const mongoose = require('mongoose')
const { Schema } = mongoose

const PagosSchema = new Schema({
  isActive: {
    type: Boolean,
    default: true,
    required: false
  },
  status: {
    type: Boolean,
    default: false
  },
  cliente: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'cliente'
  }],
  proyecto: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'proyecto'
  }],
  lote: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'lote'

  }],
  mes: {
    type: String,
    require: true
  },
  refPago: {
    type: String,
    require: false
  },
  mensualidad: {
    type: String,
    require: true
  }

}, { timestamps: true })

const Pagos = mongoose.model('Pagos', PagosSchema)

module.exports = {
  Pagos
}
