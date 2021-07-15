const uuid = require('uuid')
const tableName = process.env.TABLE_NAME
const dynamodb = require('aws-sdk/clients/dynamodb')
const docClient = new dynamodb.DocumentClient()

exports.getAllItemsHandler = async (event) => {
  const params = {
    TableName: tableName,
  }

  const data = await docClient.scan(params).promise()
  const items = data.Items

  const response = {
    statusCode: 200,
    body: JSON.stringify(items),
  }

  console.info(
    `response from: ${event.path} statusCode: ${response.statusCode} body: ${response.body}`
  )

  return response
}

exports.getByIdHandler = async (event) => {
  const params = {
    TableName: tableName,
    Key: {
      id: event.pathParameters.id,
    },
  }

  const data = await docClient.get(params).promise()
  const item = data.Item

  const response = {
    statusCode: 200,
    body: JSON.stringify(item),
  }

  console.info(
    `response from: ${event.path} statusCode: ${response.statusCode} body: ${response.body}`
  )

  return response
}

// ToDo: Request should be authenticated
exports.putItemHandler = async (event) => {
  console.info('received:', event)

  const body = JSON.parse(event.body)

  // ToDo: Validate event.body

  const params = {
    TableName: tableName,
    Item: { id: body.id ?? uuid.v4(), ...body },
  }

  await docClient.put(params).promise()

  const response = {
    statusCode: 200,
    body: JSON.stringify(body),
  }

  console.info(
    `response from: ${event.path} statusCode: ${response.statusCode} body: ${response.body}`
  )
  return response
}
