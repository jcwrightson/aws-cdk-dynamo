#!/usr/bin/env node
import * as cdk from '@aws-cdk/core';
import { CdkDynamoLambdaStack } from '../lib/cdk-dynamo-lambda-stack';

const app = new cdk.App();
new CdkDynamoLambdaStack(app, 'CdkDynamoLambdaStack');
