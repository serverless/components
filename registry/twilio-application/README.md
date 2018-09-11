<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_HEADER) -->
# Twilio Application
<!-- AUTO-GENERATED-CONTENT:END -->

<!-- AUTO-GENERATED-CONTENT:START (TOC) -->
- [Input Types](#input-types)
- [Output Types](#output-types)
- [Example](#example)
<!-- AUTO-GENERATED-CONTENT:END -->

<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_INPUT_TYPES) -->
## Input Types
| Name | Type | Description |
|:------ |:-----|:-----------------|
| **messageStatusCallback**| `string` | Twilio will make a POST request to this URL to pass status parameters (such as sent or failed) to your application if you use the /Messages endpoint to send the message and specify this application's Sid as the ApplicationSid on an outgoing SMS request.
| **voiceUrl**| `string` | The URL that Twilio should request when somebody dials a phone number assigned to this application.
| **voiceMethod**| `string` | The HTTP method that should be used to request the VoiceUrl. Must be either GET or POST. Defaults to POST.
| **voiceFallbackUrl**| `string` | A URL that Twilio will request if an error occurs requesting or executing the TwiML at Url.
| **apiVersion**| `string` | Requests to this application's URLs will start a new TwiML session with this API version. Either 2010-04-01 or 2008-08-01. Defaults to your account's default API version.
| **smsFallbackMethod**| `string` | The HTTP method Twilio will use when requesting the above URL. Either GET or POST.
| **statusCallbackMethod**| `string` | The HTTP method Twilio will use to make requests to the StatusCallback URL. Either GET or POST. Defaults to POST.
| **voiceCallerIdLookup**| `boolean` | Do a lookup of a caller's name from the CNAM database and post it to your app. Either true or false. Defaults to false.
| **smsUrl**| `string` | The URL that Twilio should request when somebody sends an SMS to a phone number assigned to this application.
| **smsMethod**| `string` | The HTTP method Twilio will use when making requests to the SmsUrl. Either GET or POST.
| **smsStatusCallback**| `string` | The URL that Twilio will POST to when a message is sent via the /SMS/Messages endpoint if you specify the Sid of this application on an outgoing SMS request.
| **smsFallbackUrl**| `string` | The URL that Twilio will request if an error occurs retrieving or executing the TwiML from SmsUrl.
| **voiceFallbackMethod**| `string` | The HTTP method that should be used to request the VoiceFallbackUrl. Either GET or POST. Defaults to POST.
| **statusCallback**| `string` | The URL that Twilio will request to pass status parameters (such as call ended) to your application.
| **authToken**| `string`<br/>*required* | The auth token.
| **friendlyName**| `string`<br/>*required* | A human readable description of the new application. Maximum 64 characters.
| **accountSid**| `string`<br/>*required* | The unique id of the Account responsible for this application.

<!-- AUTO-GENERATED-CONTENT:END -->

<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_OUTPUT_TYPES) -->
## Output Types
| Name | Type | Description |
|:------ |:-----|:-----------------|
| **sid**| `string` | The SID of your twilio application
| **apiVersion**| `string` | Requests to this application's URLs will start a new TwiML session with this API version. Either 2010-04-01 or 2008-08-01. Defaults to your account's default API version.
| **voiceUrl**| `string` | The URL that Twilio should request when somebody dials a phone number assigned to this application.
| **voiceMethod**| `string` | The HTTP method that should be used to request the VoiceUrl. Must be either GET or POST. Defaults to POST.
| **voiceFallbackUrl**| `string` | A URL that Twilio will request if an error occurs requesting or executing the TwiML at Url.
| **friendlyName**| `string` | A human readable description of the new application. Maximum 64 characters.
| **statusCallback**| `string` | The URL that Twilio will request to pass status parameters (such as call ended) to your application.
| **statusCallbackMethod**| `string` | The HTTP method Twilio will use to make requests to the StatusCallback URL. Either GET or POST. Defaults to POST.
| **voiceCallerIdLookup**| `boolean` | Do a lookup of a caller's name from the CNAM database and post it to your app. Either true or false. Defaults to false.
| **smsUrl**| `string` | The URL that Twilio should request when somebody sends an SMS to a phone number assigned to this application.
| **smsMethod**| `string` | The HTTP method Twilio will use when making requests to the SmsUrl. Either GET or POST.
| **accountSid**| `string` | The unique id of the Account responsible for this application.
| **smsFallbackUrl**| `string` | The URL that Twilio will request if an error occurs retrieving or executing the TwiML from SmsUrl.
| **dateUpdated**| `string` | The date the application was updated
| **smsFallbackMethod**| `string` | The HTTP method Twilio will use when requesting the above URL. Either GET or POST.
| **dateCreated**| `string` | The date the application was created
| **smsStatusCallback**| `string` | The URL that Twilio will POST to when a message is sent via the /SMS/Messages endpoint if you specify the Sid of this application on an outgoing SMS request.
| **uri**| `string` | The URI of your twilio application
| **messageStatusCallback**| `string` | Twilio will make a POST request to this URL to pass status parameters (such as sent or failed) to your application if you use the /Messages endpoint to send the message and specify this application's Sid as the ApplicationSid on an outgoing SMS request.
| **voiceFallbackMethod**| `string` | The HTTP method that should be used to request the VoiceFallbackUrl. Either GET or POST. Defaults to POST.

<!-- AUTO-GENERATED-CONTENT:END -->

<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_EXAMPLES) -->
## Example
```yml
type: my-application
components:
  myAzureStorageBlob:
    type: azure-storage-blob
    inputs:
      description: The blob is for web contents
      name: 'stor${self.serviceId}'
      blobContainer: contents
      resourceGroup: serverless-rg
      subscriptionId: 38ee4b45-d54e-451e-bdff-d08b951f32ae
      directoryId: qwertyuiop.onmicrosoft.com

```
<!-- AUTO-GENERATED-CONTENT:END -->
