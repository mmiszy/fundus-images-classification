const Boom = require('boom');
const fs = require('fs');
const uuid = require('uuid');

export function handleCommand(request, reply) {
    const image = request.payload.image;
    const name = request.payload.name;
    const data = image.replace(/^data:image\/\w+;base64,/, '');
    const buf = new Buffer(data, 'base64');
    const datetime = (new Date()).toISOString();
    const rnd = uuid.v4();
    const filename = `output/${name}_${datetime}_${rnd}.png`;

    fs.writeFile(filename, buf, (err) => {
        if (err) {
            console.error(err);
            reply(new Boom.internal('Error occured'));
        } else {
            console.log(`Saved ${filename}`);
            reply(`Saved ${filename}`);
        }
    });
}
