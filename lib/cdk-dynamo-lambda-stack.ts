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
    const table = new dynamodb.Table(this, 'jcw-product', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    })

    // 2. Create an API to interact with our DB
    const api = new apigw.HttpApi(this, 'jcw-product-api', {
      // Some basic cors config
      corsPreflight: {
        allowMethods: [
          apigw.CorsHttpMethod.GET,
          apigw.CorsHttpMethod.OPTIONS,
          apigw.CorsHttpMethod.PUT,
        ],
        allowOrigins: ['*'], // ToDo: Change this to frontend URL later
      },
    })

    // 3. Get all products
    const getProductsLambda = new lambda.Function(
      this,
      'jcw-get-products-handler',
      {
        runtime: lambda.Runtime.NODEJS_14_X,
        code: new lambda.AssetCode('functions'),
        handler: 'product.getAllItemsHandler',
        environment: {
          TABLE_NAME: table.tableName, // we'll need this later
        },
      }
    )

    // Get product by id
    const getProductLambda = new lambda.Function(
      this,
      'jcw-get-product-handler',
      {
        runtime: lambda.Runtime.NODEJS_14_X,
        code: new lambda.AssetCode('functions'),
        handler: 'product.getByIdHandler',
        environment: {
          TABLE_NAME: table.tableName, // we'll need this later
        },
      }
    )

    // Create product
    const putProductLambda = new lambda.Function(
      this,
      'jcw-put-product-handler',
      {
        runtime: lambda.Runtime.NODEJS_14_X,
        code: new lambda.AssetCode('functions'),
        handler: 'product.putItemHandler',
        environment: {
          TABLE_NAME: table.tableName, // we'll need this later
        },
      }
    )

    // 4. Add routes
    api.addRoutes({
      path: '/product',
      methods: [apigw.HttpMethod.GET],
      integration: new integrations.LambdaProxyIntegration({
        handler: getProductsLambda,
      }),
    })

    api.addRoutes({
      path: '/product/{id}',
      methods: [apigw.HttpMethod.GET],
      integration: new integrations.LambdaProxyIntegration({
        handler: getProductLambda,
      }),
    })

    // ToDo: Should require authentication
    api.addRoutes({
      path: '/product',
      methods: [apigw.HttpMethod.PUT],
      integration: new integrations.LambdaProxyIntegration({
        handler: putProductLambda,
      }),
    })

    // 5. Grant specific permissions to each lambda
    table.grantReadData(getProductsLambda)
    table.grantReadData(getProductLambda)

    // ToDo: Should require authentication
    table.grantReadWriteData(putProductLambda)

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
