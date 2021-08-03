const mongoose = require('mongoose')
const { Schema } = mongoose

const PagosSchema = new Schema({
  isActive: {
    type: Boolean,
    default: true,
    required: false
  },
  cliente: [{
    cliente_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'cliente'
    }
  }],
  proyecto: [{
    proyecto_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'proyecto'
    }
  }],
  lote: [{
    lote_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'lote'
    }
  }],
  mes: {
    type: Number,
    require: true
  },
  refPago: {
    type: String,
    require: false
  },
  cantidad: {
    type: Number,
    require: true
  }

}, { timestamps: true })

const Pagos = mongoose.model('Pagos', PagosSchema)

module.exports = {
  Pagos
}
