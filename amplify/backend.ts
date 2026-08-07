import { defineBackend } from "@aws-amplify/backend";
import { Duration } from "aws-cdk-lib";
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";
import { auth } from "./auth/resource";
import { data, searchVideosHandler } from "./data/resource";

const backend = defineBackend({ auth, data, searchVideosHandler });

const { cfnUserPool } = backend.auth.resources.cfnResources;
const { cfnIdentityPool } = backend.auth.resources.cfnResources;

// Cognito username aliases let the same sign-in field accept username or email.
cfnUserPool.usernameAttributes = [];
cfnUserPool.aliasAttributes = ["email"];
cfnUserPool.userPoolName = "innovatube-users";
cfnUserPool.usernameConfiguration = { caseSensitive: false };
// Cognito does not accept Schema in UpdateUserPool. Existing attributes remain
// intact, while the pre-sign-up trigger enforces them for fresh environments.
cfnUserPool.addPropertyDeletionOverride("Schema");
cfnIdentityPool.allowUnauthenticatedIdentities = false;

const observabilityStack = backend.createStack("observability");
const searchLambda = backend.searchVideosHandler.resources.lambda;
const metricPeriod = Duration.minutes(5);

const searchErrorsAlarm = new cloudwatch.Alarm(observabilityStack, "SearchErrorsAlarm", {
  metric: searchLambda.metricErrors({ period: metricPeriod }),
  threshold: 1,
  evaluationPeriods: 1,
  treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
  alarmDescription: "YouTube search Lambda reported one or more errors in five minutes.",
});

const searchThrottlesAlarm = new cloudwatch.Alarm(observabilityStack, "SearchThrottlesAlarm", {
  metric: searchLambda.metricThrottles({ period: metricPeriod }),
  threshold: 1,
  evaluationPeriods: 1,
  treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
  alarmDescription: "YouTube search Lambda was throttled.",
});

const searchLatencyAlarm = new cloudwatch.Alarm(observabilityStack, "SearchLatencyAlarm", {
  metric: searchLambda.metricDuration({ period: metricPeriod, statistic: "p95" }),
  threshold: 12_000,
  evaluationPeriods: 2,
  datapointsToAlarm: 2,
  treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
  alarmDescription: "YouTube search Lambda p95 latency remained above 12 seconds.",
});

const dashboard = new cloudwatch.Dashboard(observabilityStack, "OperationsDashboard");
dashboard.addWidgets(
  new cloudwatch.AlarmStatusWidget({
    title: "InnovaTube alarms",
    alarms: [searchErrorsAlarm, searchThrottlesAlarm, searchLatencyAlarm],
    width: 24,
  }),
  new cloudwatch.GraphWidget({
    title: "YouTube search traffic and errors",
    left: [
      searchLambda.metricInvocations({ period: metricPeriod }),
      searchLambda.metricErrors({ period: metricPeriod }),
      searchLambda.metricThrottles({ period: metricPeriod }),
    ],
    width: 12,
  }),
  new cloudwatch.GraphWidget({
    title: "YouTube search latency",
    left: [searchLambda.metricDuration({ period: metricPeriod, statistic: "p95" })],
    width: 12,
  }),
);
