const { MayaService } = require('../service')

module.exports = {
  login: () => {},
  register: () => {},
  addProyecto: async (req, res) => {
    const { body } = req
    try {

      const proyectoExist = await MayaService.getProyectoByName(body?.title)
      if (Object.values(proyectoExist).length > 0) throw new Error('Ya existe el documento')

      const payload = await MayaService.addProyecto(body)
      if (payload) {
        return res.status(200).json({ message: payload })
      }

    } catch (error) {
      return res.status(400).json({ error })
    }
  },
  getAllProyectos: async (req, res) => {
    try {
      const payload = await MayaService.getAllProyectos()
      if (!payload) throw new Error('Error al leer los datos de la base de datos')

      return res.status(200).json({ message: payload })

    } catch (error) {
      return res.status(400).json({ error })
    }
  },
  getProyectoById: async (req, res) => {

    const { id } = req.params

    try {
      const payload = await MayaService.getProyectoById(id)
      if (!payload) throw new Error('Id invalido')
      
      return res.status(200).json({ message: payload })

    } catch (error) {    
      return res.status(400).json({ error })
    }
  },
  addCliente: async (req, res) => {
    const { body } = req
  
    try {

      // buscamos si existe el documento
      const isExsit = await MayaService.findMailCliente(body.email)
      if (isExsit) throw new Error('El usuario ya existe')

      const payload = await MayaService.createCLient(body)
        .catch(error => {
          if (error) {
            throw new Error('Error en la creacion del documento')
          }
        })

      return res.status(200).json({ message: payload })

    } catch (error) {
      return res.status(400).json({ error: JSON.stringify(error) })
    }
  },
  assignLoteToNewUser: async (req, res) => {

    const { body, params } = req
    try {
      // buscamos si existe el documento
      const isExsit = await MayaService.findMailCliente(body.email)
      if (isExsit.length > 0) throw new Error('El usuario ya existe')
 
      // creamos el usaurio
      const payload = await MayaService.assignLoteToNewUser(body, params)      
      if (!payload) throw new Error('Error en la asignacion del documento')

      return res.status(200).json({ message: payload })

    } catch (error) {
      return res.status(400).json({ error: JSON.stringify(error) })
    }

  },
  getAllClientes: () => {},
  getClienteById: async (req, res) => {

    try {
      const query = await MayaService.getClienteById(req.params.id)
      if (!query) throw new Error('No hay datos con el id')

      return res.status(200).json({ message: query })

    } catch (error) {
      return res.status(400).json({ error })
    }
  },
  getAllLotesByProyectId: async (req, res) => {
    const { idProyecto } = req.params

    try {

      const payload = await MayaService.getAllLotesByProyectId(idProyecto)
      if (!payload) throw new Error(`No se encontraron registos con el id ${idProyecto}`)
      return res.status(200).json({ message: payload.flat() })

    } catch (error) {
      return res.status(400).json({ error: JSON.stringify(error) })
    }

  },
  findCliente: async ({ query }, res) => {

    try {
      const payload = await MayaService.findCliente(query)
      if (!payload) throw new Error('No hay información con el parametro de busqueda')

      return res.status(200).json({ message: payload })

    } catch (error) {
      return res.status(400).json({ message: error })
    }
  },
  findMailCliente: async ({ query }, res) => {

    try {
      const payload = await MayaService.findMailCliente(query)
      if (!payload) throw new Error('No hay información con el parametro de busqueda')

      return res.status(200).json({ message: payload })

    } catch (error) {
      return res.status(400).json({ message: error })
    }

  },
  lotesByIdCliente: async (req, res) => {

    const { id } = req.params

    try {
      const payload = await MayaService.lotesByIdCliente(id)
      if (!payload) throw new Error('No hay lotes para el id del usuario')

      return res.status(200).json({ message: payload }) 

    } catch (error) {
      return res.status(400).json({ message: error })
    }

  },
  addPagoToLote: async ({ body }, res) => {
    
    try {
      const payload = await MayaService.addPagoToLote(body)  
      if (!payload) throw new Error('no se pudo guardar el pago')
      return res.status(200).json({ message: payload })

    } catch (error) {
      return res.status(400).json({ message: error })
    }
  },
  getPagosByClienteAndProject: async (req, res) => {

    const { clienteId } = req.params

    try {
      const payload = await MayaService.getPagosByClienteAndProject(clienteId)
      if (!payload) throw new Error('No hay datos para tu busqueda')

      return res.status(200).json({ message: payload })

    } catch (error) {
      return res.status(400).json({ message: error })
    }
  },
  infoToInvoiceById: async ({ params }, res) => {

    try {
      const payload = await MayaService.infoToInvoiceById(params)
      if (!payload) throw new Error('No hay datos con ese id')

      return res.status(200).json({ message: payload })

    } catch (error) {
      return res.status(200).json({ message: error })
    }
  },
  statusPaymentByLoteId: async ({ params }, res) => {

    try {
      const payload = await MayaService.statusPaymentByLoteId(params)
      if (!payload) throw new Error('No hay datos con ese id')

      return res.status(200).json({ message: payload })

    } catch (error) {
      return res.status(200).json({ message: error })
    }
  },
  PagarNota: async ({ params, body }, res) => {
    
    try {
      const payload = await MayaService.PagarNota(params, body)
      if (!payload) throw new Error('No hay datos con ese id')

      return res.status(200).json({ message: payload })

    } catch (error) {
      return res.status(200).json({ message: error })
    }
  }

}
