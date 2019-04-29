var moment = require('moment');
const args = require('yargs')
  .usage('Usage:\n\n1) Start and Stop Times\n    $0 -p [perfspec file] -s [Start Time] -e [End Time] \n\n2) Relative Time\n    $0 -p [perfspec file] -r [Relative Time]\n\n    Possible values for the relativeTime\n    10mins,15mins,2hours,30mins,3days,5mins,6hours,day,hour,min,month,week')
  .require(['p'])
  .argv;
const Pitometer = require('@pitometer/pitometer').Pitometer;
const DynatraceSource = require('@pitometer/source-dynatrace').Source;
const ThresholdGrader = require('@pitometer/grader-threshold').Grader;

// future
// const PrometheusSource = require('@pitometer/source-prometheus').Source;

/////////////////////////////////////////////////////////////////////////////
// Grab the arguments
// example: node pitometer.js -p ./samples/perfspec-sample.json -s 1556060400 -e 1556061466 
// example: node pitometer.js -p ./samples/perfspec-sample.json -r 3days 
/////////////////////////////////////////////////////////////////////////////

var START_TIME_IN_SECONDS = args.s
var END_TIME_IN_SECONDS = args.e
var RELATIVE_TIME = args.r
var PERFSPEC_FILE_PATH = args.p

// if pass in relative time, then convert it into start/stop time
if (RELATIVE_TIME) {
  setStartTime(RELATIVE_TIME);
}

/*
// debug output
console.log('START_TIME_IN_SECONDS = ' + START_TIME_IN_SECONDS);
console.log('END_TIME_IN_SECONDS = ' + END_TIME_IN_SECONDS);
console.log('PERFSPEC_FILE_PATH = ' + PERFSPEC_FILE_PATH);
console.log('RELATIVE_TIME = ' + RELATIVE_TIME);
*/
// if don't find environment variables, then look to see if they are defined
// in a local .env file

if(!process.env.DYNATRACE_BASEURL && !process.env.DYNATRACE_APITOKEN )
{
  console.log("Reading local .env file");
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
if(!START_TIME_IN_SECONDS && !END_TIME_IN_SECONDS && !RELATIVE_TIME)
{
  console.log("{ status: 'error', message: 'Missing either start & end timestamp or relativeTime. Please check your request body and try again.' })");
  return process.exit(1);
}
if(START_TIME_IN_SECONDS && !END_TIME_IN_SECONDS)
{
  console.log("{ status: 'error', message: 'Missing start time. Please check your request body and try again.' })");
  return process.exit(1);
}
if(!START_TIME_IN_SECONDS && END_TIME_IN_SECONDS)
{
  console.log("{ status: 'error', message: 'Missing end time. Please check your request body and try again.' })");
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
  console.log("{ status: 'error', message: " + error + " }")
}

pitometer.run(perfspec_obj, {
  timeStart: START_TIME_IN_SECONDS,
  timeEnd: END_TIME_IN_SECONDS
})
.then((results) => console.log(JSON.stringify(results)))
.catch((err) => console.log("{ status: 'error', message: " + err + " }"))

function setStartTime(relativeTime) {
  // get current time
  endTime = moment().format();
  // convert to unix utc
  END_TIME_IN_SECONDS = moment(endTime).unix();
  // get the start time using the relativeTime offset from the end time
  switch(relativeTime) {
    case '10mins':
      START_TIME_IN_SECONDS = moment(endTime).subtract(10,'minute').unix();
      break;
    case '15mins':
      START_TIME_IN_SECONDS = moment(endTime).subtract(15,'minute').unix();
      break;
    case '2hours':
      START_TIME_IN_SECONDS = moment(endTime).subtract(2,'hour').unix();
      break;
    case '30mins':
      START_TIME_IN_SECONDS = moment(endTime).subtract(30,'minute').unix();
      break;
    case '3days':
      START_TIME_IN_SECONDS = moment(endTime).subtract(3,'day').unix();
      break;
    case '5mins':
      START_TIME_IN_SECONDS = moment(endTime).subtract(5,'minute').unix();
      break;
    case '6hours':
      START_TIME_IN_SECONDS = moment(endTime).subtract(6,'day').unix();
      break;
    case 'day':
      START_TIME_IN_SECONDS = moment(endTime).subtract(1,'day').unix();
      break;
    case 'hour':
      START_TIME_IN_SECONDS = moment(endTime).subtract(1,'hour').unix();
      break;
    case 'min':
      START_TIME_IN_SECONDS = moment(endTime).subtract(1,'minute').unix();
      break;
    case 'month':
      START_TIME_IN_SECONDS = moment(endTime).subtract(1,'month').unix();
      break;
    case 'week':
      START_TIME_IN_SECONDS = moment(endTime).subtract(1,'week').unix();
      break;
    default:
      console.log('Invalid relativeTime value, ' + relativeTime);
      process.exit();
  }
  return;
}