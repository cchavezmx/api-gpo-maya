const express = require('express')
const router = express.Router()

router.use(express.urlencoded({ extended: true }))
router.use(express.json({ extended: true }))

const { MayaController } = require('../controllers')

router.post('/api/v1/login', MayaController.login)
router.post('/api/v1/register', MayaController.register)

router.post('/api/v1/add/proyecto', MayaController.addProyecto)

// todos LOS PROYECTOS ACTIVOS
router.get('/api/v1/proyectos', MayaController.getAllProyectos)

// projecto por id
router.get('/api/v1/proyecto/:id', MayaController.getProyectoById)

// clientes
router.post('/api/v1/add/cliente', MayaController.addCliente)

// lotes por id de cliente
router.get('/api/v1/lotes/cliente/:id', MayaController.lotesByIdCliente)

// buscar cliente
router.get('/api/v1/search/cliente', MayaController.findCliente)

// buecar cliente por email
router.get('/api/v1/search/email/cliente', MayaController.findMailCliente)

// todos los clientes
router.get('/api/v1/cliente', MayaController.getAllClientes)

// clientes por id
router.get('/api/v1/cliente/:id', MayaController.getClienteById)

// todos los lotes por id de proyecto
router.get('/api/v1/lotes/proyecto/:idProyecto', MayaController.getAllLotesByProyectId)

// COMPUESTOS
// Crear usuario y añadirlo a nuevo proyecto
router.post('/api/v1/assign/lote/user/:idProyecto/', MayaController.assignLoteToNewUser)

// Añadir lote a cliente existente
router.post('/api/v1/add/lote/user/:idProyecto/', MayaController.assignLote)

// LEER INFORMACION DE PAGO
router.get('/api/v1/showinfoinvoice/:idPago', MayaController.infoToInvoiceById)

// agregar pago de lote por projecto
router.post('/api/v1/lote/pago', MayaController.addPagoToLote)

// todos los pagos de cliente por proyecto
router.get('/api/v1/cliente/pagos/:clienteId', MayaController.getPagosByClienteAndProject)

// generar estadisitcas de pago del cliente por proyecto
router.get('/api/v1/status/payment/lote/:loteId', MayaController.statusPaymentByLoteId)

// Liquidar pago
router.patch('/api/v1/pagarnota/:idPago', MayaController.PagarNota)

// rutas PDF
router.post('/api/v1/pdf', MayaController.createInvoice)
// router.get('/api/v1/invoice/:folio', MayaController.getInvoiceId)

// Routes de busqueda de niños
router.get('/api/v1/search', MayaController.findUser)

// TODO CLERAR RUTA DE PAGOS POR CLIENTE Y PROJECTO
// insertamos por query el id del cliente
router.get('/api/v1/pagos/:idProject', MayaController.getPagosByProject)

// ruta completa de cliente, 
// lotes activos, pagos realizados

module.exports = router
