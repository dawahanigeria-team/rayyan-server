const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const compression = require('compression');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config');
const { validationMiddleware, rateLimiter } = require('./middlewares');

const routes = require('./routes');

// set up passport
require('./config/passport-config');

const app = express();


// middlewares
// set security HTTP headers
app.use(helmet());

// parse json request body and urlencoded request body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// gzip compression
app.use(compression());

// enable cors
app.use(cors());
app.options('*', cors());

// limit repeated failed requests to auth endpoints
if (process.env.NODE_ENV === 'production') {
    app.use('/api/auth', rateLimiter.authLimiter);
}


// set static folders
app.use(express.static('templates'));

// initialize passport
app.use(passport.initialize());

// DB config
const db = config.mongo.url;
mongoose.connect(db, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true
}, () => console.log('mongodb connected'));

// set up routes
app.use('/api', routes);

// handle celebrate errors and server errors
app.use(validationMiddleware.handleValidationError);

const PORT = config.PORT || 5000;
app.listen(PORT, () => console.log(`server running on PORT: ${PORT}`));