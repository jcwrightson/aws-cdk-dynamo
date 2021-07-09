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
