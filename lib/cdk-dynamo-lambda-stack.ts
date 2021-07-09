import * as cdk from '@aws-cdk/core'
import * as lambda from '@aws-cdk/aws-lambda'
import * as dynamodb from '@aws-cdk/aws-dynamodb'
import * as apigw from '@aws-cdk/aws-apigatewayv2'
import * as integrations from '@aws-cdk/aws-apigatewayv2-integrations'
import * as iam from '@aws-cdk/aws-iam'

export class CdkDynamoLambdaStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    // 1. Create a DynamoDB Table with a Partition Key
    const table = new dynamodb.Table(this, 'test', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
    })

    // 2. Create an API to interact with our DB
    const api = new apigw.HttpApi(this, 'dynamo-api', {
      // Some basic cors config
      corsPreflight: {
        allowMethods: [
          apigw.CorsHttpMethod.GET,
          apigw.CorsHttpMethod.OPTIONS,
          apigw.CorsHttpMethod.POST,
        ],
        allowOrigins: ['*'], // ToDo: Change this to frontend URL later
      },
    })

    // 3. Create GET lambda
    const getAllLambda = new lambda.Function(this, 'getAllLambdaHandler', {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: new lambda.AssetCode('functions'),
      handler: 'get.getAllItemsHandler',
      environment: {
        TABLE_NAME: table.tableName, // we'll need this later
      },
    })

    // 3. Create POST lambda
    const postItemLambda = new lambda.Function(this, 'putItemHandler', {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: new lambda.AssetCode('functions'),
      handler: 'post.putItemHandler',
      environment: {
        TABLE_NAME: table.tableName, // we'll need this later
      },
    })

    // 4. Grant specific permissions to each lambda
    table.grantReadData(getAllLambda)
    table.grantWriteData(postItemLambda)

    // 5. Add routes
    api.addRoutes({
      path: '/',
      methods: [apigw.HttpMethod.GET],
      integration: new integrations.LambdaProxyIntegration({
        handler: getAllLambda,
      }),
    })

    api.addRoutes({
      path: '/',
      methods: [apigw.HttpMethod.POST],
      integration: new integrations.LambdaProxyIntegration({
        handler: postItemLambda,
      }),
    })

    // 6. IAM: Add Permissions Boundary to all entities created by stack (optional)
    const boundary = iam.ManagedPolicy.fromManagedPolicyArn(
      this,
      'Boundary',
      `arn:aws:iam::${process.env.AWS_ACCOUNT}:policy/ScopePermissions`
    )

    iam.PermissionsBoundary.of(this).apply(boundary)

    // 7. Output API URL
    new cdk.CfnOutput(this, 'API URL', {
      value: api.url ?? 'No URL',
    })
  }
}
