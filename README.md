# Node.js Worker Threads
This project demonstrates how to use Worker Threads in Node.js to handle CPU-intensive tasks without blocking the main event loop.

## Why Worker Threads?

**Node.js** runs your `JavaScript` code on a single main thread (event loop). This might sound limiting, but it actually makes `Node.js` really good at handling things like file I/O, network calls, and database calls, all the I/O stuff—without getting stuck. The magic is its asynchronous, non-blocking nature.

The catch? If you throw heavy computations at it, like processing huge amounts of data or running complex calculations, even the I/O operations like `dns.lookup()`, `fs.watch()`, `compression (zlib)` can block the event loop. While that’s happening, your app can’t respond to other requests.

Luckily, **Node.js** has a way around this: `Worker Threads` and `clustering` let you **offload** those heavy tasks to other threads, so your app stays responsive and keeps humming along.

## Project Structure

```
├── index.js      # Main application file with Express server
├── worker.js     # Worker thread implementation
└── package.json  # Project configuration
```

## Implementation Details

1. **Main Application ([index.js](index.js))**
   - Express server with three endpoints:
   - `/non-blocking`: Demonstrates normal request handling
   - `/blocking-without-worker` : Handles CPU-intensive task in the Main Thread
   - `/blocking-with-worker`: Handles CPU-intensive task using worker threads
        - Configurable number of worker threads via query parameter
 

2. **Worker Implementation ([worker.js](worker.js))**
   - Simulates CPU-intensive task
   - Divides work among multiple threads
   - Uses message passing for communication with main thread

## How to Run

1. Install dependencies:
```sh
npm install
```

2. Start the server:
```sh
npm start
```

3. Test the endpoints:
   - Non-blocking endpoint: `http://localhost:3030/non-blocking`
   - CPU-intensive task without Worker Threads: `http://localhost:3030/blocking-without-worker`
   - CPU-intensive task with Worker Threads: `http://localhost:3030/blocking-with-worker?thread_count=4`

## API Endpoints

### 1. GET `/non-blocking`
- Returns immediately with "Hello World"
- Demonstrates non-blocked event loop

### 2. GET `/blocking-without-worker`
- Executes CPU-intensive task on the Main Thread
- Returns total count after completion

### 3. GET `/blocking-with-worker`
- Query Parameters:
  - `thread_count`: Number of worker threads to use (default: 1)
- Executes CPU-intensive task across specified number of threads
- Returns total count after completion


## Performance Comparison

### 1. Install Autocannon
```bash
npm i autocannon -g
```
### 2. Test Endpoints

| Endpoint                   | Description                                                     | Autocannon Command                                                                               |
| -------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `/non-blocking`            | Handles requests asynchronously without blocking the event loop | `autocannon -c 2 -d 60 --timeout 30 http://localhost:3030/non-blocking`                          |
| `/blocking-without-worker` | CPU-intensive blocking operation on the main thread             | `autocannon -c 2 -d 60 --timeout 30 http://localhost:3030/blocking-without-worker`               |
| `/blocking-with-worker`    | CPU-intensive task handled via worker threads                   | `autocannon -c 2 -d 60 --timeout 30 "http://localhost:3030/blocking-with-worker?thread_count=2"` |

### 3. Results [on My Machine]

| Endpoint                               | Avg Latency | Max Latency | Throughput (Req/Sec) | Total Requests | Notes                                                                         |
| -------------------------------------- | ----------- | ----------- | -------------------- | -------------- | ----------------------------------------------------------------------------- |
| `/non-blocking`                        | 0.02 ms     | 12 ms       | 5,919                | 355k           | Handles requests asynchronously. Excellent performance.                       |
| `/blocking-without-worker`             | 11,650 ms   | 23,937 ms   | 0.15                 | 13             | Blocks main thread. Extremely slow and almost unresponsive.                   |
| `/blocking-with-worker?thread_count=2` | 3,935 ms    | 5,735 ms    | 0.5                  | 32             | Uses worker threads. Much better than blocking-without-worker |

> **Tips for tuning:**
>
> * `-c` → concurrent connections
> * `-d` → duration of test (seconds)
> * `--timeout` → request timeout (seconds)
> * `thread_count` → number of worker threads for CPU-intensive tasks

## Best Practices

1. Choose thread count based on available CPU cores
2. Use worker threads only for CPU-intensive tasks
3. Implement proper error handling for worker threads
4. Consider the overhead of creating worker threads
