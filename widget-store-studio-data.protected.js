exports.handler = async function (context, event, callback) {
    // get twilio client
    const client = context.getTwilioClient();

    // setup a twilio response
    const response = new Twilio.Response();

    //get sync identifiers from environment variables
    const sync = {
        serviceSid: context.SYNC_SERVICE,
        mapSid: context.SYNC_MAP
    }

    //set sync time-to-live to a default 24 hours - can be adjusted if needed
    const sync_ttl = 24 * 60 * 60

    //get payload from studio widget parameters
    const { callSid, executionSid, flowSid } = event;
    console.log(`DEBUG: ${callSid}, ${executionSid}, ${flowSid}`);

    //create the sync map item
    try {
        await createStudioSyncItem(client, sync, callSid, executionSid, flowSid, sync_ttl);
        response.setBody("successSyncMapItemCreate")
    }
    catch (e) {
        console.error(`failed to create sync map item [${callSid}] [${executionSid}]: ${e}`)
        response.setBody("failedSyncMapItemCreate")
        response.setStatusCode(500)
    }

    return callback(null, response);
};

//create the sync map item to pair Call SID <> Studio SIDs
const createStudioSyncItem = async (client, sync, callSid, executionSid, flowSid, ttl) => {
    return await client.sync.v1.services(sync.serviceSid)
        .syncMaps(sync.mapSid)
        .syncMapItems
        .create({
            key: callSid,
            data: {
                executionSid: executionSid,
                flowSid: flowSid
            },
            ttl: ttl
        });
}
