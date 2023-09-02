/* optional - uncomment if forwarding data to your endpoint */
//const axios = require("axios")

exports.handler = async function (context, event, callback) {
    // get twilio client
    const client = context.getTwilioClient();

    //get callback payload data
    const callSid = event.CallSid;
    const callStatus = event.CallStatus;

    //get sync identifiers from environment variables
    const sync = {
        serviceSid: context.SYNC_SERVICE,
        mapSid: context.SYNC_MAP
    }

    //get studio execution data from sync
    const studio = await getStudioSidsFromCallSid(client, sync, callSid);
    console.log(`DEBUG: ${studio.flowSid} ${studio.executionSid}`);

    //when the call is over
    if (callStatus == "completed") {
        try {
            //get studio execution context steps
            const steps = await getExecutionContext(client, studio.flowSid, studio.executionSid);

            //update sync map item with steps
            await updateSyncMapItem(client, sync, callSid, studio, steps);

            /* optional - uncomment if forwarding data to your endpoint */
            // const data = {
            //     callSid: callSid,
            //     executionSid: studio.executionSid,
            //     flowSid: studio.flowSid,
            //     steps
            // }
            // await axios.post("UPDATE_WITH_YOUR_ENDPOINT_URL", data)
        }
        catch (e) {
            console.error(e)
        }
    }

    //return 302 redirect response
    //for more information: https://support.twilio.com/hc/en-us/articles/360019383714-Understanding-and-Avoiding-Stuck-Executions-in-Twilio-Studio
    const url = `https://webhooks.twilio.com/v1/Accounts/${context.ACCOUNT_SID}/Flows/${studio.flowSid}`
    const response = new Twilio.Response();
    response.setStatusCode(302);
    response.appendHeader('Location', url);
    return callback(null, response);
};

/** ----- FUNCTIONS ----- **/

//get sync map item for callSid key
const getStudioSidsFromCallSid = async (client, sync, callSid) => {
    let mapItem = await client.sync.v1.services(sync.serviceSid)
        .syncMaps(sync.mapSid)
        .syncMapItems(callSid)
        .fetch()

    return mapItem.data;
}

//get execution steps from context
const getExecutionContext = async (client, flowSid, executionSid) => {
    let execution_context = await client.studio.v2.flows(flowSid)
        .executions(executionSid)
        .executionContext()
        .fetch();

    return execution_context.context.widgets;
}

//update map with steps
const updateSyncMapItem = async (client, sync, callSid, studio, steps) => {
    await client.sync.v1.services(sync.serviceSid)
        .syncMaps(sync.mapSid)
        .syncMapItems(callSid)
        .update({
            data: {
                flowSid: studio.flowSid,
                execution_sid: studio.executionSid,
                steps
            }
        })
}


