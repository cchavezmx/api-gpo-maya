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
      const payload = await MayaService.createCLient(body)
        .catch(error => {
          if (error) {
            throw new Error('Error en la creacion del documento')
          }
        })

      return res.status(200).json({ message: payload })

    } catch (error) {
      return res.status(400).json({ error })
    }
  },
  assignLoteToNewUser: async (req, res) => {

    const { body, params } = req
    try {
      // creamos el usaurio
      const payload = await MayaService.assignLoteToNewUser(body, params)      
      if (!payload) throw new Error('Error en la asignacion del documento')

      return res.status(200).json({ message: payload })

    } catch (error) {
      return res.status(400).json({ error: JSON.stringify(error) })
    }

  },
  getAllClientes: () => {},
  getClienteById: () => {},
  getAllLotesByProyectId: async (req, res) => {
    const { idProyecto } = req.params

    try {

      const payload = await MayaService.getAllLotesByProyectId(idProyecto)
      if (!payload) throw new Error(`No se encontraron registos con el id ${idProyecto}`)
      return res.status(200).json({ message: payload.flat() })

    } catch (error) {
      return res.status(400).json({ error: JSON.stringify(error) })
    }

  }

}
