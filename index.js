import express from "express";
import {Worker} from "worker_threads";
const app = express();



app.get('/non-blocking',(req, res)=> {
   
    res.send("Hello World");
})


app.get("/blocking-without-worker", (req,res) => {
    let counter = 0;
    const n = 5000000000;

    // Simulate CPU intensive task
    for(let i = 0; i < n;i++) {
        counter++;
    }
    res.send(`Result : ${counter}`);
})


const createWorkers = (thread_id, thread_count)=>{
    return new Promise((resolve, reject)=>{
        const newWorker = new Worker('./worker.js',
            {
                workerData:{
                    thread_count,
                    thread_id,
                }
            }
        )
        newWorker.on("message", (data) => {
            resolve(data); // return worker results
        });

        newWorker.on("error", (error) => {
            reject(error); // return worker runtime error
        });

        newWorker.on("exit",(code) => {
            if(code !=0){
                reject(new Error(`Worker ${thread_id} stopped with exit CODE ${code}`));
            }
        })
    })
}


app.get('/blocking-with-worker', async (req,res) => {
    try {
        let {thread_count} = req.query || null;
        if(!thread_count) {
            thread_count = 1
        }
        if (isNaN(thread_count)) {
            return res.status(400).send({ error: "thread_count must be a number" });
        }

        const workerPromises = [];

        
        for (let i = 0; i < Number(thread_count); i++) {
            workerPromises.push(createWorkers(i, Number(thread_count)));
        }
        const workerOutputs = await Promise.all(workerPromises);
        console.log("Worker outputs:", workerOutputs);
        let count = 0;
        for(let i = 0; i < Number(thread_count); i++) {
            count += workerOutputs[i].counter;
        }
        res.send(`Result: ${count}`);
    } catch (err) {
        console.error("Worker error: ",err);
        res.status(500).send({ error: err.message });
    }
})



process.on("uncaughtException", (err) => {
    console.error("Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

app.listen(3030,()=>{
    console.log(`Server listening on http://localhost:3030`);
})

