const NODE_ENV = process.env.NODE_ENV

const config = {
  test: {
    MONGO_URI: `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_URI}`
  }

}

module.exports = config[NODE_ENV]
