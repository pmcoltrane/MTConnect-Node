# MTConnect-Node

## Overview

MTConnect-Node is an attempt at a Node.js implementation of an MTConnect Agent. 
It is currently runnable, with a few notable MTConnect features missing, as noted in a later section.
This is my first attempt at a Node.js project. 
As such, it is not necessarily good Node.js code. 

## What's New

*2012/09/01*

* Minor refactoring. Removed some dead code. Fixed error document handling.
* Streams should now return proper firstSequence, lastSequence, nextSequence values.
* The `current` request now supports `at`, and validates the parameter.
* The `sample` request now validates `from` and `count`, and supports an arbitrarily-chosen maximum count of 500.
* The `store` request now accepts multiple DataItem updates in a single request, and returns an error document on failure. See the Usage section.
* Fixed error in loading devices file. 
* Working on test/two-axis.js as demo two-axis machine for testing. Currently, this provides two axis data items that move sinusoidally.

*2012/08/22*

* The `current` and `sample` resources now return something that looks like a valid MTConnectStreams document.
* The `sample` resource now supports `from` and `count` parameters.
* The server now supports command-line arguments for `port` and `sender`.

## What Works, What Doesn't

The server will load device settings from a probe.xml file, and then listen on port 8080.
The server will serve an MTConnectDevices document in response to a /probe request.
It will serve an MTConnectStreams document in response to a /current or /sample request.
All other requests will receive an MTConnectErrors document.

All of the XML documents lack proper xmlns namespace attributes.

Some parameters are not implemented.
A /probe request will not recognize a device-specific probe such as `http://hostname:port/devicename/probe`.
A /current request will not recognize `path` or `interval` parameters.
A /sample request will not recognize `path` or `interval` parameters.

Assets are not implemented at all. 

Test cases are not yet created.

## Installation

1. Install [Node.js](http://nodejs.org).
2. Obtain the MTConnect-Node repository.
3. (Optional) Modify the included probe.xml file, which was taken from the [MTConnect Institute Agent](http://agent.mtconnect.org).

## Usage

### Running the Agent

From a command prompt in the repository working directory:
$ node server.js [port={port}] [sender={sender}] [devices={devices}]

The optional `port` parameter will be interpreted as the port on which the server should listen.
The optional `sender` parameter will be used as the 'sender' string sent in the document headers. 
The optional `devices` parameter will be interpreted as the name of the file to load for Devices XML data.

The server will listen on port 8080 by default. 

### Sending DataItems to the Agent

Data items may be stored in the agent using the /store resource:
`http://localhost:8080/store?id={dataItemId}&timestamp={timestamp}&value={value}&condition={condition}`

Parameters should be provided as follows:
* `dataItemId` - the id of the data item.
* `timestamp` - the UTC timestamp in ISO8601 format e.g. 2012-08-19T21:21:00Z.
* `value` - the value of the data item.
* `condition` - (optional) for a CONDITION data item, the condition: one of UNAVAILABLE, NORMAL, WARNING, FAULT.

Multiple data items may be updated in a single request by adding a numeric suffix to the parameters, starting with 1, e.g.:
`http://localhost:8080/store?id={dataItemId}&timestamp={timestamp}&value={value}&condition={condition}&id1={dataItemId}&timestamp1={timestamp}&value1={value}&condition1={condition}&...`. However, the URL should not exceed 2000 characters.

Other parameters will be ignored. Parameters are validated to make sure that the dataItemId exist and that the timestamp is a proper date, but no validation is yet performed to verify that the values are valid, or that a condition is being provided for a condition DataItem.