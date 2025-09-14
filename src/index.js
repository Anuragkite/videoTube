import {app} from "./app.js"
import dotenv from "dotenv"
import connectDB from "./db/index.js";
dotenv.config();
const PORT=process.env.PORT
connectDB()
.then(()=>{
    app.listen(PORT,()=>{
    console.log(`This server is running on the port number ${PORT}`);
})
})
.catch((err)=>{
    console.log("mongodb connection error");
})