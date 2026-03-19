import http from 'k6/http';
import { sleep, check } from 'k6';
import { Rate } from 'k6/metrics';

export let errorRate = new Rate('errors');

export let options = {
  stages: [
    { duration: '1m', target: 200 },
    { duration: '2m', target: 500 },
    { duration: '1m', target: 500 },
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    'http_req_duration': ['p(95)<3000'],
    'errors': ['rate<0.01'],
  },
};

export default function () {
  const base = __ENV.BASE_URL || 'http://localhost:3000';
  let res = http.get(`${base}/`);
  let ok = check(res, { 'status was 200': (r) => r.status === 200 });
  if (!ok) errorRate.add(1);
  sleep(1);
}
