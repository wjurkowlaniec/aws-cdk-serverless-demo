const cdk = require('@aws-cdk/core');
const lambda = require('@aws-cdk/aws-lambda');
const dynamodb = require('@aws-cdk/aws-dynamodb');
const apigateway = require('@aws-cdk/aws-apigateway');
const route53 = require('@aws-cdk/aws-route53');
const route53Targets = require('@aws-cdk/aws-route53-targets');

const certificatemanager = require('@aws-cdk/aws-certificatemanager');



const VPC_ID = 'vpc-1635fd6f'
const ZONE_NAME = 'DOMAIN_NAME'
const ZONE_ID = 'ROUTE53 ZONE'
const ZONE_CERT = 'Certificate ARN'
const API_SUBDOMAIN = 'subdomain to create'


class ServerlessDemoStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);


    const dynamo = new dynamodb.Table(this, 'DemoSession', {
      partitionKey: {
        name: 'itemId',
        type: dynamodb.AttributeType.STRING
      },
      tableName: 'items',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const mainLambda = new lambda.Function(this, 'mainFunction', {
      code: new lambda.AssetCode('src'),
      handler: 'index.handler',
      runtime: lambda.Runtime.NODEJS_12_X,
      environment: {
        TABLE_NAME: dynamo.tableName,
      }
    });

    const secondLambda = new lambda.Function(this, 'secondLambda', {
      code: new lambda.AssetCode('src'),
      handler: 'index.handler',
      runtime: lambda.Runtime.NODEJS_12_X,
      environment: {
        TABLE_NAME: dynamo.tableName,
      }
    });


    dynamo.grantReadWriteData(mainLambda);

    const api = new apigateway.RestApi(this, 'TestAPI', {
      restApiName: 'ServerlessDemo backend',
    });
    const mainIntegration = new apigateway.LambdaIntegration(mainLambda);


    const itemsApiEndpoint = api.root.addResource('items');
    itemsApiEndpoint.addMethod('GET', mainIntegration);

    const healthApiEndpoint = api.root.addResource('health');
    healthApiEndpoint.addMethod('GET', mainIntegration);

    


    this.mapApiToSubdomain(API_SUBDOMAIN, api);
  }

  mapApiToSubdomain(subdomain, apiGatewayInstance) {
    const domain_name = subdomain + '.' + ZONE_NAME
    const url = 'https://' + domain_name

    const cert = certificatemanager.Certificate.fromCertificateArn(this, 'DomainCertificate', ZONE_CERT)
    const hosted_zone = route53.HostedZone.fromHostedZoneAttributes(this, 'HostedZone', {
      hostedZoneId: ZONE_ID,
      zoneName: ZONE_NAME,
    })

    const domain = apiGatewayInstance.addDomainName('ApiDomain', { certificate: cert, domainName: domain_name })

    new route53.ARecord(
      this, 'ApiDomain', {
      recordName: subdomain,
      zone: hosted_zone,
      target: route53.RecordTarget.fromAlias( new route53Targets.ApiGatewayDomain(domain))
    });
    return url;
  }
}

module.exports = { ServerlessDemoStack }
