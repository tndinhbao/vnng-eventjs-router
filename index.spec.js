const assert = require('assert');
const amqp = require('amqplib');
const eventjs = require('vnng-eventjs');
const _ = require('./');

// Test data
const AGGREGATE = 'DEV';
const AGGREGATE_ID = 'DEV:TODO1';
const message = {
  msg: 'It\'s work :D'
};
const EXCHANGE_CONFIG = { durable: false };
const amqpConfig = {
  host: '192.168.1.87',
  user: 'vnng',
  password: 'Vnng!t2016'
};
const amqpSettings = () => `amqp://${amqpConfig.user}:${amqpConfig.password}@${amqpConfig.host}?heartbeat=10`;


describe('EventJS Application', () => {
  it(`Start app without error -> receive successfully message from AGGREGATE= ${AGGREGATE}, AGGREGATE_ID= ${AGGREGATE_ID} `, (done) => {
    /**
     * Parse JSON middleware
     *
     * @param {String} msg
     */

    function parseMiddleware(ctx, next) {
      try {
        ctx.event = JSON.parse(ctx.content.toString());
        next();
      } catch (e) {
        throw e;
      }
    }


    const app = eventjs();

    app.set('_host', amqpConfig.host);
    app.set('_user', amqpConfig.user);
    app.set('_password', amqpConfig.password);
    app.set('_aggregate', AGGREGATE);
    app.set('_type', eventjs.ExchangeType.Fanout);
    app.set('_events', [AGGREGATE_ID]);
    app.use(parseMiddleware);
    app.use(function receiveMessage(ctx, next) {
      ctx.msg = ctx.event;
      next();
    });

    app.use(_.on(AGGREGATE_ID, ctx => {
      assert.deepEqual(ctx.msg, message);
      done();
    }));

    app.use(() => {
      console.log('Not reached here!');
    });

    app.listen().then(() => {
      amqp.connect(amqpSettings()).then((con) => con.createChannel())
        .then(channel => {
          channel.assertExchange(AGGREGATE, eventjs.ExchangeType.Fanout, EXCHANGE_CONFIG);
          channel.publish(AGGREGATE, AGGREGATE_ID, Buffer.from(JSON.stringify(message)));
          console.log('Sent AGGREGATE= %s, AGGREGATE_ID= %s', AGGREGATE, AGGREGATE_ID);
        });
    });
  });
});
