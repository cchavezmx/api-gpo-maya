const { Proyecto, Clientes, Lotes, Pagos } = require('../models')
const mongoose = require('mongoose')
const { NumerosaLetras, dateIntlRef, monyIntlRef } = require('../util/numerosLetas')

module.exports = {
  addProyecto: async (payload) => {
    return new Proyecto(payload).save()
  },
  // 
  getAllProyectos: async () => {

    const agg = [
      {
        $match: {
          isActive: true
        }
      }, {
        $lookup: {
          from: 'lotes', 
          localField: '_id', 
          foreignField: 'proyecto', 
          as: 'activos'
        }
      }
    ]
    
    const query = new Promise((resolve) => {
      resolve(
        Proyecto.aggregate(agg)
      )
    }).then(res => res)  

    return await query
    
  },
  // 
  getProyectoById: async (id) => {

    const agg = [
      {
        $match: {
          proyecto: mongoose.Types.ObjectId(id)
        }
      }, {
        $lookup: {
          from: 'clientes', 
          localField: 'cliente', 
          foreignField: '_id', 
          as: 'clienteData'
        }
      }
    ]

    const query = new Promise((resolve) => {
      resolve(
        Lotes.aggregate(agg)
      )
    }).then(res => res)

    const resultQuery = await Promise.all([query])
      .then(res => res[0])
    return resultQuery
  },
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
  assignLote: async (payload, { idProyecto }) => {
    const datalote = {
      proyecto: idProyecto,
      cliente: payload.idUser,
      lote: payload.lote,
      manzana: payload.manzana,
      precioTotal: payload.precioTotal,
      enganche: payload.enganche,
      financiamiento: payload.financiamiento,
      plazo: payload.plazo,
      mensualidad: payload.mensualidad
    }

    const newLote = new Promise((resolve) => {
      resolve(
        new Lotes(datalote).save()
      )  
    })

    return Promise.all([newLote])
      .then(res => res)
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
  getPagosByProject: async ({ idcliente }, { idProject }) => {
    const agg = [
      [
        {
          $match: {
            proyecto: mongoose.Types.ObjectId(idProject)
          }
        }, {
          $match: {
            cliente: mongoose.Types.ObjectId(idcliente)
          }
        }
      ]
    ]

    const pagos = new Promise((resolve) => {
      resolve(
        Pagos.aggregate(agg)
      )
    })
      .then(res => res)

    return await Promise.all([pagos])
      .then(res => res[0])

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
  },
  createInvoice: async (body, query) => {

    const { mensualidad, dataClient, fechaPago, dataLote, mes, ctaBancaria, banco, refBanco, dataProject } = body

    const letrasToTexto = NumerosaLetras(mensualidad)
    const precioMensualidad = monyIntlRef(+mensualidad)
    const lafecha = dateIntlRef(fechaPago, 'full')
    /**
     * TODO 
     * el folio y el numero de mensualidad debe salir del length de pedidos
     */
    const textoDescription = `
    Mensualidad 28 de ${dataLote[0].plazo}
    correspondiente al mes
    de ${dateIntlRef(mes, 'medium')} / Proyecto: ${dataProject[0].title}
    / Lote: ${dataLote[0].lote} / 
    Pago recibido en la cuenta bancaria 
    ${ctaBancaria} del Banco
    ${banco} con número de
    referencia ${refBanco} en
    ${dateIntlRef(fechaPago, 'medium')}
    `

    const webTemplate = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <style>
        
        body{
          display: flex;
          justify-content: center;
          font-family: Arial, Helvetica, sans-serif;
        }
    
        .logo{
          width: 200px;
          height: auto;
        }
    
        .container{
          width: 800px;
        }
    
        .header{
          padding: 10px;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
    
        .header *{
          margin: 0;
          padding: 0;
          line-height: normal;
        }
    
        .under__line{
          text-decoration: underline;
        }
    
        .header > h2{
          font-weight: normal;
          font-size: 21px;
        }
        
        .datos__cliente{
          display: flex;
          border: 2px solid black;
          width: 800px;
          height: fit-content;
          padding: 4px;
          box-sizing: border-box;
          font-size: 13px;
          line-height: 16px;
    
        }
    
        .datos__cliente span{
          display: flex;
          padding: 12px;
        }
    
        .datos__cliente span:first-child{
          margin: 21px 20% 0 0;
          text-transform: uppercase;
        }
    
        .datos__cliente > div span:first-child{
          margin: 1px;
    
        }
    
        .datos__cliente span p:first-child{
          font-weight: bold;
          margin-right: 10px;
          align-items: flex-start;
        }
    
        .datos__invoice{
          height: fit-content;
          width: 100%;
          margin: 21px 0;
          
        }
    
        .tabla__pagos{
          padding: 0;
          border-collapse: collapse;
        }
    
        .tabla__pagos thead{
          background-color: #5c5c5c;
          font-size: 12px;  
        }
    
        .tabla__pagos thead th{
          width: 160px;
          padding: 2px;
          text-align: left;
          border: 2px solid black;
          
        }
    
        .tabla__pagos tbody td{
          text-align: center;
        }
    
        .tabla__pagos tbody td:nth-child(2){
          text-align: left;
        }
    
        .observaciones{
          font-size: 13px;
          border: 2px solid black;
          border-bottom: transparent;
          display: flex;
          justify-content: space-between;
        }
    
        .observaciones p:first-child{
          font-weight: bold;
          margin: 10px;
        }
    
        .top_border{
          border-top: transparent;
          border-bottom: 2px solid black;
          display: flex;
          flex-direction: column;
        }
    
        .linea__total{
          margin-top: 80px;
          margin-right: 2px;
          border-top: 2px solid black;
          width: 240px;
        } 
    
        .total__numeros{
          display: flex;
          justify-content: space-between;
          font-weight: bold;
        }
        
        .observaciones img{
          width: 400px;
          height: auto;
          object-fit: contain;
          margin-left: 40px;
        }
    
        .comentarios{
          display: flex;
          flex-direction: column;
        }
    
        .comentarios li{
          margin: 15px;
        }
    
        .font_blue{
          color: blue;
          font-weight: bold;
        }
    
        .font_red{
          color: red;
          font-weight: bold;
        }
        
      </style>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>RECIBO DE PAGO</title>
    </head>
    <body>
    <div class="container">
    
      <section class="header">
        <img src="https://firebasestorage.googleapis.com/v0/b/gpo-maya.appspot.com/o/logo.png?alt=media&token=31e8e01e-09ff-4d9d-a73b-688b5506743f" alt="logo de la empresa grupo maya es una piramide y el mar" class="logo">    
          <h2>XAVIER JULIANO NIETO VARGAS</h2>
            <p>RFC:NIVX7704159Y2</p>
            <p>Av. Playa Mocambo 768 Bis Mz. 24 Lt. 4</p>
            <p>Municipio de Solidaridad, Ciudad Playa del Carmen, Quintana Roo</p>
            <h1 class="under__line">RECIBO DE PAGO</h1>
      </section>
    
      <section class="datos__cliente">
        <span>
          <p>RECIBI DE:</p>
          <p>${dataClient[0].nombre}</p>
        </span>
        <div>
          <span>
            <p>Fecha:</p>
            <p>${lafecha}</p>
          </span>
          <span>
            <p>Folio:</p>
            <p>4326</p>
          </span>
        </div>
      </section>
      <section class="datos__invoice">
        <table class="tabla__pagos">
          <thead>
            <th>Cantidad</th>
            <th>Descripción</th>
            <th>Descuento</th>
            <th>Precio unitario</th>
            <th>Importe</th>
          </thead>
          <tbody>
            <td>
              <p>1.0</p>
            </td>
            <td>
              <p>
                ${textoDescription}
              </p>
            </td>
            <td>
              <p>0.0%</p>
            </td>
            <td>
              <p>${precioMensualidad}</p> 
            </td>
            <td>
              <p>${precioMensualidad}</p> 
            </td>
          </tbody>
        </table>
    
      </section>
      <section class="observaciones">
        <p>IMPORTE CON LETRA <br/>${letrasToTexto}</p>
        <span>
          <div class="linea__total"/>
          <span class="total__numeros">
            <p>TOTAL</p>
            <p>${precioMensualidad}</p>
          </span> 
        </span>
      </section>
      <section class="observaciones top_border">
        <img src="https://firebasestorage.googleapis.com/v0/b/gpo-maya.appspot.com/o/firmas.png?alt=media&token=c1471ce2-be3d-4c58-9727-a36b5de2af47"/>
        <div class="comentarios">
          <ul>
            <li>
              Recuerde que si paga dentro de los 5 días naturales siguientes a la fecha estipulada en su contrato, sigue siendo acreedor al crédito sin intereses, después del día 5 el interés es del 10%
            </li>
            <li>
              Es obligatorio realizar su pago con su referencia, que son las iniciales de su nombre y el número de lote. Ejemplo: correcto: <span class="font_blue">jjgs46.</span> <span class="font_red">Incorrecto: pago terreno, nombre de la persona, lote tulum</span>  
            </li>
          </ul>
        </div>
      </section>
      </div>
    </body>
    </html>    
    `
    return webTemplate

  },
  findUser: async (query) => {
    const araryQuery = query.split(' ').map(query => new RegExp(`${query}.*`, 'i'))

    const userList = new Promise((resolve) => {
      resolve(
        Clientes
          .aggregate()
          .match({ nombre: { $all: araryQuery } })
      )
    }).then(res => res)

    const responseQuery = await Promise.all([userList])
      .then((res) => {
        return res[0]
      })

    return responseQuery

  }
}
