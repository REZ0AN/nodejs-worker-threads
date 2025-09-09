import {workerData, parentPort} from "worker_threads";

// CPU Intensive Tasks O(n) n is large
let counter = 0;
const n = 5000000000;

// assign each worker its own chunk
let chunk = Math.floor(n/workerData.thread_count);
let start = chunk * workerData.thread_id;
let end = chunk + start;

// If n % thread_count ≠ 0, assign the remainder of iterations to the last worker
if (workerData.thread_count-1 == workerData.thread_id) {
    end = n
}

try {

    // Simulate CPU intensive task
    for(let i = start; i < end;i++) {
        counter++;
    }

    // Message Passing to Main Thread from Worker Thread
    parentPort.postMessage({
        thread_id: workerData.thread_id,
        counter,
    });

} catch (err) {
    // Send error back to main thread
    parentPort.postMessage({ error: err.message, thread_id: workerData.thread_id});
    throw err; // ensures "exit" emits non-zero code
}

