# RAM and load validation

Haco has a hard operational target of less than 500 MiB resident memory for the server process. The repository includes `scripts/load-test.sh`, which builds the optimized release binary, starts an isolated Haco instance, creates an administrator session, drives concurrent API traffic, samples only the Haco server process RSS every 100 ms, and fails when peak RSS exceeds the configured limit.

## Validated result

Validation date: 2026-07-18

| Item | Result |
| --- | ---: |
| Platform | macOS 15.0, Apple arm64 |
| Build | Optimized `cargo build --release` |
| Message writes | 2,000 |
| FTS searches | 200 |
| Concurrent clients | 20 |
| Workload duration | 12 seconds |
| Idle server RSS | 27.2 MiB |
| Peak server RSS | 32.0 MiB |
| SQLite size after workload | 1.3 MiB |
| Memory limit | 500 MiB |
| Result | **PASS** |

Peak RSS used 6.4% of the 500 MiB budget, leaving 468.0 MiB of headroom in this workload.

## Reproduce it

From the project root:

```bash
./scripts/load-test.sh
```

Tune the workload without editing the script:

```bash
HACO_LOAD_MESSAGES=10000 \
HACO_LOAD_SEARCHES=1000 \
HACO_LOAD_CONCURRENCY=50 \
HACO_MEMORY_LIMIT_MB=500 \
./scripts/load-test.sh
```

The gate covers message writes, SQLite FTS reads, history reads, session authentication, realtime event publication, and normal background workers. It measures the server process—not the load-generating `curl` processes.

This result establishes the target for the tested workload and machine; it is not an unlimited-capacity guarantee. Run the same gate on the intended Linux VPS and with production-like conversation sizes before setting final capacity limits. Attachment transfer, very large concurrent WebSocket populations, and external push-provider latency should be profiled separately when those dominate the deployment.
