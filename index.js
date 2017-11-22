const debug = require('debug')('vnng-eventjs-mediator');

module.exports.on = (evtName, fn) => (ctx, next) => {
  const match = ctx.fields.routingKey === evtName;
  if (match) {
    debug('match %s -> %s', ctx.fields.routingKey, evtName);
    return Promise.resolve(fn(ctx, next));
  }

  return next();
};

