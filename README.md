# Store Studio IVR path for Twilio Voice Calls

This solution utilizes [Twilio Sync](https://www.twilio.com/docs/sync/best-practices-use-cases) to capture **Studio IVR path data** for each **Voice Call**. 

This provides a link between Studio and Programmable Voice data, in a way that can be easily retrieved from an API or forwarded to your own endpoint for long-term retention.  


## How does this work?
At the *beginning of the Studio Flow*, a [`Run Function` Widget](https://www.twilio.com/docs/studio/widget-library/run-function) widget must be configured to point to the `/widget-store-studio-data` Serverless Function. 

This `/widget-store-studio-data` function will create a **Sync Map Item** with the `Call SID` as the "key" and Studio identifiers as the "data".</br>
<img width="226" alt="image" src="https://github.com/brypo/serverless-studio-voice-sync/assets/67924770/76bb9ab0-6680-4175-9fc6-35bdd90e8aa4">

In the *Phone Number configuration*, the `Call Status Changes` callback webhook must be updated to the URL for the `/pn-call-status-callback` Serverless Function. 

This `/pn-call-status-callback` function will listen for the [call status "completed"](https://support.twilio.com/hc/en-us/articles/223132547-What-are-the-Possible-Call-Statuses-and-What-do-They-Mean-#:~:text=is%20currently%20active.-,completed,-The%20connected%20call) event, and use the [Studio Execution Context API](https://www.twilio.com/docs/studio/rest-api/execution-context) to capture all the associated Studio Flow widget data (the IVR path).

The function then updates the Sync Map Item, where this data will be stored for a [default of 24 hours](https://github.com/brypo/serverless-studio-voice-sync/blob/b8a37e139ff9721ff516131051e8acea7f6a4c1a/widget-store-studio-data.protected.js#L15). TTL may need to be shortened if reaching [Sync Map Item limit](#considerations). 

<img width="226" alt="image" src="https://github.com/brypo/serverless-studio-voice-sync/assets/67924770/dcb03e97-5767-4ac6-b053-4589d636b7da">


## Considerations
Review the [Twilio Sync Limits](https://www.twilio.com/docs/sync/limits) if considering this solution for a production environment. 

In particular, this limit:
> Number of Items in the Map:	1,000,000 </br>
> Sync Maps should not contain more than a million of items.

Sync is intended for **short-term storage**. If this data must be retained long-term, it is recommended the data be [forwarded to your endpoint](#long-term-data-storage) for further processing.

## Setup

### Twilio Sync

Create the following resources, either from the Twilio Console or from the API:
- [Sync Service](https://www.twilio.com/docs/sync/api/service)
- [Sync Map](https://www.twilio.com/docs/sync/api/map-resource)

Make note of their identifiers for use in the next step.

</br>

### Serverless Functions
Both JavaScript files should be deployed as [Twilio Serverless Functions](https://www.twilio.com/docs/serverless/functions-assets/functions).

Make note of their URLs for use in the following steps.


#### Environment Variables
Use the `.env.example` file as a guide for your environment variables. See [Twilio documentation on Environment Variables](https://www.twilio.com/docs/serverless/functions-assets/functions/variables) for more information on how these work with Serverless Functions.

Requires variables:
- Sync Service (`ISxxxxx`)
- Sync Map Item (`MPxxxxx`)

### Dependencies
If intending to "forward data" to your own endpoint, the `axios` library will need to be added to your [Function Service dependencies](https://www.twilio.com/docs/serverless/functions-assets/functions/dependencies).

</br>

### Studio Flow - Run Function
<img width="426" alt="image" src="https://github.com/brypo/serverless-studio-voice-sync/assets/67924770/c77b2c0f-8bbb-4542-a07b-ff79b47bcc77">   
<img width="231" alt="image" src="https://github.com/brypo/serverless-studio-voice-sync/assets/67924770/1e53cc5d-2d8a-4d3e-86f4-43139616f804"></br></br>


Ensure the following `Function Parameters` are configured on the widget, as shown above:

| Key | Value |
| --- | --- |
| callSid | `{{trigger.call.CallSid}}`|
| executionSid |	`{{flow.sid}}` |
| flowSid	| `{{flow.flow_sid}}` |

</br>

### Phone Number - Call Status Changes Callback URL

Update the Phone Number `Call Status Changes` callback webhook from the Twilio Console or API.
<img width="426" alt="image" src="https://github.com/brypo/serverless-studio-voice-sync/assets/67924770/80ec9167-7ec3-4400-9090-8db0a310d4fc">

Set the webhook to your deployed Function URL for `/pn-call-status-callback`.


### Long-term Data Storage

Uncomment the "optional" code ([here](https://github.com/brypo/serverless-studio-voice-sync/blob/b8a37e139ff9721ff516131051e8acea7f6a4c1a/pn-call-status-callback.protected.js#L1) and [here](https://github.com/brypo/serverless-studio-voice-sync/blob/b8a37e139ff9721ff516131051e8acea7f6a4c1a/pn-call-status-callback.protected.js#L31)) to forward the Voice IVR path data to your own endpoint.

Make sure [the URL](https://github.com/brypo/serverless-studio-voice-sync/blob/b8a37e139ff9721ff516131051e8acea7f6a4c1a/pn-call-status-callback.protected.js#L38) is updated with your proper, valid endpoint.


# Disclaimer
This software is to be considered "sample code", a Type B Deliverable, and is delivered "as-is" to the user. Twilio bears no responsibility to support the use or implementation of this software.
