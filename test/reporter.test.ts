import {OpenFalconReporter} from '../src/index';
import {MetricsServerManager, MetricName, BucketCounter, Gauge} from '@ali/pandora-metrics';
const nock = require('nock');

describe('/test/reporter.test.ts', () => {
  it('should ', (done) => {

    nock('http://127.0.0.1:1988')
      .get('/v1/push')
      .reply(200);

    const manager = new MetricsServerManager();
    manager.register('test', MetricName.build('reporter.register.pv'), new BucketCounter());
    manager.register('test', MetricName.build('reporter.register.qps'), new BucketCounter());
    manager.register('test', MetricName.build('reporter.register.gauge'), <Gauge<number>>{
      getValue() {
        return 0;
      }
    });

    let reporter = new OpenFalconReporter();
    reporter.setMetricManager(manager);
    reporter.start(1);

    setTimeout(() => {
      done();
    }, 1500);
  });
});
