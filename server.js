const mongoose = require('mongoose');
const app = require('./app');

require('dotenv').config()

const DB = process.env.MONGODB_URI

mongoose.connect(DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true
}).then(() => {
    console.log('Connected to MongoDB')
}).catch(err => console.log(err))

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
    console.log(`App running on port ${port}...`)
});

process.on('unhandledRejection', err => {
    console.log(err.name, err.message)
    server.close(() => {
    process.exit(1)
    })
})

process.on('uncaughtException', err => {
    console.log(err.name, err.message)
    server.close(() => {
    process.exit(1)
    })
})