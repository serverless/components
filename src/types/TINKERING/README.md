# Subscriptions System Scratchpad

This is a collection of thoughts around the new Subscription sytem (originated in [http://collabedit.com/gpf3b](http://collabedit.com/gpf3b)).

## General thoughts

### Modes of operation

- Within the same cloud
  - Events remain within the same cloud
  - Http event from API Gateway
  - Examples:
    - [S3] -> [Lambda]
    - [S3] -> [EG] -> [Lambda] _optional_
- Multi-Cloud
  - Connecting event sources to sinks in different clouds
  - Examples:
    - [S3] -> [Lambda (gcp-sdk)] -> [GCF]
    - [S3] -> [Lambda] -> [EG] -> [GCF] <-- Preferred way
    - [Twilio] -> [EG] -> [GCF]
    - [Twilio] -> [APIG] -> [Lambda] -> [EG] -> [GCF]
