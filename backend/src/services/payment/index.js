const esewa = require('./esewa');
const khalti = require('./khalti');

const gateways = { esewa, khalti };

const getGateway = (name) => gateways[name] || null;

const GATEWAY_NAMES = Object.keys(gateways);

module.exports = { getGateway, GATEWAY_NAMES };