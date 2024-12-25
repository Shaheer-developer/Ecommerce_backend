const express = require('express');
const app = express();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');
const { time, log } = require('console');
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
        console.log('Error in database connection', err.message);
    });

//API creation

app.get('/', (req, res) => {
    res.send('Welcome to Essentia');
})

// Image Storage Engine

const storage = multer.diskStorage({
    destination: './upload/images',
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage
});

// creating endpoint for image upload
app.use('/images', express.static('upload/images'));
app.post('/upload', upload.single("product"), (req, res) => {
    res.json({ success: 1, image_url: `http://localhost:${process.env.PORT}/images/${req.file.filename}` });
})

// Schema for product

const ProductSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        required: true,
    },
    new_price: {
        type: Number,
        required: true,
    },
    old_price: {
        type: Number,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
    available: {
        type: Boolean,
        default: true,
    },
});

const Product = mongoose.model('Product', ProductSchema);

app.post('/add-product', async (req, res) => {
    let products = await Product.find({});
    let id;
    if (products.length > 0) {
        let last_product_array = products.slice(-1);
        let last_product = last_product_array[0];
        id = last_product.id + 1;
    }
    else {
        id = 1;
    }
    const product = new Product({
        id: id,
        name: req.body.name,
        image: req.body.image,
        category: req.body.category,
        new_price: req.body.new_price,
        old_price: req.body.old_price,
    });
    console.log(product);
    await product.save();
    res.json({ success: true, name: req.body.name });
});

// creating endpoint for deleting Product
app.post('/delete-product', async (req, res) => {
    await Product.findOneAndDelete({ id: req.body.id });
    res.json({ success: true, name: req.body.name });
});

// creating endpoint for getting all Products
app.get('/allproducts', async (req, res) => {
    let products = await Product.find({});
    res.send(products);
});

//Schema for user
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        unique: true,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    cartData: {
        type: Object,
    },
    date: {
        type: Date,
        default: Date.now,
    },
});
const User = mongoose.model("User", userSchema);

// creating endpoint for user registration

app.post('/signup', async (req, res) => {
    let check = await User.findOne({ email: req.body.email });
    if (check) {
        return res.status(400).json({ success: false, errors: "User already exists" });
    }
    let cart = {}
    for (let i = 0; i < 300; i++) {
        cart[i] = 0;
    }
    const user = new User({
        name: req.body.username,
        email: req.body.email,
        password: req.body.password,
        cartData: cart,
    })
    await user.save();

    const data = {
        user: {
            id: user.id,
        }
    }
    const token = jwt.sign(data, 'secret_ecom')
    res.json({ success: true, token });

})

//creating endpoint for user login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    let user = await User.findOne({ email });
    if (user) {
        const passCompare = password === user.password;
        if (passCompare) {
            const data = {
                user: {
                    id: user.id,
                }
            }
            const token = jwt.sign(data, 'secret_ecom')
            res.json({ success: true, token });
        }
        else {
            res.json({ success: false, errors: "Invalid credentials" });
        }

    }
    else {
        res.json({ success: false, errors: "Invalid credentials" });
    }
}
)

//creating endpoint for newcollection data
app.get('/newcollection', async (req , res) => {
    let product = await Product.find({})
    let newcollection = product.slice(1).slice(-8)
        res.send(newcollection)
})


app.listen(process.env.PORT, (error) => {
    if (!error) {
        console.log(`Server is running on port ${process.env.PORT}`);
    }
    else {
        console.log('Error in server setup');
    }
});