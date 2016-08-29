'use strict';

import * as Hapi from 'hapi';
import * as Inert from 'inert';
import * as Vision from 'vision';
import * as HapiSwagger from 'hapi-swagger';
import * as pkg from './package.json';

import {routes as classificationRoutes} from './modules/classification/classification.routes';

const server = new Hapi.Server();

server.connection({
    port: process.env.PORT || 1337,
    routes: {cors: true}
});

const swaggerOptions = {
    info: {
        'title': `${pkg.description} documentation`,
        'version': pkg.version
    }
};

server.register([
    Inert,
    Vision,
    {
        register: HapiSwagger,
        options: swaggerOptions
    }
], () => {
});

server.route({
    method: 'GET',
    path: '/',
    config: {
        tags: ['api'],
        handler: (request, reply) => {
            reply(`<h1>${pkg.description}</h1>
            <p>These aren't the droids you're looking for. Move along.</p>`);
        }
    }
});

server.route(classificationRoutes);

// handles unpredicted errors
server.ext('onPreResponse', (request, reply) => {
    if (request.response.output && request.response.output.statusCode === 500) {
        const e = request.response;
        const replyData = {};
        console.error(new Date(), e.name, e.message, e.stack);  // eslint-disable-line no-console

        replyData.error = {
            name: e.name,
            message: e.message,
            stack: e.stack
        };

        return reply(replyData).code(500);
    } else {
        reply.continue();
    }
});

export {server as serverInstance};
