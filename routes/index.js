const express = require('express')
const router = express.Router()

router.use(express.urlencoded({ extended: true }))
router.use(express.json({ extended: true }))

const { MayaController } = require('../controllers')

router.post('/api/v1/login', MayaController.login)
router.post('/api/v1/register', MayaController.register)

router.post('/api/v1/add/proyecto', MayaController.addProyecto)
router.get('/api/v1/proyectos', MayaController.getAllProyectos)
router.get('/api/v1/proyecto/:id', MayaController.getProyectoById)

// clientes

router.post('/api/v1/add/cliente', MayaController.addCliente)
router.get('/api/v1/cliente', MayaController.getAllClientes)
router.get('/api/v1/cliente/:id', MayaController.getClienteById)

// todos los lotes por id de proyecto
router.get('/api/v1/lotes/proyecto/:idProyecto', MayaController.getAllLotesByProyectId)

// COMPUESTOS
router.post('/api/v1/assign/lote/user/:idProyecto/', MayaController.assignLoteToNewUser)

module.exports = router
