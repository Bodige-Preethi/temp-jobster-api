require('dotenv').config()

const connectDB = require('./db/connect')
const jobs = require('./models/jobs')

const mockData = require('./mock-data.json')

const start = async() => {
    try {
        await connectDB(process.env.MONGO_URI)
        await jobs.deleteMany()
        await jobs.create(mockData)
        console.log('Success!!!!!!')
        process.exit(0)
    } catch (error) {
        console.log(error)
        process.exit(1)
    }
}
start()