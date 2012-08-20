# MTConnect-Node

## Overview

MTConnect-Node is an attempt at a Node.js implementation of an MTConnect Agent. 
This is my first attempt at a Node.js project. 
As such, it is not necessarily good Node.js code. 
In particular, many synchronous calls need to be made asynchronous.

## What Works, What Doesn't

The server will load device settings from a probe.xml file, and then listen on port 8080.
The server will serve an MTConnectDevices document in response to a /probe request.
It will serve an MTConnectStreams document in response to a /current or /sample request.
All other requests will receive an MTConnectErrors document.

All of the XML documents lack proper xmlns namespace attributes.
The /current and /sample requests are work-in-progress and not properly formed. 
Instead, they will return JSON data inside a <Debug> tag.

Parameters are not implemented for any of the requests.
A /probe request will not recognize a device-specific probe such as `http://hostname:port/devicename/probe`.
A /current request will not recognize `at` or `interval` parameters.
A /sample request will not recognize `from`, `count`, or `interval` parameters.

Assets are not implemented at all. 

## Installation

1. Install [Node.js](http://nodejs.org).
2. Obtain the MTConnect-Node repository.
3. (Optional) Modify the included probe.xml file, which was taken from the [MTConnect Institute Agent](http://agent.mtconnect.org).

## Usage

From a command prompt in the repository working directory:
> node server.js

The server will listen on port 8080. From there, data items may be stored in the agent with:

`http://localhost:8080/store?id={dataItemId}&timestamp={timestamp}&value={value}&condition={condition}`

Although the parameters are not yet validated, they should be provided as follows:
* `dataItemId` - the id of the data item.
* `timestamp` - the UTC timestamp in ISO8601 format e.g. 2012-08-19T21:21:00Z.
* `value` - the value of the data item.
* `condition` - (optional) for a CONDITION data item, the condition: one of UNAVAILABLE, NORMAL, WARNING, FAULT.

Other parameters will be ignored. Proper validation will be added in the future.