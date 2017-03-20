const processMessage = require('../helpers/processMessage');

module.exports = (req, res) => {
    if (req.body.object === 'page') {
        req.body.entry.forEach(entry => {
            entry.messaging.forEach(event => {
                processMessage(event);
            });
        });
        res.status(200).end();
    }
};