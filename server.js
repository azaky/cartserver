const _ = require('lodash');
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const http = require('http');
const https = require('https');
const config = require('./config');
const logger = require('./logger');

const {db, observer, cart, cartOpener, setCartState} = require('./firebase');

const app = express();

const expressLogger = (req, res, next) => {
    logger.info(`[REQUEST LOGGER] ${req.method} ${req.url} with request header ${JSON.stringify(req.headers)} and body ${JSON.stringify(req.body)}`);
    next();
};

const jsonErrorHandler = (error, req, res, next) => {
    if (error instanceof SyntaxError) {
        res.status(400).json({ message: 'Invalid JSON' });
    } else {
        next();
    }
};

const cors = (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
};

const unhandled500 = (error, req, res, next) => {
    logger.error('Uncaught error: ', error);
    res.status(500).json({ message: 'Internal server error' });
};

app.use(cors);
app.use(bodyParser.json());
app.use(jsonErrorHandler);
app.use(expressLogger);
app.use(unhandled500);

app.get('/', (req, res) => {
    res.status(200).json({ message: 'azaky/express-template. Please edit/delete this and add more endpoints' });
});

app.post('/cart/open', (req, res) => {
    setCartState(true).then(() => {
        res.status(200).json({ message: 'cart opened' });
    }).catch((err) => {
        res.status(500).json({ error: err });
    });
});

app.post('/cart/close', (req, res) => {
    setCartState(false).then(() => {
        res.status(200).json({ message: 'cart closed' });
    }).catch((err) => {
        res.status(500).json({ error: err });
    });
});

const availableCart = [{
    storeName: 'Indomaret',
    availableCart: 6,
}, {
    storeName: 'Alfamart',
    availableCart: 12,
}];

const items = [{
    name: "Delfi Milk",
    category: "Chocolate Drink",
    description: "Minuman Coklat Susu yang disukai banyak orang",
    picture: "https://firebasestorage.googleapis.com/v0/b/magi-cart.appspot.com/o/IMG_0006.JPG?alt=media",
    price: 2500,
}, {
    name: "Delfi Hot Cocoa",
    category: "Chocolate Drink",
    description: "Minuman Coklat Delfi yang banyak digemari kaula muda",
    picture: "https://1.bp.blogspot.com/-weoe9mbU4HE/V8qguvOBRHI/AAAAAAAAAQk/jxEyovrdBFIWVJ1oU_stMX1HQdtVw5KpgCLcB/s320/20022628_2.jpg",
    price: 2000,
}, {
    name: "Torabika Capucino",
    category: "Coffee",
    description: "Kopi rasa Capucino khas Italia yang sudah terbukti",
    picture: "https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full//97/MTA-1288816/torabika_torabika-cappuccino-choco-granule-12-s-x-25gr_full02.jpg",
    price: 1500,
}, {
    name: "Bumbu Kentang Goreng",
    category: "Spice",
    description: "Bumbu pelengkap sajian kentang goreng anda",
    picture: "https://www.bizzy.co.id/media/catalog/product/cache/image/700x560/e9c3970ab036de70892d86c6d221abfe/C/O/CONF-Ht41DgsqIX8A8ZcOGrBr.jpg",
    price: 3500,
}, {
    name: "Kopi Kapal Api",
    category: "Coffee",
    description: "Kopi kapal api yang banyak digemari oleh warga Indonesia",
    picture: "https://ecs7.tokopedia.net/img/product-1/2016/3/10/2785815/2785815_171a3108-70d6-49c7-af1e-77e242d09506.jpg",
    price: 2500,
}];

app.get('/availableCart', (req, res) => {
    return res.status(200).json({ data: availableCart });
});

app.get('/availableCart/:storeName', (req, res) => {
    const storeName = req.params.storeName;
    const idx = _.findIndex(availableCart, (obj) => obj.storeName === storeName);
    if (idx === -1) {
        return res.status(404).json({ message: `no store with name ${storeName} found` });
    } else {
        return res.status(200).json({ data: availableCart[idx] });
    }
});

app.get('/items', (req, res) => {
    return res.status(200).json({ data: items });
});

app.use('/docs', express.static('swagger-ui/dist'))

const port = config.server.port;
http.createServer(app).listen(port, () => {
    logger.info(`azaky/express-template started on ${port}`);
});

// Check certs for https
if (config.server.https && config.server.https.cert && fs.existsSync(config.server.https.cert)) {
    const httpsPort = config.server.https.port;
    const httpsConfig = {
        cert: fs.readFileSync(config.server.https.cert),
        key: fs.readFileSync(config.server.https.key),
        ca: config.server.https.ca && fs.readFileSync(config.server.https.ca),
    };
    https.createServer(httpsConfig, app)
        .listen(httpsPort, () => {
            logger.info(`https: azaky/express-template started on ${httpsPort}`);
        });
}

// https test endpoint
app.get('/https', (req, res) => {
    if (!req.secure) {
        return res.status(404).send(`<!DOCTYPE html>
            <html lang="en">
                <head>
                    <meta charset="utf-8">
                    <title>Error</title>
                </head>
                <body>
                    <pre>Cannot GET /https</pre>
                </body>
            </html>`);
    }
    return res.status(200).json({ message: 'This endpoint is only available through secure connection' });
});