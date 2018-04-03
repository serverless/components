# Example: Rest API

An example REST API application composed of a few serverless components. The REST API exposes one route `POST /faker` that takes a `category`, a `item` and an optional `locale` attribute, and returns fake data. The application is deployable to AWS.

## Components

The sample application is composed of the following components:

* **Lambda function**: It creates a Lambda functions with the handler code provided to it. It creates a default role and attaches it to the Lambda function. The `aws-lambda` component encapsulates all that functionality.
* **REST API**: It creates a REST API for the AWS API Gateway. It takes a structure for the routes, and maps Lambda functions provided to it. The `rest-api` component encapsulates all that functionality.

## Operations

### Deploy

To deploy the application and create all dependent resources automatically, simply do:

```
$ components deploy
```

### Remove

To remove the application and delete all dependent resources automatically, simply do:

```
$ components remove
```

## Usage

You can try to call the API with the following sample data:

### Name

```
curl -X POST https://xxxxxxxxx.execute-api.us-east-1.amazonaws.com/dev/faker -d '{"category":"name", "item":"findName"}'

{
    "category": "name",
    "item": "findName",
    "value": "Annie Gislason"
}
```
Or you can set locale, e.g. 'de':

```
curl -X POST https://xxxxxxxxx.execute-api.us-east-1.amazonaws.com/dev/faker -d '{"category":"name", "item":"findName", "locale": "de"}'

{
    "category": "name",
    "item": "findName",
    "value": "Semih Gilde"
}
```
### Lorem

```
curl -X POST https://xxxxxxxxx.execute-api.us-east-1.amazonaws.com/dev/faker -d '{"category":"lorem", "item":"paragraph"}'

{
    "category": "lorem",
    "item": "paragraph",
    "value": "Similique dolorem doloremque enim sed dolores cupiditate voluptatem. Sed itaque sunt commodi. Ab sint eius facere blanditiis magnam voluptatem rem aliquid ratione."
}
```

### User Card

```
curl -X POST https://xxxxxxxxx.execute-api.us-east-1.amazonaws.com/dev/faker -d '{"category":"helpers", "item":"userCard"}'

{
    "category": "helpers",
    "item": "userCard",
    "fakeValue": {
        "address": {
            "city": "Sadieland",
            "geo": {
                "lat": "-68.7157",
                "lng": "126.3087"
            },
            "street": "Mosciski Plains",
            "suite": "Suite 018",
            "zipcode": "58459-8486"
        },
        "company": {
            "bs": "interactive innovate architectures",
            "catchPhrase": "Synergized 5th generation methodology",
            "name": "Hackett - Bergnaum"
        },
        "email": "Erna_Kunde@yahoo.com",
        "name": "Rickie Renner",
        "phone": "291.711.1425",
        "username": "Hattie4",
        "website": "ruby.net"
    }
}
```

### Full Card

```
curl -X POST https://xxxxxxxxx.execute-api.us-east-1.amazonaws.com/dev/faker -d '{"category":"helpers", "item":"createCard"}'

{
    "category": "helpers",
    "item": "createCard",
    "fakeValue": {
        "accountHistory": [
            {
                "account": "95007912",
                "amount": "134.58",
                "business": "Lehner - Dach",
                "date": "2012-02-02T00:00:00.000Z",
                "name": "Savings Account 4211",
                "type": "invoice"
            },
            {
                "account": "12280367",
                "amount": "704.28",
                "business": "Kling and Sons",
                "date": "2012-02-02T00:00:00.000Z",
                "name": "Investment Account 5223",
                "type": "payment"
            },
            {
                "account": "88811101",
                "amount": "445.35",
                "business": "Hickle, Bogisich and Collins",
                "date": "2012-02-02T00:00:00.000Z",
                "name": "Money Market Account 4843",
                "type": "deposit"
            }
        ],
        "address": {
            "city": "Paigeview",
            "country": "Seychelles",
            "geo": {
                "lat": "31.5784",
                "lng": "-175.2559"
            },
            "state": "Texas",
            "streetA": "Breitenberg Heights",
            "streetB": "0209 Gladys Lock",
            "streetC": "0232 Brionna Square Apt. 072",
            "streetD": "Suite 380",
            "zipcode": "21215-2523"
        },
        "company": {
            "bs": "B2C reintermediate solutions",
            "catchPhrase": "Quality-focused reciprocal task-force",
            "name": "Flatley, Rosenbaum and Hamill"
        },
        "email": "Myriam.Considine51@hotmail.com",
        "name": "Kareem Hoppe",
        "phone": "1-690-223-7988 x518",
        "posts": [
            {
                "paragraph": "Officia repellendus quo non similique explicabo maxime quis. Voluptas enim et cumque et temporibus quae. Omnis suscipit voluptas alias facilis occaecati officiis. Molestiae numquam eaque magnam vitae et sunt explicabo impedit et. In nobis nihil enim magnam suscipit ratione eaque consequatur.",
                "sentence": "Sint repellat sit est deserunt eum.",
                "sentences": "Exercitationem laboriosam eveniet aut ullam qui molestiae a. Alias et totam dignissimos est quod et omnis. Libero corrupti vero animi aut architecto iusto officia ipsam in.",
                "words": "qui quae et"
            },
            {
                "paragraph": "Quia ipsa repudiandae omnis cum culpa omnis. Incidunt est dolores quae reiciendis. Perferendis aut corrupti inventore voluptatem dolores perferendis sunt id sint.",
                "sentence": "Porro est illum quia fuga deleniti numquam ex voluptatem eveniet.",
                "sentences": "Non consequatur earum. Itaque eos provident et omnis. Perferendis quia ipsa culpa eveniet vel voluptatem eos aliquam. Quo maiores possimus incidunt est eos molestiae. Ipsa nemo rerum repellat cupiditate similique magni minus voluptate. Animi non molestiae dolore aspernatur repellendus sapiente reiciendis facilis.",
                "words": "sit unde rerum"
            },
            {
                "paragraph": "Iure voluptatum accusamus doloremque. Omnis maxime quia at laudantium nihil voluptatibus reiciendis ullam atque. Nobis dolorem quae totam aliquid. Est assumenda tempora consequatur esse qui vel eligendi voluptatem ea. Et velit debitis at exercitationem vero. Facilis provident officiis voluptatem ullam esse ut quam soluta quia.",
                "sentence": "Officia et ut dolorem amet consequuntur in explicabo.",
                "sentences": "Iure illum nisi possimus. Quidem quis omnis iusto doloribus ut veniam. Dolores ex voluptatibus facilis ex architecto fugiat sed temporibus animi. Ipsum natus eius fugiat totam dicta fugiat ad sed quia. Consequatur laborum possimus.",
                "words": "deleniti laboriosam et"
            }
        ],
        "username": "Deontae.Braun2",
        "website": "delmer.net"
    }
}
```
