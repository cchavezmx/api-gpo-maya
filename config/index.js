const NODE_ENV = process.env.NODE_ENV

const config = {
  test: {
    MONGO_URI: `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0-shard-00-00.75eiz.mongodb.net:27017,cluster0-shard-00-01.75eiz.mongodb.net:27017,cluster0-shard-00-02.75eiz.mongodb.net:27017/test?ssl=true&replicaSet=atlas-u78g7x-shard-0&authSource=admin&retryWrites=true&w=majority`
  }

}

module.exports = config[NODE_ENV]
