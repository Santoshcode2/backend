//mongoose ke through database connect karunga mai 
import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
//database is in another continent
const connectDB = aync () => {
        try{
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`\n MongoDB connected !! DB HOST:${connectionInstance.connecttion.host}`);
        }
        catch(error){
            console.log("MONGODB connection error",error);
            process.exit(1)
        }
}

export default connectDB 