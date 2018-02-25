const admin = require('firebase-admin');
const logger = require('./logger');

const serviceAccount = require('./serviceAccount.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const cart = db.collection('cart').where('price', '>', 0);
const cartOpener = db.collection('open').doc('sesame');

let lastSize = 0;

const setCartState = (isOpen) => {
    return cartOpener.set({cart: isOpen}).catch((err) => {
        logger.error(`Error setCartState to ${isOpen}: ${err}`);
        throw err;
    });
};

const openDelay = 3000;

const observer = cart.onSnapshot(querySnapshot => {
    const size = querySnapshot.size;
    logger.info(`Received query snapshot of size ${size}`);
    if (size > lastSize) {
        logger.info('Opening cart ...');
        setCartState(true)
            .then(() => {
                setTimeout(() => setCartState(false), openDelay);
            });
    }
    lastSize = size;
    // ...
}, err => {
    console.log(`Encountered error: ${err}`);
});

module.exports = {
    db,
    observer,
    cart,
    cartOpener,
};

