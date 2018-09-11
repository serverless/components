<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_HEADER) -->
# Twilio Phone Number
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
| **addressSid**| `string` | The 34 character sid of the address Twilio should associate with the number.
| **voiceUrl**| `string` | The URL that Twilio should request when somebody dials the new phone number. The VoiceURL will no longer be used if a VoiceApplicationSid or a TrunkSid is set.
| **voiceMethod**| `string` | The HTTP method that should be used to request the VoiceUrl. Must be either GET or POST. Defaults to POST.
| **voiceFallbackUrl**| `string` | A URL that Twilio will request if an error occurs requesting or executing the TwiML at Url.
| **voiceFallbackMethod**| `string` | The HTTP method that should be used to request the VoiceFallbackUrl. Either GET or POST. Defaults to POST.
| **apiVersion**| `string` | The Twilio REST API version to use for incoming calls made to this number. If omitted, uses 2010-04-01.
| **statusCallbackMethod**| `string` | The HTTP method Twilio will use to make requests to the StatusCallback URL. Either GET or POST. Defaults to POST.
| **voiceCallerIdLookup**| `string` | Do a lookup of a caller's name from the CNAM database and post it to your app. Either true or false. Defaults to false.
| **voiceApplicationSid**| `string` | The 34 character sid of the application Twilio should use to handle phone calls to the new number. If a VoiceApplicationSid is present, Twilio will ignore all of the voice urls above and use those set on the application. Setting a VoiceApplicationSid will automatically delete your TrunkSid and vice versa.
| **trunkSid**| `string` | The 34 character sid of the Trunk Twilio should use to handle phone calls to this number. If a TrunkSid is present, Twilio will ignore all of the voice urls and voice applications above and use those set on the Trunk. Setting a TrunkSid will automatically delete your VoiceApplicationSid and vice versa.
| **smsUrl**| `string` | The URL that Twilio should request when somebody sends an SMS to the phone number.
| **friendlyName**| `string` | A human readable description of the new incoming phone number. Maximum 64 characters. Defaults to a formatted version of the number.
| **smsMethod**| `string` | The HTTP method that should be used to request the SmsUrl. Must be either GET or POST. Defaults to POST.
| **areaCode**| `string` | The desired area code for your new incoming phone number. Any three digit, US or Canada area code is valid. Twilio will provision a random phone number within this area code for you. You must include either this or a PhoneNumber parameter to have your POST succeed. (US and Canada only)
| **smsFallbackUrl**| `string` | A URL that Twilio will request if an error occurs requesting or executing the TwiML defined by SmsUrl.
| **phoneNumber**| `string` | The phone number you want to purchase. The number should be formatted starting with a '+' followed by the country code and the number in E.164 format e.g., '+15105555555'. You must include either this or an AreaCode parameter to have your POST succeed.
| **smsFallbackMethod**| `string` | The HTTP method that should be used to request the SmsFallbackUrl. Must be either GET or POST. Defaults to POST.
| **smsApplicationSid**| `string` | The 34 character sid of the application Twilio should use to handle SMSs sent to the new number. If a SmsApplicationSid is present, Twilio will ignore all of the SMS urls above and use those set on the application.
| **statusCallback**| `string` | The URL that Twilio will request to pass status parameters (such as call ended) to your application.
| **authToken**| `string`<br/>*required* | The auth token.
| **accountSid**| `string`<br/>*required* | The unique id of the Account responsible for this application.

<!-- AUTO-GENERATED-CONTENT:END -->

<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_OUTPUT_TYPES) -->
## Output Types
| Name | Type | Description |
|:------ |:-----|:-----------------|
| **addressSid**| `string` | The 34 character sid of the address Twilio should associate with the number.
| **smsUrl**| `string` | The URL that Twilio should request when somebody sends an SMS to the phone number.
| **trunkSid**| `string` | The 34 character sid of the Trunk Twilio should use to handle phone calls to this number. If a TrunkSid is present, Twilio will ignore all of the voice urls and voice applications above and use those set on the Trunk. Setting a TrunkSid will automatically delete your VoiceApplicationSid and vice versa.
| **voiceApplicationSid**| `string` | The 34 character sid of the application Twilio should use to handle phone calls to the new number. If a VoiceApplicationSid is present, Twilio will ignore all of the voice urls above and use those set on the application. Setting a VoiceApplicationSid will automatically delete your TrunkSid and vice versa.
| **smsMethod**| `string` | The HTTP method that should be used to request the SmsUrl. Must be either GET or POST. Defaults to POST.
| **statusCallbackMethod**| `string` | The HTTP method Twilio will use to make requests to the StatusCallback URL. Either GET or POST. Defaults to POST.
| **statusCallback**| `string` | The URL that Twilio will request to pass status parameters (such as call ended) to your application.
| **phoneNumber**| `string` | The phone number you want to purchase. The number should be formatted starting with a '+' followed by the country code and the number in E.164 format e.g., '+15105555555'. You must include either this or an AreaCode parameter to have your POST succeed.
| **friendlyName**| `string` | A human readable description of the new incoming phone number. Maximum 64 characters. Defaults to a formatted version of the number.
| **apiVersion**| `string` | The Twilio REST API version to use for incoming calls made to this number. If omitted, uses 2010-04-01.
| **smsFallbackUrl**| `string` | A URL that Twilio will request if an error occurs requesting or executing the TwiML defined by SmsUrl.
| **voiceFallbackMethod**| `string` | The HTTP method that should be used to request the VoiceFallbackUrl. Either GET or POST. Defaults to POST.
| **smsFallbackMethod**| `string` | The HTTP method that should be used to request the SmsFallbackUrl. Must be either GET or POST. Defaults to POST.
| **voiceMethod**| `string` | The HTTP method that should be used to request the VoiceUrl. Must be either GET or POST. Defaults to POST.
| **smsApplicationSid**| `string` | The 34 character sid of the application Twilio should use to handle SMSs sent to the new number. If a SmsApplicationSid is present, Twilio will ignore all of the SMS urls above and use those set on the application.
| **voiceFallbackUrl**| `string` | A URL that Twilio will request if an error occurs requesting or executing the TwiML at Url.
| **voiceCallerIdLookup**| `string` | Do a lookup of a caller's name from the CNAM database and post it to your app. Either true or false. Defaults to false.
| **voiceUrl**| `string` | The URL that Twilio should request when somebody dials the new phone number. The VoiceURL will no longer be used if a VoiceApplicationSid or a TrunkSid is set.
| **uri**| `string` | The uri of your application phone number
| **emergencyAddressSid**| `string` | The sid of your emergency address
| **emergencyStatus**| `string` | The emergency status of your phone number
| **origin**| `string` | The phone number origin
| **identitySid**| `string` | The phone number identity sid
| **dateCreated**| `string` | The date your phone number was created
| **beta**| `string` | Marked as true if a new phone number
| **addressRequirements**| `string` | The phone number address requirements
| **dateUpdated**| `string` | The date your phone number was updated
| **sid**| `string` | The sid of your application phone number
| **capabilities**| `string` | The phone number capabilities
| **accountSid**| `string`<br/>*required* | The unique id of the Account responsible for this application.

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
