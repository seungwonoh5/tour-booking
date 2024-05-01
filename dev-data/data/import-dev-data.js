const mongoose = require('mongoose');
const fs = require('fs');
const Tour = require('../../models/tourModel');

require('dotenv').config()

const DB = process.env.MONGODB_URI

mongoose.connect(DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
}).then(() => {
    console.log('Connected to MongoDB')
})

// Read File
const tours = JSON.parse(
    fs.readFileSync(`${__dirname}/tours.json`, 'utf-8')
);

// Import data into database
const importData = async () => {
    try{
        await Tour.create(tours)
        console.log('Data Successfully Imported')
    }
    catch(err){
        console.log(err)
    }
    process.exit(0)
}

// Delete all data from database
const deleteData = async () => {
    try{
        await Tour.deleteMany();
        console.log('Data Successfully Deleted')
    }
    catch(err){
        console.log(err)
    }
    process.exit(0)
}

// deleteData();
if(process.argv[2] === '--import'){
    importData();
}else if(process.argv[2] === '--delete'){
    deleteData();
}

