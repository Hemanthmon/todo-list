const accessModel = require("../models/accessModel");

const ratelimiting = async (req, res, next) => {
    console.log(req.session.id);

    const sid = req.session.id;
    try {
        // Change 1: Corrected the variable name to accessDb
        const accessDb = await accessModel.findOne({ sessionId: sid });
        console.log(accessDb);

        // this is the first request, create an entry in accessDb
        if (!accessDb) {
            const accessObj = new accessModel({ sessionId: sid, time: Date.now() });
            // Change 2: Corrected the method call to use accessObj
            await accessObj.save();
            next();
            return;
        }
        
        // Change 3: Corrected the method name to Date.now()
        console.log((Date.now() - accessDb.time) / 1000);

        // Change 3: Corrected the method name to Date.now()
        const diff = (Date.now() - accessDb.time) / 1000;

        if (diff < 1) { // one request per second
            return res
                .status(400)
                .json("Too many requests, kindly try later");
        }
        
        // req time is fine
        // Change 5: Corrected the method to findOneAndUpdate
        await accessModel.findOneAndUpdate(
            { sessionId: sid },
            { time: Date.now() }
        );
        next();
    } catch (error) {
        // Change 4: Corrected the log message
        console.log("The error from rateLimiting", error);
        return res.status(500).json(error);
    }
};

module.exports = ratelimiting;
