const Pitometer = require('@pitometer/pitometer').Pitometer;
const DynatraceSource = require('@pitometer/source-dynatrace').Source;
const ThresholdGrader = require('@pitometer/grader-threshold').Grader;
// future
// const PrometheusSource = require('@pitometer/source-prometheus').Source;

/////////////////////////////////////////////////////////////////////////////
// Grab the arguments
// example: npm start 1556060400 1556061466 ./monspec-sample.json
/////////////////////////////////////////////////////////////////////////////
const args = process.argv;
var START_TIME_IN_SECONDS = args[2]
var END_TIME_IN_SECONDS = args[3]
var PERFSPEC_FILE_PATH = args[4]

// debug output
//console.log('START_TIME_IN_SECONDS = ' + START_TIME_IN_SECONDS);
//console.log('END_TIME_IN_SECONDS = ' + END_TIME_IN_SECONDS);
//console.log('PERFSPEC_FILE_PATH = ' + PERFSPEC_FILE_PATH);

/////////////////////////////////////////////////////////////////////////////
// read  in configuration properties
/////////////////////////////////////////////////////////////////////////////
var obj, dynatraceApiToken, dynatraceBaseUrl;
var configFile = require('./config.json');

obj = JSON.parse(JSON.stringify(configFile));
dynatraceApiToken = obj.dynatraceApiToken;
dynatraceBaseUrl = obj.dynatraceBaseUrl;
// future
//prometheusQueryUrl = obj.prometheusQueryUrl;

// debug output
//console.log('configFile = ' + JSON.stringify(configFile));
//console.log('dynatraceApiToken = ' + dynatraceApiToken);
//console.log('dynatraceBaseUrl = ' + dynatraceBaseUrl);
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
  baseUrl: dynatraceBaseUrl,
  apiToken: dynatraceApiToken,
  // Optional: A logger to be used for debugging API requests
  // log: console.log,
}));

// Register a grader for thresholds that will be used if the grader type
// matches 'Threshold'
pitometer.addGrader('Threshold', new ThresholdGrader());

/////////////////////////////////////////////////////////////////////////////
// Run pitometer
/////////////////////////////////////////////////////////////////////////////
const perfspec = require(PERFSPEC_FILE_PATH);

pitometer.run(perfspec, {
  timeStart: START_TIME_IN_SECONDS,
  timeEnd: END_TIME_IN_SECONDS
})
.then((results) => console.log(JSON.stringify(results)))
.catch((err) => console.error(err));