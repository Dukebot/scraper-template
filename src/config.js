const dotenv = require('dotenv')

dotenv.config()

const Config = Object.freeze({
    environment: process.env.NODE_ENV || 'development',
    port: +process.env.PORT || 3000
})

module.exports = Config