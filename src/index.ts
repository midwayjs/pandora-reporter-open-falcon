import {ScheduledMetricsReporter, MetricName} from 'pandora-metrics';
import * as urllib from 'urllib';
import * as os from 'os';

const DEFAULT_AGENT_URL = 'http://127.0.0.1:1988/v1/push';

function formatTags(tags) {
  let tagText = [];
  for(let key in tags) {
    tagText.push(`${key}=${tags[key]}`);
  }
  return tagText.join(',');
}

export class OpenFalconReporter extends ScheduledMetricsReporter {

  hostName = os.hostname();

  agentUrl: string;

  constructor(actuatorManager?, options?) {
    super(actuatorManager);
    this.agentUrl = options.agentUrl || DEFAULT_AGENT_URL;
  }

  async report(metricsData) {
    let {gauges, counters} = metricsData;
    // open falcon need second
    const ts = Math.floor(Date.now() / 1000);

    let results = [];
    for (let [key, gauge] of gauges.entries()) {
      let value = await gauge.getValue();
      let name = MetricName.parseKey(key);

      results.push({
        endpoint: this.hostName,
        metric: name.getKey(),
        timestamp: ts,
        step: this.interval || 60,
        value: value,
        counterType: 'GAUGE',
        tags: formatTags(name.getTags()),
      });
    }

    for (let [key, counter] of counters.entries()) {
      let name = MetricName.parseKey(key);
      results.push({
        endpoint: this.hostName,
        metric: name.getKey(),
        timestamp: ts,
        step: this.interval || 60,
        value: counter.getCount(),
        counterType: 'COUNTER',
        tags: formatTags(name.getTags()),
      });
    }

    // payload = [
    //   {
    //     "endpoint": "test-endpoint",
    //     "metric": "test-metric",
    //     "timestamp": ts,
    //     "step": 60,
    //     "value": 1,
    //     "counterType": "GAUGE",
    //     "tags": "idc=lg,loc=beijing",
    //   },
    //
    //   {
    //     "endpoint": "test-endpoint",
    //     "metric": "test-metric2",
    //     "timestamp": ts,
    //     "step": 60,
    //     "value": 2,
    //     "counterType": "GAUGE",
    //     "tags": "idc=lg,loc=beijing",
    //   },
    // ]

    this.push(results);
  }

  push(results) {
    urllib.request(this.agentUrl, {
      method: 'POST',
      data: JSON.stringify(results)
    }, (err) => {
      if (err) {
        console.error('post data to open-falcon agent error!', err);
      }
    });
  }

}
