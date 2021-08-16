const { Proyecto, Clientes, Lotes, Pagos } = require('../models')
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
    
  }, 
  findCliente: async ({ text }) => {

    const regText = text?.split(' ').map(item => new RegExp(`${item}.*`, 'i')) 
    
    const queryName = await new Promise((resolve) => {
      resolve(
        Clientes.aggregate()
          .match({ nombre: { $all: regText } })
          
      )
    }).then(res => res)

    return Promise.all([queryName])
      .then(res => res)

  },
  findMailCliente: async ({ email }) => {
    const query = await new Promise((resolve) => {
      resolve(
        Clientes.find({ email })
      )
    }).then(res => res)
    return query 
  },
  getClienteById: async (id) => {
    const query = await new Promise((resolve) => {
      resolve(
        Clientes.findById(id)
      )
    })
      .then(res => res)

    return query
  },
  lotesByIdCliente: async (id) => {
    
    const lotesQuery = await new Promise((resolve) => {
      resolve(
        Lotes.aggregate()
          .match({ cliente: mongoose.Types.ObjectId(id) })
      )
    }).then(res => res)
     
    return lotesQuery

  },
  addPagoToLote: async (body) => {
  /** 
   * DATOS DEL MODELO DE PAGOS
   * @params cliente { ObjectID }
   * @params proyecto { ObjectID }
   * @params lote { ObjectID }
   * @params mes { string }
   * @params refPago { string }
   * @params cantidad { string }
   * @params { string }
   * El pago se debe guardar en pago de lote
   * 
   */

    return await Pagos(body).save()
    
  },
  getPagosByClienteAndProject: async (clienteId, proyectoId) => {

    const payload = new Promise((resolve) => {
      resolve(
        Pagos.aggregate()
          .match({ cliente: mongoose.Types.ObjectId(clienteId) })
      )
    })
      .then(res => res)
      .catch(err => console.log(err))
    
    const res = await Promise.all([payload])
      .then(res => res[0])

    return res

  },
  infoToInvoiceById: async ({ idPago }) => {
    // traer la informacion del pago
    const loteInfo = await new Promise((resolve) => {
      resolve(
        Pagos.aggregate()
          .match({ _id: mongoose.Types.ObjectId(idPago) })
          .lookup({ 
            from: 'proyectos', 
            localField: 'proyecto', 
            foreignField: '_id', 
            as: 'dataProject'
          })
          .lookup({
            from: 'clientes', 
            localField: 'cliente', 
            foreignField: '_id', 
            as: 'dataClient'
          })
          .lookup({
            from: 'lotes', 
            localField: 'lote', 
            foreignField: '_id', 
            as: 'dataLote'
          })
      )
    }).then(res => res)

    return loteInfo

  },
  statusPaymentByLoteId: async ({ loteId }) => {

    const agg = [
      {
        $match: {
          _id: mongoose.Types.ObjectId(loteId)
        }
      }, {
        $lookup: {
          from: 'pagos', 
          let: {
            cliente: '$cliente', 
            proyecto: '$proyecto'
          }, 
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $eq: [
                        '$proyecto', '$$proyecto'
                      ]
                    }, {
                      $eq: [
                        '$cliente', '$$cliente'
                      ]
                    }
                  ]
                }
              }
            }
          ], 
          as: 'pagos'
        }
      }
    ]
    
    const loteInfo = await new Promise((resolve) => {
      resolve(
        Lotes.aggregate(agg)
      )
    }).then(res => res)

    return loteInfo
  },
  PagarNota: async ({ idPago }, body) => {
    const query = await Pagos.findByIdAndUpdate(idPago, body)
    return query
  }
}
