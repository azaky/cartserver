const admin = require('firebase-admin');
const logger = require('./logger');

const serviceAccount = require('./serviceAccount.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const cart = db.collection('cart').where('price', '>', 0);
const order = db.collection('order').where('total', '>', 0);
const cartOpener = db.collection('open').doc('sesame');

let lastOrderSize = -1;
let lastSize = -1;

const setCartState = (isOpen) => {
    return cartOpener.set({cart: isOpen}).catch((err) => {
        logger.error(`Error setCartState to ${isOpen}: ${err}`);
        throw err;
    });
};

const openDelay = 3000;
const openOrderDelay = 15000;

const orderObserver = order.onSnapshot(querySnapshot => {
    const size = querySnapshot.size;
    logger.info(`Received order query snapshot of size ${size}`);
    if (lastOrderSize === -1) {
        lastOrderSize = size;
        return;
    }
    if (size > lastOrderSize) {
        logger.info('Opening cart ...');
        setCartState(true)
            .then(() => {
                setTimeout(() => {
                    logger.info('Closing cart ...');
                    setCartState(false);
                }, openOrderDelay);
            });
    }
    lastSize = size;
}, err => {
    console.log(`Encountered error: ${err}`);
});

const observer = cart.onSnapshot(querySnapshot => {
    const size = querySnapshot.size;
    logger.info(`Received cart query snapshot of size ${size}`);
    if (lastSize === -1) {
        lastSize = size;
        return;
    }
    if (size > lastSize) {
        logger.info('Opening cart ...');
        setCartState(true)
            .then(() => {
                setTimeout(() => {
                    logger.info('Closing cart ...');
                    setCartState(false);
                }, openDelay);
            });
    }
    lastSize = size;
}, err => {
    console.log(`Encountered error: ${err}`);
});

module.exports = {
    db,
    observer,
    cart,
    cartOpener,
    setCartState,
};

