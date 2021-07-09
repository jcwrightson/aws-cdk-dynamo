const uuid = require('uuid')
const dynamodb = require('aws-sdk/clients/dynamodb')
const docClient = new dynamodb.DocumentClient()
const tableName = process.env.TABLE_NAME

exports.putItemHandler = async (event) => {
  console.info('received:', event)

  const body = JSON.parse(event.body)

  const params = {
    TableName: tableName,
    Item: { id: uuid.v4(), ...body },
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
