# Overview

Command line Node.js script that provides the processing logic of a passed in "perf spec" and start/end time frame. This service can be used as a software quality gate within continuous integration software pipelines. 

The "perf spec" processing logic uses the [Keptn Pitometer NodeJS modules](https://github.com/keptn/pitometer). This web application uses these specific modules.
* [pitometer](https://github.com/pitometer/pitometer) - Core module that acts as monspec processor to the request
* [source-dynatrace](https://github.com/pitometer/source-dynatrace) - interfaces to Dynatrace API to collect metrics
* [grader-thresholds](https://github.com/pitometer/grader-thresholds) - evaluates the threasholds and scores the request

# Requirements

1. Have an application to test that is configured with the Dynatrace OneAgent for monitoring. [See these insructions](https://www.dynatrace.com/trial/) for creating a Dynatrace Free Trial.
1. Have a Dynatrace API token that Pitometer requires. [See these instructions for how to generate the Dynatrace API ](https://www.dynatrace.com/support/help/extend-dynatrace/dynatrace-api/basics/dynatrace-api-authentication/)
1. [install node](https://nodejs.org/en/download/package-manager/)

# CLI configuration

* option 1: set OS variables
    ```
    export DYNATRACE_BASEURL=<dynatrace tenant url, example: https://abc.live.dynatrace.com>
    export DYNATRACE_APITOKEN=<dynatrace API token>
    ```

# CLI usage
1. Start and Stop Times
    ```
    node pitometer.js -p [perfspec file] -s [Start Time] -e [End Time]
    ```

2. Relative Time
    ```
    node pitometer.js -p [perfspec file] -r [Relative Time]
    ```

* Arguments
  * perfSpec File - a file in JSON format containing the performance signature. Example: ```./samples/perfspec-sample.json```
  * start time - start time in [UTC unix seconds format](https://cloud.google.com/dataprep/docs/html/UNIXTIME-Function_57344718) used for the query
  * end time - end time in [UTC unix seconds format](https://cloud.google.com/dataprep/docs/html/UNIXTIME-Function_57344718) used for the query
  * relativeTime - possible values: ```10mins,15mins,2hours,30mins,3days,5mins,6hours,day,hour,min,month,week```

# CLI usage in a script

Below is an example UNIX shell script to call the CLI and parse the output using [jq json query utility](https://stedolan.github.io/jq/)

```
#!/bin/bash
CURRENT_TIME=$(printf "%(%s)T")
START_TIME=$(printf "$(( $(printf "%(%s)T") - 360 * 60 ))")
node pitometer.js -s $START_TIME -e $CURRENT_TIME -p ./samples/perfspec-springmusic.json | tail -n +5 > pitometer_output.json
jq '.' pitometer_output.json
result="$(jq -r '.result' pitometer_output.json)"
if [ "$result" = "fail" ]; then
  echo "This build has failed based on pitometer evaluation"
  exit 1
else
  echo "This build has passed pitometer evaluation"
  exit 0
fi
```
# CLI usage via docker

Below is an example utilizing the pitometer-cli from Docker hub which has been packaged as a standalone binary. Best practices dictate that perfspec files should be stored alongside application code in repo so this command will fetch the perfspec file from source control:

```
docker pull mvilliger/pitometer-cli

docker run --name pitometer-cli --rm -it mvilliger/pitometer-cli /bin/bash -c \
'export DYNATRACE_BASEURL="https://<insert-your-dynatrace-url>" && \
export DYNATRACE_APITOKEN=<insert-your-apitoken> && \
export CURRENT_TIME=$(printf "%(%s)T") && \
export START_TIME=$(printf "$(( $(printf "%(%s)T") - 60 * 60 ))") && \
wget -q -o perfspec.json https://<link to perfspec.json> && \
pitometer-cli -s $START_TIME -e $CURRENT_TIME -p $PWD/perfspec.json | jq .'
```

## perfSpec File format

See the [Pitometer documentation] https://keptn.github.io/pitometer/) for the latest information, but below is an overview.
* spec_version - string property with pitometer version.  Use 1.0
* indicator - array of each indicator objects
* objectives - object with pass and warning properties
* <details><summary>Body Structure Format</summary>

    ```
    {
        "spec_version": "1.0",
        "indicators": [ { <Indicator object 1> } ],
        "objectives": {
            "pass": 100,
            "warning": 50
        }
    }
    ```

    </details>

* [Complete Body example](samples/perfspec-sample.json)


## Response of valid lookup

A valid response will return an HTTP 200 with a JSON body containing these properties:
* totalScore - numeric property with the sum of the passsing indicator metricScores
* objectives - object with pass and warning properties passed in from the request
* indicatorResults - array of each indicator and their specific scores and values
* result - string property with value of 'pass', 'warn' or 'warning'

<details><summary>
Example response message
</summary>

```
{
    "totalScore": 60,
    "objectives": {
        "pass": 100,
        "warning": 50
    },
    "indicatorResults": [
        {
            "id": "P90_ResponseTime_Frontend",
            "violations": [
                {
                    "value": 5824401.800000001,
                    "key": "SERVICE-BAB018A09DA36B75",
                    "breach": "upper_critical",
                    "threshold": 4000000
                }
            ],
            "score": 20
        },
        {
            "id": "AVG_ResponseTime_Frontend",
            "violations": [
                {
                    "value": 2476689.888888889,
                    "key": "SERVICE-BAB018A09DA36B75",
                    "breach": "upper_warning",
                    "threshold": 2000000
                }
            ],
            "score": 40
        }
    ],
    "result": "warning"
}
```

</details>

## Example response of invalid arguments

A valid response will return an HTTP 400 with a JSON body containing these properties:
* result - string property with value of 'error'
* message - string property with error messsage

<details><summary>
Example response message
</summary>

```
{
  "result": "error",
  "message": "Missing timeStart. Please check your request body and try again."
}
```
</details>

## Example response of processing error

A valid response will return an HTTP 500 with a JSON body containing these properties:
* result - string property with value of 'error'
* message - string property with error messsage

<details><summary>
Example response message
</summary>

```
{
  "result": "error",
  "message": "The given timeseries id is not configured."
}
```
</details>

# Local development

1. You must have [node](https://nodejs.org/en/download/) installed locally.
1. Once you clone the repo, you need to run ```npm install``` to download the required modules
1. Confugure these environment variables
  * option 1: set environment variables in the shell
    ```
    export DYNATRACE_BASEURL=<dynatrace tenant url, example: https://abc.live.dynatrace.com>
    export DYNATRACE_APITOKEN=<dynatrace API token>
    ```
  * option 2: make a ```.env``` file in the root project folder wit these values
    ```
    DYNATRACE_BASEURL=<dynatrace tenant url, example: https://abc.live.dynatrace.com> 
    DYNATRACE_APITOKEN=<dynatrace API token>
    ```
