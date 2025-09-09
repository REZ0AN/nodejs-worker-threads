# Node.js Worker Threads
This project demonstrates how to use Worker Threads in Node.js to handle CPU-intensive tasks without blocking the main event loop.

## Why Worker Threads?

**Node.js** runs your `JavaScript` code on a single thread (event loop). This might sound limiting, but it actually makes `Node.js` really good at handling things like file I/O, network calls, and database calls, all the I/O stuff without getting stuck. The magic is its asynchronous, non-blocking nature.

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

### 3. Results [on 4-CPU-core system]

| Endpoint                               | Avg Latency | Max Latency | Throughput (Req/Sec) | Total Requests | Notes                                                                                                    |
| -------------------------------------- | ----------- | ----------- | -------------------- | -------------- | -------------------------------------------------------------------------------------------------------- |
| `/non-blocking`                        | 0.02 ms     | 12 ms       | 5,919                | 355k           | Handles requests asynchronously. Excellent performance.                                                  |
| `/blocking-without-worker`             | 11,650 ms   | 23,937 ms   | 0.15                 | 13             | Blocks main thread. Extremely slow and almost unresponsive.                                              |
| `/blocking-with-worker?thread_count=1` | 6,308 ms    | 6,986 ms    | 0.3                  | 20             | Single worker thread. Avoids main-thread blocking, but requests queue up.                                |
| `/blocking-with-worker?thread_count=2` | 3,859 ms    | 5,011 ms    | 0.5                  | 32             | Two worker threads. Parallelizes better than 1 thread, but still CPU-bound and slower than non-blocking. |
| `/blocking-with-worker?thread_count=3` | 5,803 ms    | 7,035 ms    | 0.34                 | 22             | Context-switching overhead. Performance degrades compared to 2 threads.        |
| `/blocking-with-worker?thread_count=4` | 5,755 ms    | 6,463 ms    | 0.34                 | 22             | Same as 3 threads: CPU thrashing and thread exhaustion. No performance gain.                             |


> **Tips for tuning:**
>
> * `-c` → concurrent connections
> * `-d` → duration of test (seconds)
> * `--timeout` → request timeout (seconds)
> * `thread_count` → number of worker threads for CPU-intensive tasks
> * Choose **thread_count** wisely, it can results in `Thread Exhaustion`

## Thread Exhaustion

A common misconception when working with Worker Threads in Node.js is that increasing the number of workers will always improve performance. However, the benchmark results show that this is not the case.

On a 4-core machine, the best performance was achieved with **2 worker threads**. Increasing the `thread_count` to 3 or 4 caused latency to rise and throughput to drop. This phenomenon is known as **thread exhaustion**.

### Why Thread Exhaustion Happens

1. **Main Thread Overhead**
    Node.js itself runs on a dedicated main thread that manages the event loop. If all CPU cores are occupied by worker threads, the main thread competes for CPU time, slowing down request handling.

2. **Context Switching Overhead**
    When there are more runnable threads than CPU cores, the OS scheduler constantly pauses/resumes threads to share CPU. This “thrashing” adds latency and wastes CPU cycles.

3. **Message Passing Costs**
    Each worker communicates with the main thread using message passing. With more workers, the coordination overhead grows. Instead of speeding things up, it increases total work.

4. **Benchmarking Environment**
      In this experiment, both the server and the benchmarking tool (`autocannon`) were running on the same machine, sharing CPU resources. This amplifies contention.

### Practical Recommendations

* Optimal `thread_count` is typically **(CPU cores − 1)** to leave a core available for the main thread and background processes.
* More threads do not always mean better performance; in fact, they may **degrade performance** due to contention and scheduling overhead.
* Always **benchmark on your target environment** to determine the optimal configuration for your workload.


## Best Practices

1. Choose thread count based on available CPU cores
2. Use worker threads only for CPU-intensive tasks
3. Implement proper error handling for worker threads
4. Consider the overhead of creating worker threads
