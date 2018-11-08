# AwsProvider

The `AwsProvider` configures Provider details for Amazon Web Services. It has the following
options:
 * `credentials` - an Optional parameter containing access key id and secret access key OR a
   security token and session token. If both are omitted, credentials will be loaded from
   `~/.aws/credentials`
 * `region` - the AWS region to use. Optional, defaults to `us-east-1`

## Examples
### Using access key & secret and `us-west-2`:
```yaml
type: AwsProvider
inputs:
  credentials:
    accessKeyId: AAAAA
    secretAccessKey: BBBBBB
  region: us-west-2
```

### Using temporary sessions for MFA
```yaml
type: AwsProvider
inputs:
  credentials:
    accessKeyId: AAAAA
    secretAccessKey: BBBBBB
    securityToken: CCCCCCCC
    sessionToken: DDDDDDDD
```

### Using `~/.aws/credentials` and default region
```yaml
type: AwsProvider
inputs: {}
```
