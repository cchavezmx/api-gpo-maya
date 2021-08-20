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
  },
  createInvoice: async (body, query) => {
    console.log({ body, query })

    const webTemplate = `
    <!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<HTML>
<HEAD>
<META http-equiv="Content-Type" content="text/html; charset=UTF-8">
<TITLE>pdf-html</TITLE>
<META name="generator" content="BCL easyConverter SDK 5.0.252">
<STYLE type="text/css">

body {margin-top: 0px;margin-left: 0px;}

#page_1 {position:relative; overflow: hidden;margin: 83px 0px 75px 83px;padding: 0px;border: none;width: 733px;height: 898px;}

#page_1 #p1dimg1 {position:absolute;top:0px;left:0px;z-index:-1;width:650px;height:898px;}
#page_1 #p1dimg1 #p1img1 {width:650px;height:898px;}




#page_2 {position:relative; overflow: hidden;margin: 72px 0px 887px 83px;padding: 0px;border: none;width: 733px;height: 97px;}

#page_2 #p2dimg1 {position:absolute;top:3px;left:0px;z-index:-1;width:650px;height:94px;}
#page_2 #p2dimg1 #p2img1 {width:650px;height:94px;}




.dclr {clear:both;float:none;height:1px;margin:0px;padding:0px;overflow:hidden;}

.ft0{font: 18px 'Arial';line-height: 21px;}
.ft1{font: 16px 'Arial';line-height: 18px;}
.ft2{font: bold 24px 'Arial';text-decoration: underline;line-height: 29px;}
.ft3{font: bold 13px 'Arial';line-height: 16px;}
.ft4{font: 13px 'Arial';line-height: 16px;}
.ft5{font: 1px 'Arial';line-height: 1px;}
.ft6{font: 1px 'Arial';line-height: 17px;}
.ft7{font: 1px 'Arial';line-height: 16px;}
.ft8{font: bold 8px 'Arial';line-height: 10px;}
.ft9{font: bold 9px 'Arial';line-height: 11px;}
.ft10{font: 1px 'Arial';line-height: 13px;}
.ft11{font: 15px 'Arial';line-height: 17px;}
.ft12{font: 9px 'Arial';line-height: 12px;}
.ft13{font: 9px 'Arial';text-decoration: underline;line-height: 12px;}
.ft14{font: 10px 'Arial';line-height: 13px;}
.ft15{font: 8px 'Arial';line-height: 10px;}
.ft16{font: 13px 'Arial';line-height: 20px;}
.ft17{font: italic bold 16px 'Arial';color: #0000ff;line-height: 19px;}
.ft18{font: italic bold 16px 'Arial';color: #ff0000;line-height: 19px;}
.ft19{font: 16px 'Arial';line-height: 19px;}

.p0{text-align: left;padding-left: 185px;margin-top: 102px;margin-bottom: 0px;}
.p1{text-align: left;padding-left: 250px;margin-top: 0px;margin-bottom: 0px;}
.p2{text-align: left;padding-left: 190px;margin-top: 0px;margin-bottom: 0px;}
.p3{text-align: left;padding-left: 106px;margin-top: 0px;margin-bottom: 0px;}
.p4{text-align: left;padding-left: 221px;margin-top: 0px;margin-bottom: 0px;}
.p5{text-align: left;padding-left: 7px;margin-top: 0px;margin-bottom: 0px;white-space: nowrap;}
.p6{text-align: left;margin-top: 0px;margin-bottom: 0px;white-space: nowrap;}
.p7{text-align: left;padding-left: 62px;margin-top: 0px;margin-bottom: 0px;white-space: nowrap;}
.p8{text-align: right;padding-right: 149px;margin-top: 0px;margin-bottom: 0px;white-space: nowrap;}
.p9{text-align: left;padding-left: 66px;margin-top: 0px;margin-bottom: 0px;white-space: nowrap;}
.p10{text-align: right;padding-right: 65px;margin-top: 0px;margin-bottom: 0px;white-space: nowrap;}
.p11{text-align: left;padding-left: 1px;margin-top: 0px;margin-bottom: 0px;white-space: nowrap;}
.p12{text-align: right;padding-right: 119px;margin-top: 0px;margin-bottom: 0px;white-space: nowrap;}
.p13{text-align: left;padding-left: 2px;margin-top: 0px;margin-bottom: 0px;white-space: nowrap;}
.p14{text-align: right;padding-right: 43px;margin-top: 0px;margin-bottom: 0px;white-space: nowrap;}
.p15{text-align: right;padding-right: 4px;margin-top: 0px;margin-bottom: 0px;white-space: nowrap;}
.p16{text-align: right;padding-right: 3px;margin-top: 0px;margin-bottom: 0px;white-space: nowrap;}
.p17{text-align: left;padding-left: 7px;margin-top: 43px;margin-bottom: 0px;}
.p18{text-align: left;padding-left: 7px;margin-top: 2px;margin-bottom: 0px;}
.p19{text-align: left;padding-left: 441px;margin-top: 21px;margin-bottom: 0px;}
.p20{text-align: left;padding-left: 9px;margin-top: 0px;margin-bottom: 0px;white-space: nowrap;}
.p21{text-align: left;padding-left: 46px;padding-right: 115px;margin-top: 13px;margin-bottom: 0px;}
.p22{text-align: left;padding-left: 46px;margin-top: 0px;margin-bottom: 0px;}
.p23{text-align: left;padding-left: 46px;padding-right: 90px;margin-top: 2px;margin-bottom: 0px;}

.td0{border-left: #000000 1px solid;border-top: #000000 1px solid;padding: 0px;margin: 0px;width: 276px;vertical-align: bottom;}
.td1{border-top: #000000 1px solid;padding: 0px;margin: 0px;width: 104px;vertical-align: bottom;}
.td2{border-right: #000000 1px solid;border-top: #000000 1px solid;padding: 0px;margin: 0px;width: 268px;vertical-align: bottom;}
.td3{padding: 0px;margin: 0px;width: 104px;vertical-align: bottom;}
.td4{padding: 0px;margin: 0px;width: 257px;vertical-align: bottom;}
.td5{border-right: #000000 1px solid;padding: 0px;margin: 0px;width: 11px;vertical-align: bottom;}
.td6{border-left: #000000 1px solid;padding: 0px;margin: 0px;width: 104px;vertical-align: bottom;}
.td7{padding: 0px;margin: 0px;width: 172px;vertical-align: bottom;}
.td8{border-right: #000000 1px solid;padding: 0px;margin: 0px;width: 268px;vertical-align: bottom;}
.td9{border-left: #000000 1px solid;border-bottom: #000000 1px solid;padding: 0px;margin: 0px;width: 104px;vertical-align: bottom;}
.td10{border-bottom: #000000 1px solid;padding: 0px;margin: 0px;width: 172px;vertical-align: bottom;}
.td11{border-bottom: #000000 1px solid;padding: 0px;margin: 0px;width: 104px;vertical-align: bottom;}
.td12{border-bottom: #000000 1px solid;padding: 0px;margin: 0px;width: 153px;vertical-align: bottom;}
.td13{border-right: #000000 1px solid;border-bottom: #000000 1px solid;padding: 0px;margin: 0px;width: 11px;vertical-align: bottom;}
.td14{border-bottom: #000000 1px solid;padding: 0px;margin: 0px;width: 105px;vertical-align: bottom;}
.td15{padding: 0px;margin: 0px;width: 12px;vertical-align: bottom;}
.td16{border-left: #000000 1px solid;border-right: #000000 1px solid;border-bottom: #000000 1px solid;padding: 0px;margin: 0px;width: 103px;vertical-align: bottom;background: #8f8f80;}
.td17{border-right: #000000 1px solid;border-bottom: #000000 1px solid;padding: 0px;margin: 0px;width: 171px;vertical-align: bottom;background: #8f8f80;}
.td18{border-right: #000000 1px solid;border-bottom: #000000 1px solid;padding: 0px;margin: 0px;width: 103px;vertical-align: bottom;background: #8f8f80;}
.td19{border-right: #000000 1px solid;border-bottom: #000000 1px solid;padding: 0px;margin: 0px;width: 152px;vertical-align: bottom;background: #8f8f80;}
.td20{padding: 0px;margin: 0px;width: 105px;vertical-align: bottom;}
.td21{padding: 0px;margin: 0px;width: 153px;vertical-align: bottom;}
.td22{padding: 0px;margin: 0px;width: 166px;vertical-align: bottom;}
.td23{padding: 0px;margin: 0px;width: 134px;vertical-align: bottom;}

.tr0{height: 39px;}
.tr1{height: 22px;}
.tr2{height: 17px;}
.tr3{height: 50px;}
.tr4{height: 16px;}
.tr5{height: 12px;}
.tr6{height: 13px;}
.tr7{height: 21px;}
.tr8{height: 18px;}
.tr9{height: 20px;}

.t0{width: 649px;margin-top: 8px;font: 16px 'Arial';}
.t1{width: 300px;margin-left: 33px;margin-top: 140px;font: 8px 'Arial';}

</STYLE>
</HEAD>

<BODY>
<DIV id="page_1">
<DIV id="p1dimg1">
<IMG src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAosAAAOCCAIAAACQ8A88AAAgAElEQVR4nOzdeZxlVXnv/2etPZ2hqrp6YBKEyyyTigrSooBTlCFGRSUGLkRRccCEKFGIExiNIporGFDByKAYJ1QiRJEQUFAJXkQEf8g8NPPQXeMZ9rDW74+na3Oo6m6bXOheXf15v3j5qtpnn332Plh891p7rWcZ770ACElRFEmSiEhZllEUGWNERP9U9WflvR/8FcA8Y9f3CQCYLYqisiz1Z2PMxMTEnXfeOT4+bozx3jvn+v0+8QzMe/H6PgEA4pzT9DXGTE9PDw8Px3HcaDScc1VVxXEcRVFRFDLThq6qqiiK22+/feutt64PEkXRersAAM8AQy83sN5VVRVF0eOPP75kyZJ2u11VlbW20+kYYw499NCDDjpos802e+yxx6699tozzjjDGDM0NNTv96Mo8t5fc801u+++exRFepD1fSkAnjYkNLCeadM5TdM0Tb333vutttrqlltuMcY450TEWlvvKSK6/a/+6q++//3vt9tt51yn09Fecfq9gfmE59DA+lSW5QMPPBBFUaPRsNYefPDBY2Njt956q2attbaOZxExxtTbL7jggjzP77vvvjzPsywbHh6+6KKLJiYm1tuVAHi60YYG1puiKNI0bbfbcRy/5S1vOeuss6qqMsYMpvKa1a3qJUuWdDqdbreb57mOAwewoSOhgfWj0+mMjo4mSdLpdLQ3e1Yf9fKyHHXeppETIyJGjIj4qldIQ2yRmSfFsHMujuNms9ntdoui4IE0MA/Qyw2sa1VVicjnP//5oaGhqqr017mPkBdZn1tbls6KsWKML4wvulEji8rEuVk7W2v1gXSj0ciyzDlXz9cCsIFithWwrkVRpOPCut3u+Pi4936V3dqVMVd95MCdl/2X+FhEnI1F5NbJ/M/+PbdzWshlWcZxXFVVlmXNZjOKojzPn/lLAfAMog0NrGvf+973siyL47goiqGhodX1SHsTZ7f/Z98bKyLOeUk6venhqpCi8tXsv9w4jkXEWjs1NTU1NdVutw866CBCGtigkdDAOuW9P/LII0Xk1FNPXfOIMOPEe1OKLO/2V3jp5P3RZMGfPH6SJNq//atf/coYo3VOAGyI6OUG1hHvfVVVl1xySZqmExMT73jHO5xzc0PaV+JsKSLexj4xj+X2pT90xosY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ODXtVb7gggtmPWrV3bQ+iTYxe72e1irZdNNNZ53etttuq6U9sywry1JHaa29OI47nU5RFNpmHUxi59zQ0FBZlp1Op9vtrvLtSZIsXbpUz1+DNssyPXNdt8M5Nz4+rm103U3Tt91ua4f2Jz7xicEDDg8Pa3L3+/3p6WmtRv6UrgjYqPDngfls1tilpzqZeJWFQVZ3hDiOoyjSEK2qSqO6Hq5V025zPY4evCgKbWfrS3Vo6bPqsiy73e6JJ544OGZtLTvbtYW6xx57aPCPj4/XLyVJog+n0zRdXUPWOZemqd5S7L///jq07ctf/rJ+M3EcW2tvvPFGEUnTtD69hQsXeu/Lspyenh48T72WsiynpqbKsozjeO6XA2AQCQ08/d72trfJTE4/pTcOxnAcx81mM0mSsiz//u//XodhL126dDDF18Zvf/tbnbq9aNGiurm8/fbb93q9OI51Wtoq36hdCNol8O///u96i/P+979/cJ/dd989iiJt39cdADp7bda1aw9EVVVf/OIXtdPbe//hD394zTPCgY0ZCQ08/X79618bY+I4Xpulmgeb6dpu1p//4i/+Is9zfXBbF0K55ppr6oFXa0lnLevP9Qy0u+66S1vP2vRf5Ru32247jdXnPOc5epAoinTY+aDp6ekoirz3F110kaZ4VVV1pfF6N+0GbzQa73//+3/3u9/poPovfOELlC8FVofJiMBqZVm2dOnSWRu/+c1vbr/99qvcvy7MefvttydJoh3dqzu4dgXHcazDyups1uiy1v74xz9utVre+5/85CfW2izL8jxvNpuzBnj/SXqvUFVVs9ksikIbu+12W3vX9YnyKu8kHn744VarVVXVd7/7XW3Kx3E8q8nrnLv//vt32mkna+2hhx76i1/8QrN8enp61mNvHRmgb999992rqkrTtNFo6F3C2l8OsPHgDwNYrX6/f911181Nr9XN16oXtxgaGur3+yJy9NFHr+7gurOOsdJcf/TRR7VXWfu6syzTpvNrXvMafXyr8XzJJZccfPDBa38VOkpci5PouHE9ySRJjjjiCFnVWG59It5qtYqiiKJo9913F5Fer6dFx2699da6Zou1dosttpiens6ybGhoaL/99mu32zpuTnfQyi1aekyfqevH6Zl474lnYHXo5QZWa7DER02fzs7aWFXVMccco8UvR0dHdZ9+v3/mmWfO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qj+/6EUvWrp06fHHHz8rbpcuXappsd9++z344IN1onQ6nf3333/fffc99dRTB4+mwXnGGWdYa3faaSfzpxZvNsa86lWvGhxKba094IADzMyaknvttVe9p4gcdthh++23X/3q61//+he96EV1V7nWLNPGrjHmxBNPHPwsXThyr732eulLX/roo48OTqGuqqr+IL2KK6644uKLL9YxYvXGoij23XffuZfwZ3/2Z/fdd9+s25SPf/zje++991577fXjH/94cGcRednLXjZYNE1EoihaunSptfbd7363Pk1Yw9xxYCM1dxQMsKFzzvV6vXa7LSKbbbbZyMiI9kXXHnnkkSRJ6orQupCzvnF4eFjTwhhzySWX1G+5//770zTVR8uDw8eccwsWLIjjeMcddxSRZrN5xx13rPn0oih66KGH9OeiKCYnJ7XFWa8nXe+p9xl1v3qv19MGuj7xVffdd59W8dSB3/WjcfW5z31OE7fdbo+NjQ0+Vtd1qFSn0znxxBOPPvpo773OXVYrVqzQhToGTU5O6mzvunCKGh4e1q9US54NvqQraQ5uEZFGo3HQQQcNDQ1p9/vcR/7ARo42NOahqqoajca1115bVdV999338MMPa7EO5b3X1qGuVzE8POwH2sT1nF3vfT1YWnvC9cnrvffeOziI+oEHHvDe93q9W2+9taqqT3ziE7vuuusazs17r8fRX7X7Wgt5djqdWTvrSLEsy5IkyfP8y1/+8qw1qbz3u+2227HHHpvn+TXXXKMHX7ZsmZtZd3Lw5uOqq64abPUO/qzJWk/Org9eryc9+N0ODw/vsMMOQ0ND/snPyEZHRzWzx8bGdMj34HnWdKjaS1/60omJiUsuuWRiYsI5d/nll9OGBmYhoTEPRVHUaDSe85zn/PKXvzzuuOM+8IEPHHvssTfddNNgoujso8MOO2xycnItH4LqW7bccsvB8dgXXnjhxMSEtlONMR/+8If1gfRTOuE4jm+77bbFixev8tUf//jHrVYry7Ljjz/+a1/72qwO4X6/f8opp9Td4FVVXXnllYMpnmWZZucrX/nKPM+f0onN5ZxrNps33HDD5OTkxRdfLAMjwrR2mIg0Go01VETREQA///nP61uE008//QMf+MAaJo4DGyf+JDAPVVXV6/XKsrz22mvPOOOMr3zlK1//+td1Sz1WWZvFP/zhDwcfG9fjujWD6wiphzq/5jWv+dKXvjQYwHvvvfeCBQt0/zzPf/7zn2dZFsfx6p5G68HriK1HgW2++eZz12zWzvY8z6empnR55nvvvVeePPLcWqulUXRxrWazucMOO+ivevxer7d8+XItilKPYqsHrNXqeV+DE7HqkWXOOb3qO+64o9ls6sY3vOENg9wN/VoAACAASURBVLXHdYehoaFVFiSvj6YXdfrpp9fHPO64404++WTPqFXgyUhozE9f/epXh4eHP/jBDzrnXv/614vInnvuqaWw62lRuhjiYJT2er0kST70oQ9574eGhnbZZRf/5EFhP/rRj44++ujB+Nlrr710nQwRybLsjW98Y128epUnpl3Hc1/1MzOw544St9Zed911Bx98sJ8zN0xEOp3On//5n+vkrk996lNlWeopzRoTLjPzv3Xj3ILhZmZVysEhXfV7dW0r7/2uu+6q06CrqlqwYMHgyDJ12GGHDQ8Pr6FAmLV2fHz8k5/85PT0dBRFX/nKV0ZGRt74xjeS0MAszEHEPBTH8Tvf+c4ttthCcyKOY2221iO8dChTURQXX3xxmqZ1NiRJ8vjjjydJcuqpp5577rmLFy8eTBrNb3lyQEZRND09rZ3M3vsbb7xx5513XsP0p6qq5vaBdzodPebk5GRduKOeWDw0NPTc5z5Xq6B87nOfk5npyDLTY3zvvfdq81QfPM8aNS0z07F6vd7gPKjB+wxdvePss8/WXvT6C/HedzodncmtX50x5uCDD9a2+9jY2GA9bQ34s8466+KLL06SZFZtlsFVJtvt9l133TU6Oioz629ql8bqvjRg48R8aMx/eV5G1kVSStzoi81m5gfrJJ+ZCiEivhKTiEjV7dtGKqY08qTn09oydjaKvFjXlzipvItMLCL9fj9JEs0Y55wx3pioEnGlRCJ2IK/rj6631NOsV1eiZFahDy0FOjfP6hFhs0qyDDaX63uLlWU7jTXGiPWVKyJj/cwtu/YrrOxysFVkExErUopYkZXlVvSz5tZ18VIYb33pTfLEtdRVQo0x3lfGGFda7yRKZ0/LBlAjoTH/eVdW1lox4rw4b+Mn0q6Oh0rEl3kuEhlbWcmcsTZaZU9tWUkRiZcyFpvKyuoldcUujS5rbeG6sWkYY7oiDV8Z88SH+icXURn8G1xl7/dgza/BymWruNKZcmOrO9qsC3eSi7O+slFkvJ19R6IH9GKsEV92TRRVZRwlzvto8OD1h5bGFUU3MUNJvLKAmogM3nY45yrrEol97qq48CZLTElPHrA6/G1gHsqlTCQupBSJxy7+9O3fOGnrtOyXaeSLojE6+rZTRvZ/Z+YLMeJcv7BDtih++8Vjsmu/1W7m1nlnzb3m2a88/YqJ9jYjcVS68ci2vPelMVe+c5dtpu5oWhmL0kVlcZ/bdJ8LfjER7TRiKy9lZIquaTfdoz/7q+33yKpe2Y1yk8cNe+QZW77irWlknUnFTEemXUXGVs5EImKdMY87OeWLl935mPFl7x+O3WfXZy9oOWdtLCYyUtooMVJ2JP7Wpb//t6tuiavy+btsc8KR+474vkSR9zqaq7Im67v8p9c//OXv3ODKZOHi1v/5+/22iAvnjY+siI2cmMi5qjsWtU//0ndO+ttD+y4du3coi3Nvy57zI0Mfbw59JI6tSN97K6bp3JTY7z1w79/F8UTcT/IonspHdtjhv4pqu8h645omcn0/Id3M+W+OPf6B2EzZvkRJMuk32fp/fb3feU2aWRER5wtjkuqRhx/8q6i4VnzSNJ0yXjBVbrHV1j92ZvNIjBjDf5GAQbShMQ91nCTOJfHYz4983lbuMR8vkP6KLIpy0ysq00jjMd/a7tgvjbzwZWKHxv7963f/2z80UmOcsWIKiTPretY28u5E1z/v3GvsyM4ydufv/u1f02vOa1RR15WxKbzkrpGNdqvSyh/L1gFn/CZdtFgefuzqf3zd1tPLctOUfpGmbiIvGrb0rz5ux6O+4H31rlN+/mBn/HuffEOzLL2zTmwnlbd+7Mr+cOLKpPTd1DfElS3TfN/rt3z1LpuZWESklOq8K+78wVV2wk0M2Z5zTmzkq/hZ2T1f+dAbG1EhXvo2vW7Z+GfPuW7SLWyXXhe9nIxjv/zaC//P2xe7XMy0l3bXRm/88I9ca4cRt+z7Jx/gXGv5vUuKakUjTow3zuZ9P5LIm5Y8+4NiZGrsG52Jc1I3bn1ZpqYojTU+LcsiGR73O27/7JOc2ddW/RXTn+pNnJ9Uk7EbNnHlbKeqGonJXdlcbtJtt/0vI6Mi3Qcf/GxWfV9sP82jwpsy9VJGrX7Wyfq99M+ftfl54hqRfVJnA7CRI6ExD5VSPvLTs3vnvrdKMivlmDPx8w9+9oFvmLj57v/vWydt10ysSUtTWJMm1VReSZomVswdRbTFQe/ZdPs9br3uqq2v/vp0IiZJh6u056b6tmldVVR51Ehu6xR7Hn5q9KxFD110RuvO38e2NC4T4zvGpKaoXCuqplyjvcyO7P2Of5p47L4bvn/WXq96/cL/fVpS9N76scuXj2zR8tGK7iM+7xXZJiNJWiS5LTLvCyMdn3lXLfRmysaL4ulOt788iqJsaEnkXbdy1ufGRJGpxCdFlETS9cWSqnt7VPWSkcVJvElZ9qZM2ShXjk73URI7KTMj3RW2Z2zLTyWbpFW3cG7b6KHzP3ZQ4bPp+49ojOzt8wceXXHewvSxopJO1mzlk7GRKoorb30U552h9vAbs2Tx5ORvrf2lrbpJkbpkurJifeRdbBJTlWbK77x44QFZ9sKp8f/Muz+ypmpFVWnKIpc48VHlc+vFOeefm44e0mi0lj/0X8Zf3bBp5vNHTLbNtv/l5Xlze9qBjRYJjfnGey+d3z/0vr0mq2Q0dYtPuip/9ovSUqKoLE3sJe/f9oubT3ztJs2s9L3p2C/wttP3u/7rdWPt3Rb4lb2sj3opv/s3Exd/2diqHw8P51MSpcsmZb8frHASVxInUvYliaX49Ylv2WrZpYWYtOp0bJwY+WOevfbb91VmQTpzPtb2qyqOovKqP0596Pu3LvAjJp/0SeJdKTYz5dinjthxz522iKTfl/jex+27Pvczk2yZxrn4hrGlRLZv/XbZxKl/95KFXsT6okgPO+kHD9htG8lUnDZExBd5Ebfj6bHvfHL/TSLjfL8q7S3Lzd9+9TonbSvTpU9T62NTlq545wGbvG6/nRpSeJeILcTPLEvlfr3sjgM3jVxhJ60f8XZiMl+85NlfSZM3VdF0Km0vReXsg8ve0E6vrsoVtp8106rrorxINt/+X7w/zPiGiV3hbCJ++cMf9P0zjcujxLtKnJVeuceztvqBT3Yw4sUb5/JCkuX37Jwmj0qvX2bdTbfue19GtrXe/t8DhISExnzjvffO3Pi/0+ed/qtiwY65pI3EGkmNGJGi9JExPe9aPe+HbemN5EWVJXEhVSJP1PKcdlVTvLOx9V1rbFlU3aqRNWwqfZGkV/Uzk3hrrK96Jo28i4w3ZaeIhwvv2saJxCI6l8l678UY4513IlHl+/F4Yv7vLff/9oZ7995zlz12Hl3iO168kTQvvImr2DaLolPGratvmrjpxrsbw81DD9px00jyfjfLmmXVNcZE1kgpzkYrbHz5L+4cG5NDDt5uk8jHla8iG4tUhUSJlJWPpduLWr/4wyN33jW+87YLX7TbkkbRtza2UeR8bk2sRREq17c2llKMjcQW3jtjrJGk9D1rnJVWVfko8l4qXzlvC+dNbAtTOomzqshcbK1IZKxI4X0ipvRVVYmPo4YR8a4vPhGxfTfRSIa8VOITY0ov3lSRi8rKpw/dfUDql49ufVUWL1hP/8cBgkNCY77x3jtXRqZT+VYUJYPb9Yd66HU9kHtwVeZ657qW1ho2zvpBxy3POnitXv9xcKNOnRpcFHLwVOeum7n2X4LWJ5k1fUuvVAZGYtdznevPqidTrfIIs85Q1/IaXJGzfmkNY851yvUTi2iJr8puEk95v8kaxp8DGxumIWK+McZE1opdYOZsV7owlMyU7JientZJvYPFxeqVJzTO6yqYgxtlZpqvzMxy1gnEq0umuTHsvddFt/Ro+r9aXEU/ZbAeyCy6m1bo7Pf7g8W6dbvMTGte5Wnomff7/TomdZWOTqejtxr6uXrDMbdEaP1l6hF0Dlj9tZiZVbQHy7PUJcH9zPLYeZ73+30RyftTSdzq9UaIZ2AQCY35yEQmMkPt0Xa7fdRRR4lIWZbZjCRJoig67rjjsiyLoujoo48WEa24OTIyogeIokhXRWw0Glqk8+abb240GkmSDA8Pf+hDH9LdFi9eHEXR8PCwLqqh/6uZVLcR62y74YYbBsN74cKFaZo2m03ds9/vN5tNa+3ChQsvu+wya+2dd96pZTXb7fZ73vOeoigWLVqUpmmapkmSaH1QXRBzeHh41pIY+mqj0ZhbNFuTVS/qnnvuWbJkSbvdzrLsG9/4hrVWa27fcccdeqrW2htvvHFWWZK3vvWt9Zc5OTlZz9JesGCBllJJkkRrgLdaLW2C66nKTG3R0dFRvQRd42Th8LOMibKZYmoAVvLAfKT1Q7TwpLYCG41Gnud5ntfrOnjvNbfqJuMrXvGKenVnjTfvvS6QfPPNN9d/L3VZEj2CHqRuB3vv6xWmB09JRPbcc8+3ve1t2sYdGRnx3ud5rktWeO+TJNHlPVqtVlVV99xzj7ahvffNZtM5t8kmm9QHr49ZluUXv/jFepVJP1Pfe3x8vD6fmhZA7fV6emdw9913i4h+J/q1OOe03ln9Lf32t7+d9d3+5V/+5QEHHFAUhX7DWmqt1+tdeumlURR1u92yLM844wy9ujzPX/3qV7/qVa86//zzq6rqdDr6dRVFURRFv98/7bTTdE/WhwZmoQ2N+UkfpmpD8De/+Y2INBoNbYB+73vfM8YcccQRw8PDWj66Xtbp8ssv33777TVCoijaeuuttTO2PuwWW2yhtUJlJpLX0BE9S6vVuu6668455xxtcWo/szYlrbW/+tWvrr/+em1W9nq9+hKWLFkSx7FuERFdqUJvDrz3uqDF1NSUZqTu470/4IADtt56a91n8ByMMbvssstOO+2kF6U9841Go9Fo6P3E5z//+aIoWq3WGp5/O+euvfZabb77lQVTTKPR+MlPflKWZaPR0DOs66pedtlll1122ZFHHmmt1X4LEYnjOI7jNE2PO+44ffvqVgMDNlokNOYhPzCOqV6yaWxsrKqqfr9/yCGHeO/PPffcFStWnHXWWZtuuqmIxHHcarWMMe12W5+n5nl+zjnnxHGc57mfGQa1xx576LNVPzCYS2Ye4mrrsy7S6b3X1PHeF0WRZZn2AOt769LW9cH1LkEPrsW6nXMvfOELtemp3QB1A1pX2CyK4ne/+93HP/5x7S7WU7LWXnbZZePj41tuueU3v/nNWV/O6aef/vDDD9ePh/VZsh7fzKxvXVXVZz7zmVkPzmvGmBe/+MWDj+d16YvTTjutXtxTZkaKZVk2NDSkYawXNetfk7ah+/3+GpYbATZOJDTmIT8zmMt732w2d9llFzOzhGKappoE+iD2He94hw6zyrKs7m49++yzvfdpmr785S+/6KKL6sUirbU/+9nP/Exf8Xe+853jjjuuqqr//u//PuCAAzS5tX1cLy9dt0Q/8pGPLF++3Hv/6le/Wnuk6yZjv983xixdunTPPff03t9zzz36sFyT8qc//anMPD/WcVUqjuP77rsviqLnPve5F1544c0331w/cjbG7Lzzzv1+/6GHHjr88MNnfTMHHnhgr9erB6UXRRHHcZIkdXw656ampv7xH/9RD1U3xAeb43pdeoa6Bpe19ve///3gPtpPsNtuu+23335lWRZF8fKXv3zuv6koirQpP2stLAA8h8Y81O12NSmTJLnyyivrHFLacf2zn/2s2Ww2Go0jjzyyLEt92Oy9//nPfy4izjl9Uut1GYyiuOmmm6y12p7Wp8J+ZkxykiT6HFdHisVx/OY3v1k7z5WGcb/f995rDtULSww+q240Grospu551113iYgeeWRkxDmntxeqbscvXLjQWqtvUXqj0Gq19t57b3nyo2gRqapKu7ivuOKKP/7xj2maauM+juP3vOc9df9BvQJHkiR6VtotX1XVoYceWl/aueeeq3cGw8PDWZZNTU15751zuoa0H7hVeuSRR3SFaT2s3qZoT7jm/e23386jaGAQ86ExD01PT2uXtYj0+/0sywafcVZVlaZpnuf6TNfP5Jb2UXvvNc71f+sj6LPqJEl0bNcTc3mdMzOrTumh6gb3rAerZVmmaaqZpN3CWZbVy1ZqOOkPeoaDI8I0nmctoqxDrLW/Os/zRqOhr+Z5rteiZy4Ds58H7yTqFnCWZXoJ9TqY2gPf6XS051zvabRZLyL1N1Nfvn57un52fUdST1TTr0sjeWYBSq+j6/VsdYfBf2sAhIolmK+cc5qI+uvgEst1FY7B0hyavjLwFHnuG9XKe9uZuh/1z2tzSn5mCpbGoQ6kcs7Vjcu6/sngHcPqjl8H6qx9Bs958KZhlVexypdmvaX+xuaezOBi1fUIeQ3pWd+bbqkLudSH0jj/nxVmAeY3EhoAgBAxUgwAgBCR0AAAhIiEBgAgRCQ0AAAhIqEBAAgRCQ0AQIhIaAAAQkRCAwAQIhIaAIAQkdAAAISIhAYAIEQkNAAAISKhAQAIEQkNAECISGgAAEJEQgMAECISGgCAEJHQAACEiIQGACBEJDQAACEioQEACBEJDQBAiEhoAABCREIDABAiEhoAgBCR0AAAhIiEBgAgRCQ0AAAhIqEBAAgRCQ0AQIhIaAAAQkRCAwAQIhIaAIAQkdAAAISIhAYAIEQkNAAAISKhAQAIEQkNAECISGgAAEJEQgMAECISGgCAEJHQAACEiIQGACBEJDQAACEioQEACBEJDQBAiEhoAABCREIDABAiEhoAgBCR0AAAhIiEBgAgRCQ0AAAhIqEBAAgRCQ0AQIhIaAAAQkRCAwAQIhIaAIAQkdAAAISIhAYAIEQkNAAAISKhAQAIEQkNAECISGgAAEJEQgMAECISGgCAEJHQAACEiIQGACBEJDQAACEioQEACBEJDQBAiEhoAABCREIDABAiEhoAgBCR0AAAhIiEBgAgRCQ0AAAhIqEBAAgRCQ0AQIhIaAAAQkRCAwAQIhIaAIAQkdAAAISIhAYAIEQkNAAAISKhAQAIEQkNAECISGgAAEJEQgMAECISGgCAEJHQAACEiIQGACBEJDQAACEioQEACBEJDQBAiEhoAABCREIDABAiEhoAgBCR0AAAhIiEBgAgRCQ0AAAhIqEBAAgRCQ0AQIhIaAAAQkRCAwAQIhIaAIAQkdAAAISIhAYAIEQkNAAAISKhAQAIEQkNAECISGgAAEJEQgMAECISGgCAEJHQAACEiIQGACBEJDQAACEioQEACBEJDQBAiEhoAABCREIDABAiEhoAgBCR0AAAhIiEBgAgRCQ0AAAhIqEBAAgRCQ0AQIhIaAAAQkRCAwAQIhIaAIAQkdAAAISIhAYAIEQkNAAAISKhAQAIEQkNAECISGgAAEJEQgMAECISGgCAEJHQAACEiIQGACBEJDQAACEioQEACBEJDQBAiEhoAABCREIDABAiEhoAgBCR0AAAhIiEBgAgRCQ0AAAhIqEBAAgRCQ0AQIhIaAAAQkRCAwAQIhIaAIAQkdAAAISIhAYAIEQkNAAAISKhAQAIEQkNAECISGgAAEJEQgMAECISGgCAEJHQAACEiIQGACBEJDQAACEioQEACBEJDQBAiEhoAABCREIDABAiEhoAgBCR0AAAhIiEBgAgRCQ0AAAhIqEBAAgRCQ0AQIhIaAAAQkRCAwAQIhIaAIAQkdAAAISIhAYAIEQkNAAAISKhAQAIEQkNAECISGgAAEJEQgMAECISGgCAEJHQAACEiIQGACBEJDQAACEioQEACBEJDQBAiEhoAABCREIDABAiEhoAgBCR0AAAhIiEBgAgRCQ0AAAhIqEBAAgRCQ0AQIhIaAAAQkRCAwAQIhIaAIAQkdAAAISIhAYAIEQkNAAAISKhAQAIEQkNAECISGgAAEJEQgMAECISGgCAEJHQAACEiIQGACBEJDQAACEioQEACBEJDQBAiEhoAABCREIDABAiEhoAgBCR0AAAhIiEBgAgRCQ0AAAhIqEBAAgRCQ0AQIhIaAAAQkRCAwAQIhIaAIAQkdAAAISIhAYAIEQkNAAAISKhAQAIEQkNAECISGgAAEJEQgMAECISGgCAEJHQAACEiIQGACBEJDQAACEioQEACBEJDQBAiEhoAABCREIDABAiEhoAgBCR0AAAhIiEBgAgRCQ0AAAhIqEBAAgRCQ0AQIhIaAAAQkRCAwAQIhIaAIAQkdAAAISIhAYAIEQkNAAAISKhAQAIEQkNAECISGgAAEJEQgMAECISGgCAEJHQAACEiIQGACBEJDQAACEioQEACBEJDQBAiEhoAABCREIDABAiEhoAgBCR0AAAhIiEBgAgRCQ0AAAhIqEBAAgRCQ0AQIhIaAAAQkRCAwAQIhIaAIAQkdAAAISIhAYAIEQkNAAAISKhAQAIEQkNAECISGgAAEJEQgMAECISGgCAEJHQAACEiIQGACBEJDQAACEioQEACBEJDQBAiEhoAABCREIDABAiEhoAgBCR0AAAhIiEBgAgRCQ0AAAhIqEBAAgRCQ0AQIhIaAAAQkRCAwAQIhIaAIAQkdAAAISIhAYAIEQkNAAAISKhAQAIEQkNAECISGgAAEJEQgMAECISGgCAEJHQAACEiIQGACBEJDQAACEioQEACBEJDQBAiEhoAABCREIDABAiEhoAgBCR0AAAhIiEBgAgRCQ0AAAhIqEBAAgRCQ0AQIhIaAAAQkRCAwAQIhIaAIAQkdAAAISIhAYAIEQkNAAAISKhAQAIEQkNAECISGgAAEJEQgMAECISGgCAEJHQAACEiIQGACBEJDQAACEioQEACBEJDQBAiEhoAABCREIDABAiEhoAgBCR0AAAhIiEBgAgRCQ0AAAhIqEBAAgRCQ0AQIhIaAAAQkRCAwAQIhIaAIAQkdAAAISIhAYAIEQkNAAAISKhAQAIEQkNAECISGgAAEJEQgMAECISGgCAEJHQAACEiIQGACBEJDQAACEioQEACBEJDQBAiEhoAABCREIDABAiEhoAgBCR0AAAhIiEBgAgRCQ0AAAhIqEBAAgRCQ0AQIhIaAAAQkRCAwAQIhIaAIAQkdAAAISIhAYAIEQkNAAAISKhAQAIEQkNAECISGgAAEJEQgMAECISGgCAEJHQAACEiIQGACBEJDQAACEioQEACBEJDQBAiEhoAABCREIDABAiEhoAgBCR0AAAhIiEBgAgRCQ0AAAhIqEBAAgRCQ0AQIhIaAAAQkRCAwAQIhIaAIAQkdAAAISIhAYAIEQkNAAAISKhAQAIEQkNAECISGgAAEJEQgMAECISGgCAEJHQAACEiIQGACBEJDQAACEioQEACBEJDQBAiEhoAABCREIDABAiEhoAgBCR0AAAhIiEBgAgRCQ0AAAhIqEBAAgRCQ0AQIhIaAAAQkRCAwAQIhIaAIAQkdAAAISI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sWJlypR5++23a9asWbt2bUVRhBDPc/3du3eHh4cDiI6Ovn379v79++/duzdw4MCEhISEhAQOThPRU/B/EOSMUmPYJT4+/tChQ/v37z9z5oyXl5fRaDQajblz527QoEHr1q2fNMnreVy+fDkqKsrHx6d3795t27Z95513GjRocO7cOS8vrxw5cjzDim0icilMaHJGLySho6KiIiIizp8/nylTJm9v74IFC+bLl693797PthDrGcybN2/UqFEAFi5caPlQdZ0345mI/hMTmpzRM2xpdefOnePHj//11183b94UQrz++ut58uRp1qzZMxf3fk6rVq3q3Lmz+jjNfhMQ0auECU3OKE+ePE8qq2lx8+bN6OjomJiYc+fOXbx4EcAbb7zxzjvvFClS5NatW0KIhISEU6dOlStXLjV6sP/TpUuX3nrrrbT/XCJ6ZTChyRnlzZv31KlTxYsXt33x2rVrV69ePXHixOHDh8+dO5clS5YiRYrky5fvjTfeKFu2bKFChV5//fX0arCDK1eupHTKNxGRAyY0OaPChQsvX768ePHit27dWrBgwW+//bZv3z6DwVClShVfX99GjRoVKVIke/bs6d3MJzp79mzevHnTuxVE9HJjQpMzyp07t7rBc44cOQYOHJjezUmx/PnznzlzJr1bQUQvN9blJif1UhfeKliw4NatWx1e3LdvX7o0hoheUqz6SU7qyJEjxYoV8/DwSO+GPKP4+PilS5eeOHHCy8vr4cOHNWvW9Pf3f876J0TkOliXm5zXv//+O3fu3EGDBqV3Q57Xf05KJyJ6nBCCvdzkpLJly2a7t+PLi/FMRM+G99DkvM6fP58nTx7bfaKIiFwE76HJqb355puTJ09O71YQEaUPJjQ5Lzc3typVqsTHx6d3Q4iI0gETmpyav7+/unsjEZGr4Tg0Obvr168nJCTky5cvvRtCRJR2OA5NLwEvL6+bN28+evQovRtCRJSmmND0EihSpMipU6fSuxVERGmKvdxEREROh73cRERETooJTURE5IyY0ERERM6ICU1EROSMmNBERETOiAlNRETkjJjQREREzogJTURE5IyY0ERERM6ICU1EROSMmNBERETOiAlNRETkjJjQREREzogJTURE5IyY0ERERM6ICU1EROSMmNBERETOiAlNRETkjJjQREREzogJTURE5IyY0ERERM6ICU1EROSMmNBERETOiAlNRETkjJjQREREzogJTURE5IyY0ERERM6ICU1EROSMmNBERETOiAlNRETkjJjQREREzogJTURE5IyY0ERERM6ICU1EROSMmNBERETOiAlNRETkjJjQREREzogJTURE5IyY0ERERM6ICU1EROSMmNBERETOiAlNRETkjJjQREREzogJTURE5IyY0ERERM6ICU1EROSMmNBERETOyC1Vry6EUB9IKVP1g4iIiF4xqXgPbYlnh8dERET0n1IxoXnfTERE9MzSaByaaU1ERJQiqTsOzWAmIiJ6NpzLTURE5IyY0ERERM6ICU1EROSMmNBERETOiAlNRETkjJjQREREzogJTURE5IyY0ERERM6ICU1EROSMmNBERETOiAlNRETkjJjQREREzogJTURE5IyY0ERERM6ICU1EROSMmNBERETOiAlNRETkjJjQREREzogJTURE5IyY0ERERM6ICU1EROSMmNBERETOiAlNRETkjJjQREREzogJTURE5IyY0ERERM6ICU1EROSM/g+TNgcVOLA8TQAAAABJRU5ErkJggg==" id="p1img1"></DIV>


<DIV class="dclr"></DIV>
<P class="p0 ft0">XAVIER JULIANO NIETO VARGAS</P>
<P class="p1 ft1">RFC<SPAN class="ft0">:</SPAN>NIVX7704159Y2</P>
<P class="p2 ft1">Av. Playa Mocambo 768 Bis Mz. 24 Lt. 4</P>
<P class="p3 ft1">Municipio de Solidaridad, Ciudad Playa del Carmen, Quintana Roo</P>
<P class="p4 ft2">RECIBO DE PAGO</P>
<TABLE cellpadding=0 cellspacing=0 class="t0">
<TR>
<TD colspan=2 rowspan=2 class="tr0 td0"><P class="p5 ft4"><SPAN class="ft3">RECIBI DE: </SPAN>${body.dataClient[0].nombre}</P></TD>
<TD class="tr1 td1"><P class="p6 ft5">&nbsp;</P></TD>
<TD colspan=3 class="tr1 td2"><P class="p7 ft4"><SPAN class="ft3">Fecha: </SPAN>04/05/2021</P></TD>
</TR>
<TR>
<TD class="tr2 td3"><P class="p6 ft6">&nbsp;</P></TD>
<TD colspan=2 class="tr2 td4"><P class="p8 ft4">12:57:14</P></TD>
<TD class="tr2 td5"><P class="p6 ft6">&nbsp;</P></TD>
</TR>
<TR>
<TD class="tr3 td6"><P class="p6 ft5">&nbsp;</P></TD>
<TD class="tr3 td7"><P class="p6 ft5">&nbsp;</P></TD>
<TD class="tr3 td3"><P class="p6 ft5">&nbsp;</P></TD>
<TD colspan=3 class="tr3 td8"><P class="p9 ft3">Folio<SPAN class="ft4">:4326</SPAN></P></TD>
</TR>
<TR>
<TD class="tr1 td9"><P class="p6 ft5">&nbsp;</P></TD>
<TD class="tr1 td10"><P class="p6 ft5">&nbsp;</P></TD>
<TD class="tr1 td11"><P class="p6 ft5">&nbsp;</P></TD>
<TD class="tr1 td11"><P class="p6 ft5">&nbsp;</P></TD>
<TD class="tr1 td12"><P class="p6 ft5">&nbsp;</P></TD>
<TD class="tr1 td13"><P class="p6 ft5">&nbsp;</P></TD>
</TR>
<TR>
<TD class="tr4 td14"><P class="p6 ft7">&nbsp;</P></TD>
<TD class="tr4 td10"><P class="p6 ft7">&nbsp;</P></TD>
<TD class="tr4 td11"><P class="p6 ft7">&nbsp;</P></TD>
<TD class="tr4 td11"><P class="p6 ft7">&nbsp;</P></TD>
<TD class="tr4 td12"><P class="p6 ft7">&nbsp;</P></TD>
<TD class="tr2 td15"><P class="p6 ft6">&nbsp;</P></TD>
</TR>
<TR>
<TD class="tr5 td16"><P class="p10 ft8">Cantidad</P></TD>
<TD class="tr5 td17"><P class="p11 ft9">Descripción</P></TD>
<TD class="tr5 td18"><P class="p11 ft9">Descuento</P></TD>
<TD class="tr5 td18"><P class="p11 ft9">Precio unitario</P></TD>
<TD class="tr5 td19"><P class="p12 ft8">Importe</P></TD>
<TD class="tr6 td15"><P class="p6 ft10">&nbsp;</P></TD>
</TR>
<TR>
<TD class="tr7 td20"><P class="p6 ft5">&nbsp;</P></TD>
<TD class="tr7 td7"><P class="p13 ft1">Mensualidad 28 de 60</P></TD>
<TD class="tr7 td3"><P class="p6 ft5">&nbsp;</P></TD>
<TD class="tr7 td3"><P class="p6 ft5">&nbsp;</P></TD>
<TD class="tr7 td21"><P class="p6 ft5">&nbsp;</P></TD>
<TD class="tr7 td15"><P class="p6 ft5">&nbsp;</P></TD>
</TR>
<TR>
<TD class="tr8 td20"><P class="p6 ft5">&nbsp;</P></TD>
<TD class="tr8 td7"><P class="p13 ft1">correspondiente al mes</P></TD>
<TD class="tr8 td3"><P class="p6 ft5">&nbsp;</P></TD>
<TD class="tr8 td3"><P class="p6 ft5">&nbsp;</P></TD>
<TD class="tr8 td21"><P class="p6 ft5">&nbsp;</P></TD>
<TD class="tr8 td15"><P class="p6 ft5">&nbsp;</P></TD>
</TR>
<TR>
<TD class="tr8 td20"><P class="p6 ft5">&nbsp;</P></TD>
<TD class="tr8 td7"><P class="p13 ft1">de Mayo 2021 /</P></TD>
<TD class="tr8 td3"><P class="p6 ft5">&nbsp;</P></TD>
<TD class="tr8 td3"><P class="p6 ft5">&nbsp;</P></TD>
<TD class="tr8 td21"><P class="p6 ft5">&nbsp;</P></TD>
<TD class="tr8 td15"><P class="p6 ft5">&nbsp;</P></TD>
</TR>
<TR>
<TD class="tr8 td20"><P class="p6 ft5">&nbsp;</P></TD>
<TD class="tr8 td7"><P class="p13 ft1">Proyecto: YA'AX</P></TD>
<TD class="tr8 td3"><P class="p6 ft5">&nbsp;</P></TD>
<TD class="tr8 td3"><P class="p6 ft5">&nbsp;</P></TD>
<TD class="tr8 td21"><P class="p6 ft5">&nbsp;</P></TD>
<TD class="tr8 td15"><P class="p6 ft5">&nbsp;</P></TD>
</TR>
<TR>
<TD class="tr8 td20"><P class="p6 ft5">&nbsp;</P></TD>
<TD class="tr8 td7"><P class="p13 ft1">TZONOT / Lote: 52 /</P></TD>
<TD class="tr8 td3"><P class="p6 ft5">&nbsp;</P></TD>
<TD class="tr8 td3"><P class="p6 ft5">&nbsp;</P></TD>
<TD class="tr8 td21"><P class="p6 ft5">&nbsp;</P></TD>
<TD class="tr8 td15"><P class="p6 ft5">&nbsp;</P></TD>
</TR>
<TR>
<TD class="tr8 td20"><P class="p14 ft1">1.0</P></TD>
<TD class="tr8 td7"><P class="p13 ft1">Pago recibido en la</P></TD>
<TD class="tr8 td3"><P class="p10 ft11">0.0 %</P></TD>
<TD class="tr8 td3"><P class="p15 ft1">$2,970.00</P></TD>
<TD class="tr8 td21"><P class="p16 ft1">$2,970.00</P></TD>
<TD class="tr8 td15"><P class="p6 ft5">&nbsp;</P></TD>
</TR>
<TR>
<TD class="tr8 td20"><P class="p6 ft5">&nbsp;</P></TD>
<TD class="tr8 td7"><P class="p13 ft1">cuenta bancaria</P></TD>
<TD class="tr8 td3"><P class="p6 ft5">&nbsp;</P></TD>
<TD class="tr8 td3"><P class="p6 ft5">&nbsp;</P></TD>
<TD class="tr8 td21"><P class="p6 ft5">&nbsp;</P></TD>
<TD class="tr8 td15"><P class="p6 ft5">&nbsp;</P></TD>
</TR>
<TR>
<TD class="tr8 td20"><P class="p6 ft5">&nbsp;</P></TD>
<TD class="tr8 td7"><P class="p13 ft1">1118668575 del Banco</P></TD>
<TD class="tr8 td3"><P class="p6 ft5">&nbsp;</P></TD>
<TD class="tr8 td3"><P class="p6 ft5">&nbsp;</P></TD>
<TD class="tr8 td21"><P class="p6 ft5">&nbsp;</P></TD>
<TD class="tr8 td15"><P class="p6 ft5">&nbsp;</P></TD>
</TR>
<TR>
<TD class="tr8 td20"><P class="p6 ft5">&nbsp;</P></TD>
<TD class="tr8 td7"><P class="p13 ft1">Banorte con número de</P></TD>
<TD class="tr8 td3"><P class="p6 ft5">&nbsp;</P></TD>
<TD class="tr8 td3"><P class="p6 ft5">&nbsp;</P></TD>
<TD class="tr8 td21"><P class="p6 ft5">&nbsp;</P></TD>
<TD class="tr8 td15"><P class="p6 ft5">&nbsp;</P></TD>
</TR>
<TR>
<TD class="tr8 td20"><P class="p6 ft5">&nbsp;</P></TD>
<TD class="tr8 td7"><P class="p13 ft1">referencia 0205210 en</P></TD>
<TD class="tr8 td3"><P class="p6 ft5">&nbsp;</P></TD>
<TD class="tr8 td3"><P class="p6 ft5">&nbsp;</P></TD>
<TD class="tr8 td21"><P class="p6 ft5">&nbsp;</P></TD>
<TD class="tr8 td15"><P class="p6 ft5">&nbsp;</P></TD>
</TR>
<TR>
<TD class="tr9 td20"><P class="p6 ft5">&nbsp;</P></TD>
<TD class="tr9 td7"><P class="p13 ft1">fecha 03 Mayo 2021.</P></TD>
<TD class="tr9 td3"><P class="p6 ft5">&nbsp;</P></TD>
<TD class="tr9 td3"><P class="p6 ft5">&nbsp;</P></TD>
<TD class="tr9 td21"><P class="p6 ft5">&nbsp;</P></TD>
<TD class="tr9 td15"><P class="p6 ft5">&nbsp;</P></TD>
</TR>
</TABLE>
<P class="p17 ft3">IMPORTE CON LETRA</P>
<P class="p18 ft3">DOS MIL NOVECIENTOS SETENTA PESOS 00/100 M.N.</P>
<P class="p19 ft3">TOTAL<SPAN style="padding-left:106px;">$2,970.00</SPAN></P>
<TABLE cellpadding=0 cellspacing=0 class="t1">
<TR>
<TD class="tr6 td22"><P class="p6 ft12">____________________________</P></TD>
<TD class="tr6 td23"><P class="p20 ft13">Xavier Juliano Nieto Vargas</P></TD>
</TR>
<TR>
<TD class="tr6 td22"><P class="p6 ft14">Nombre y firma de quien aporta</P></TD>
<TD class="tr6 td23"><P class="p6 ft15">Nombre y Firma de quien Recibe</P></TD>
</TR>
</TABLE>
<P class="p21 ft16">Recuerde que si paga dentro de los 5 días naturales siguientes a la fecha estipulada en su contrato, sigue siendo acreedor al crédito sin intereses, después del día 5 el interés es del</P>
</DIV>
<DIV id="page_2">
<DIV id="p2dimg1">
<IMG src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAosAAABeCAIAAADE5Mn1AAABwUlEQVR4nO3bsYpDIRBA0Z0l///LkyKw1RbJA5NLOKeyUruLorO7M7O7PwBAw8z8fnoPAMA/FBoAihQaAIoUGgCKFBoAihQaAIoUGgCKFBoAihQaAIoUGgCKFBoAihQaAIoUGgCKFBoAihQaAIoUGgCKFBoAihQaAIoUGgCKFBoAihQaAIoUGgCKFBoAihQaAIpuR2efmcdgd48uBABf5k1n6L9UAwDPOFhoVQaAyw4W2s02AFz2pltutQaAl5x9KSbMAHCN31YAUKTQAFCk0ABQpNAAUKTQAFCk0ABQpNAAUKTQAFCk0ABQpNAAUKTQAFCk0ABQpNAAUKTQAFCk0ABQpNAAUKTQAFCk0ABQpNAAUKTQAFCk0ABQpNAAUKTQAFCk0ABQpNAAUKTQAFCk0ABQpNAAUKTQAFCk0ABQpNAAUKTQAFCk0ABQpNAAUKTQAFCk0ABQpNAAUKTQAFCk0ABQpNAAUKTQAFCk0ABQpNAAUKTQAFCk0ABQpNAAUKTQAFCk0ABQpNAAUKTQAFCk0ABQpNAAUKTQAFCk0ABQpNAAUKTQAFCk0ABQpNAAUKTQAFCk0ABQpNAAUKTQAAAA8Jw7c5sSu87Du+gAAAAASUVORK5CYII=" id="p2img1"></DIV>


<P class="p22 ft1">10%.</P>
<P class="p23 ft19">Es obligatorio realizar su pago con su referencia, que son las iniciales de su nombre y el número de lote. Ejemplo: <SPAN class="ft17">correcto: jjgs46. </SPAN><SPAN class="ft18">Incorrecto: pago terreno, nombre de la persona, lote tulum</SPAN></P>
</DIV>
</BODY>
</HTML>

    
    `
    return webTemplate

  }
}
