const express = require('express');
const app = express();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');
const { time } = require('console');
const { type } = require('os');
const DBNAME = 'Essentia';

dotenv.config({
    path: './.env'
});

app.use(express.json());
app.use(cors());    // CORS middleware

// Database connection with mongodb
mongoose.connect(`${process.env.MONGODB_URI}/${DBNAME}`)
.then(() => {
    console.log('Database connected successfully');
}).catch((err) => {
    console.log('Error in database connection');
});

//API creation

app.get('/', (req, res) => {
    res.send('Welcome to Essentia');
})

// Image Storage Engine

const storage = multer.diskStorage({
    destination: './upload/images',
    filename: function(req, file, cb){
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage
});

// creating endpoint for image upload
app.use('/images', express.static('upload/images'));
app.post('/upload', upload.single("product"),(req, res) => {
    res.json({success: 1, image_url:`http://localhost:${process.env.PORT}/images/${req.file.filename}`});
})

// Schema for product

const ProductSchema = new mongoose.Schema({
    id:{
        type: Number,
        required: true,
    },
    name:{
        type: String,
        required: true,
    },
    image:{
        type: String,
        required: true,
    },
    category:{
        type: String,
        required: true,
    },
    new_price:{
        type: Number,
        required: true,
    },
    old_price:{
        type: Number,
        required: true,
    },
    date:{
        type: Date,
        default: Date.now,
    },
    available:{
        type: Boolean,
        default: true,
    },
}); 

const Product = mongoose.model('Product', ProductSchema);

app.post('/add-product', async (req, res) => {
    const product = new Product({
        id: req.body.id,
        name: req.body.name,
        image: req.body.image,
        category: req.body.category,
        new_price: req.body.new_price,
        old_price: req.body.old_price,
    });
    console.log(product);
    await product.save();
    console.log('Product added successfully');
    res.json({success: true, name: req.body.name});
});

app.listen(process.env.PORT, (error) => {
if(!error){
    console.log(`Server is running on port ${process.env.PORT}`);
}
else{
    console.log('Error in server setup');   
}
});