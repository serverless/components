# DynamoDB component

The DynamoDB component takes one or more table models as input and provides a full CRUD functionality for the data for the tables.

## Input Parameters

The component requires a few input parameters to manage the DynamoDB table(s):

* `region`: *required* - `string`: AWS region where the table(s) will be created.
* `tables`: *required* - An array of table models.
  * `name`: *required* - `string`: The name of the table.
  * `hashKey`: *required* - `string`: The field name that will be the partition key of type 'HASH'.
  * `rangeKey`: *optional* - `string`: The field name that will be the sort key of type 'RANGE'.
  * `schema`: *required* - The schema for the table model.
    * [A list of field names and it's properties. See below.]
  * `options`: *optional* - A list of additional options.
    * [A list of options. See below.]

### Schema

The required `schema` attribute of the table model is defined as below:

* [`fieldname`]: *required* - `string`: The name of the field.
  * `type`: *required* - `string`: The type of the field. Values: [`string` | `number` | `binary` | `boolean` | `date` | `uuid` | `stringset` | `numberset` | `binaryset` | `email` | `username` | `password` | `birthyear`]
  * `options`: *optional*
    * `required`: *optional* - `boolean`: If the field is required or not. Values: [`true` | `false`]
    * `default`: *optional* - Default value for the field.

**Note**: In shorthand notation, it is [`fieldname`]: [`type`]

### Options

The optional `options` attribute of the table model is defined as below:

* `timestamps`: *optional* - `boolean`: Adds timestamp field names like `createdAt` and `updatedAt` to the table schema. Values: [`true` | `false`]
* `createdAt`: *optional* - `boolean`: Overrides the timestamp attribute to specify if `createdAt` field is wanted or not. Values: [`true` | `false`]
* `updatedAt`: *optional* - `boolean`: Overrides the timestamp clause to specify if `updatedAt` field is wanted or not. Values: [`true` | `false`]

### Example Inputs

```json
inputs:
  region: us-east-1
  tables:
    - name: BlogPost
      hashKey: authorEmail
      rangeKey: title
      schema:
        id: uuid
        authorName: string
        authorEmail:
          type: email
          options:
            required: true
        title: string
        content: binary
        tags: stringset
        published:
          type: boolean
          options:
            default: false
      options:
        timestamps: true
        createdAt: false
```

## Operations

The component exposes operations via two commands - `deploy` and `remove`.

### Deploy

The `deploy` command will create all the tables defined in the `tables` list.

```bash
$ components deploy

Creating table(s)...
All tables have been created.
```

### Remove

```bash
$ components remove --tablename <table name>

Removing table: '<table name>'
```

### Insert

The `insert` command will insert an item into the specified table.

#### If everything is good

```
$ components insert --tablename BlogPost --itemdata \
'{
  "authorName": "Rupak Ganguly",
  "authorEmail": "rupak@serverless.com",
  "title": "How to create a DynamoDB component",
  "content": "some junk data",
  "tags": ["how-to", "DynamoDB", "components", "serverless"],
  "published": true
}'

Item inserted to table: 'BlogPost'
{"authorName":"Rupak Ganguly","authorEmail":"rupak@serverless.com","title":"How to create a DynamoDB component","content":{"type":"Buffer","data":[115,111,109,101,32,109,111,114,101,32,106,117,110,107,32,100,97,116,97]},"tags":["how-to","DynamoDB","components","serverless"],"published":true,"id":"1959366d-d595-47a9-b9e1-baf929cea552"}
```

#### If parameters are missing or wrong

```
$ components insert

Incorrect or insufficient parameters.
Usage: insert --tablename <tablename> --itemdata <data in json format>

```

```
$ components insert --tablename BlogPost

Incorrect or insufficient parameters.
Usage: insert --tablename <tablename> --itemdata <data in json format>

```

#### If an error is thrown

```
$ components insert --tablename BlogPost --itemdata '{}'

Error inserting data to table: 'BlogPost'
One or more parameter values were invalid: Missing the key authorEmail in the item
```

### Get

The `get` command will retrieve an item from the specified table.

#### If everything is good

```
$ components get --tablename BlogPost --keydata \
'{
  "authorEmail": "rupak@serverless.com",
  "title": "How to create a DynamoDB component"
}'

Item retrieved from table: 'BlogPost'
{"content":{"type":"Buffer","data":[115,111,109,101,32,106,117,110,107,32,100,97,116,97]},"authorEmail":"rupak@serverless.com","authorName":"Rupak Ganguly","published":true,"id":"8461c448-cb60-4045-8a71-4c9c1a8a1e13","tags":["DynamoDB","components","how-to","serverless"],"title":"How to create a DynamoDB component"}
```

#### If an error is thrown

```
components get --tablename BlogPost --keydata \
'{
  "authorEmail": "rupak@serverless.com"
}'

Error retrieving item from table: 'BlogPost'
The provided key element does not match the schema
```

### Destroy

The `destroy` command will delete an item from the specified table.

#### If everything is good

```
$ components destroy --tablename BlogPost --keydata \
'{
  "authorEmail": "rupak@serverless.com",
  "title": "How to create a DynamoDB component"
}'

Item deleted from table: 'BlogPost'
```

#### If an error is thrown

```
components destroy --tablename BlogPost --keydata \
'{
  "authorEmail": "rupak@serverless.com"
}'

Error deleting item from table: 'BlogPost'
The provided key element does not match the schema
```
