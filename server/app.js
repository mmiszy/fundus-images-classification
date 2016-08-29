const server = require('./server');

server.serverInstance.start(function () {
    /*eslint-disable no-console */
    console.log('*** Server running at:', server.serverInstance.info.uri);
    console.log(new Date());
    /*eslint-enable no-console */
});