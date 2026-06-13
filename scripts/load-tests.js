/* global __ENV */
import { check, sleep } from 'k6';
import http from 'k6/http';

export const options = {
  vus: 5, // 5 concurrent virtual users
  duration: '10s', // 10 seconds run time
  insecureSkipTLSVerify: true, // Skip SSL verification for self-signed certificates
  thresholds: {
    http_req_failed: ['rate<0.05'], // http errors should be less than 5%
    http_req_duration: ['p(95)<1500'], // 95% of requests should be below 1.5 seconds
  },
};

export default function () {
  const targetUrl = __ENV.TARGET_URL || 'https://e-commerce.wannasingh.dev';
  
  // Test Homepage
  const resHome = http.get(targetUrl);
  check(resHome, {
    'homepage status is 200': (r) => r.status === 200,
  });
  sleep(1);

  // Test Health endpoint
  const resHealth = http.get(`${targetUrl}/health`);
  check(resHealth, {
    'health status is 200': (r) => r.status === 200,
    'health body is ok': (r) => r.body.includes('ok'),
  });
  sleep(1);
}
