# Performance tests (NFR1)

This folder contains a baseline k6 load test to validate page load and concurrency. Keep tests simple and run locally to collect baseline metrics.

Files:
- `load_test_k6.js` — k6 script that ramps to 500 VUs and asserts p95 < 3000ms.

Quick run (requires k6 installed):

```bash
# Ubuntu/Debian (example)
sudo apt install -y k6

# Run the test (adjust BASE_URL as needed)
BASE_URL=http://localhost:5000 k6 run tests/perf/load_test_k6.js
```

Notes:
- Tweak `options.stages` and endpoints to cover key API routes (e.g., `/api/posts`, `/api/bills`).
- Add more checks for specific endpoints and for write operations when needed.
