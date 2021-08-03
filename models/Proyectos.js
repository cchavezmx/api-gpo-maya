const mongoose = require('mongoose')
const { Schema } = mongoose

const ProyectoSchema = new Schema({
  isActive: {
    type: Boolean,
    default: true,
    required: false
  },
  address: {
    type: String,
    required: false
  },
  title: {
    type: String,
    required: true,
    unique: true
  },
  img: {
    type: String,
    requires: true
  },
  lotes: {
    type: Array,
    required: false
  }

}, { timestamps: true })

const Proyecto = mongoose.model('Proyecto', ProyectoSchema)

module.exports = {
  Proyecto
}
