#!/usr/bin/env node
const Pitometer = require('@pitometer/pitometer').Pitometer;
const DynatraceSource = require('@pitometer/source-dynatrace').Source;
const ThresholdGrader = require('@pitometer/grader-threshold').Grader;
// future
// const PrometheusSource = require('@pitometer/source-prometheus').Source;

/////////////////////////////////////////////////////////////////////////////
// Grab the arguments
// example: npm start 1556060400 1556061466 ./samples/perfspec-sample.json
/////////////////////////////////////////////////////////////////////////////
const args = process.argv;
var START_TIME_IN_SECONDS = args[2]
var END_TIME_IN_SECONDS = args[3]
var PERFSPEC_FILE_PATH = args[4]

// debug output
//console.log('START_TIME_IN_SECONDS = ' + START_TIME_IN_SECONDS);
//console.log('END_TIME_IN_SECONDS = ' + END_TIME_IN_SECONDS);
//console.log('PERFSPEC_FILE_PATH = ' + PERFSPEC_FILE_PATH);

// if don't find environment variables, then look to see if they are defined
// in a local .env file

if(!process.env.DYNATRACE_BASEURL && !process.env.DYNATRACE_APITOKEN )
{
  console.log("Reading .env file");
  const dotenv = require('dotenv');
  dotenv.config();
}

/////////////////////////////////////////////////////////////////////////////
// validate required arguments
/////////////////////////////////////////////////////////////////////////////
if(!process.env.DYNATRACE_BASEURL)
{
  console.log("{ result: 'error', message: 'Missing environment variable: DYNATRACE_BASEURL' })");
  return process.exit(1);
}
if(!process.env.DYNATRACE_APITOKEN)
{
  console.log("{ status: 'error', message: 'Missing environment variable: DYNATRACE_APITOKEN' })");
  return process.exit(1);
}
if(!PERFSPEC_FILE_PATH)
{
  console.log("{ status: 'error', message: 'Missing perfSpec. Please check your request body and try again.' })");
  return process.exit(1);
}
if(!START_TIME_IN_SECONDS)
{
  console.log("{ status: 'error', message: 'Missing timeStart. Please check your request body and try again.' })");
  return process.exit(1);
}
if(!END_TIME_IN_SECONDS)
{
  console.log("{ status: 'error', message: 'Missing timeEnd. Please check your request body and try again.' })");
  return process.exit(1);
}
// debug output
//console.log('PERFSPEC_FILE_PATH = ' + PERFSPEC_FILE_PATH);
//console.log('DYNATRACE_BASEURL = ' + process.env.DYNATRACE_BASEURL);
//console.log('DYNATRACE_APITOKEN = ' + process.env.DYNATRACE_APITOKEN);
// future
// console.log('queryUrl = ' + prometheusQueryUrl);

/////////////////////////////////////////////////////////////////////////////
// create a pitometer instance
/////////////////////////////////////////////////////////////////////////////
const pitometer = new Pitometer();

// Future
/*
// Register a Prometheus source 
pitometer.addSource('Prometheus', new PrometheusSource({
  queryUrl: prometheusQueryUrl,
}));
*/

// Register a Dynatrace source
pitometer.addSource('Dynatrace', new DynatraceSource({
  baseUrl: process.env.DYNATRACE_BASEURL,
  apiToken: process.env.DYNATRACE_APITOKEN
  // Optional: A logger to be used for debugging API requests
  // log: console.log,
}));

// Register a grader for thresholds that will be used if the grader type
// matches 'Threshold'
pitometer.addGrader('Threshold', new ThresholdGrader());

/////////////////////////////////////////////////////////////////////////////
// Run pitometer
/////////////////////////////////////////////////////////////////////////////
var fs = require('fs');
try {
  var perfspec_data = fs.readFileSync(PERFSPEC_FILE_PATH, 'utf8')
  var perfspec_obj = JSON.parse(perfspec_data)
} catch (error) {
  console.log("{ status: 'error', message: " + err + " }")
}

var perfspec_obj = JSON.parse(perfspec_data);

pitometer.run(perfspec_obj, {
  timeStart: START_TIME_IN_SECONDS,
  timeEnd: END_TIME_IN_SECONDS
})
.then((results) => console.log(JSON.stringify(results)))
.catch((err) => console.log("{ status: 'error', message: " + err + " }"))
