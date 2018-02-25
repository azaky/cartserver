module.exports = {
    // We use papertrail (papertrailapp.com) for logging.
    // If this is not provided, it will still log to stdout.
    papertrail: {
        host: 'logs2.papertrailapp.com',
        port: '15562',
    },
    server: {
        port: 8000 || process.env.PORT,
        https: {
            port: 8001 || process.env.HTTPS_PORT,
            cert: null || process.env.HTTPS_CERT,
            key: null || process.env.HTTPS_KEY,
            ca: null || process.env.HTTPS_CA,
        },
    },
};