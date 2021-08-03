const { Proyecto, Clientes, Lotes } = require('../models')
const mongoose = require('mongoose')

module.exports = {
  addProyecto: async (payload) => {
    return new Proyecto(payload).save()
  },
  // 
  getAllProyectos: () => {
    return Proyecto.find({ isActive: true })
  },
  // 
  getProyectoById: (id) => Proyecto.findById(id),
  // 
  getProyectoByName: (name) => {
    const proyectos = Proyecto.find({ title: name })
    return proyectos
  },
  // 
  createCLient: async (payload) => {
    return new Clientes(payload).save()
  },
  assignLoteToNewUser: async (payload, params) => {

    const { idProyecto } = params

    const dataUser = {
      nombre: payload.nombre,
      phone: payload.phone,
      address: payload.address,
      email: payload.email
    }

    const saveLote = async (idCliente) => {
      const datalote = {
        proyecto: idProyecto,
        cliente: idCliente,
        lote: payload.lote,
        manzana: payload.manzana,
        precioTotal: payload.precioTotal,
        enganche: payload.enganche,
        financiamiento: payload.financiamiento,
        plazo: payload.plazo,
        mensualidad: payload.mensualidad
      }

      const res = await new Promise((resolve) => {
        resolve(new Lotes(datalote).save())
      })
      return res
    }

    const dataUserPromise = new Promise((resolve) => {
      resolve(new Clientes(dataUser).save())
    })
      .then((res) => {
        return saveLote(res._id)
      })
      .then(res => res)

    const data = Promise.all([dataUserPromise])
      .then(res => res[0])

    return await data

  },
  // todos los lotes con nombre de usuario del proyecto
  getAllLotesByProyectId: async (idProyecto) => {

    // tenemos que obtener la lista de lotes por proyecto
    const fletchLotesById = async () => {
      const query = await new Promise((resolve) => {
        resolve(
          Lotes.aggregate()
            .match({ isActive: true })
            .match({ proyecto: mongoose.Types.ObjectId(idProyecto) })
            .project({ cliente: 1, _id: 0 })

        )
      }).then(res => res)

      return query
    }

    // CON EL ID DE CLIENTE BUSCAMOS LOS NOMBRES Y HACEMOS UN "JOIN"
    const fletchClienteID = async (idcliente) => {
      const query = await new Promise((resolve) => {
        resolve(
          Clientes.aggregate()
            .match({ _id: mongoose.Types.ObjectId(idcliente) })
            .lookup({ 
              from: 'lotes', 
              localField: '_id', 
              foreignField: 'cliente', 
              as: 'lotes'
            })
        )
      }).then(res => res)

      return query
    }

    // RESOLVEMOS LAS PETICIONES
    const getDataLoteClientName = async () => {

      const lotes = await fletchLotesById()      
      const lotesIds = Object
        .values(lotes)
        .map(({ cliente }) => cliente[0])

      const querysArray = Object
        .values(lotesIds)
        .map(item => fletchClienteID(item))

      const resolvePromise = Promise.all(querysArray)
        .then(res => res)

      return resolvePromise
    }

    return getDataLoteClientName()
    
  }
  
}
