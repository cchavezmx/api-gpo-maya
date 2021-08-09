const mongoose = require('mongoose')
const { Schema } = mongoose

// def: cada lote solo tiene un cliente y solo puedo pertenecer a un proyecto

const LotesSchema = new Schema({
  isActive: {
    type: Boolean,
    default: true,
    required: false
  },
  proyecto: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'proyecto'
  }],
  cliente: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'cliente'
  }],
  lote: {
    type: String,
    required: true,
    unique: true
  },
  manzana: {
    type: String,
    required: false
  },
  precioTotal: {
    type: Number,
    require: true
  },
  enganche: {
    type: Number,
    required: false
  },
  financiamiento: {
    type: Number,
    required: false
  },
  plazo: {
    type: Number,
    required: true
  },
  mensualidad: {
    type: Number,
    required: false
  },
  inicioContrato: {
    type: Date,
    required: false
  },
  // aqui se guardara la cantidad de pagos que tiene 
  total_pagos: {
    type: Number,
    require: false
  }

})

const Lotes = mongoose.model('Lotes', LotesSchema)

module.exports = {
  Lotes
}
