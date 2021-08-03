require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')

const { MONGO_URI } = require('./config')

const app = express()
const PORT = process.env.PORT

app.use(cors())
app.use(express.urlencoded({ extended: true }))
app.use(express.json({ extended: true }))

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: false })
  .then(() => console.log('Conectado a la base de datos'))
  .catch(() => console.log('Error en la conexión de la base de datos'))

//   componente de rutas
app.use(require('./routes'))
app.listen(PORT, () => console.log(`Express connected at port ${PORT}`))
