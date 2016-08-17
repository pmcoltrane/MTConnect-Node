# MTConnect-Node

An implementation of an MTConnect agent on NodeJS

## What's New

This project has been migrated over to Typescript, and may now be built in the Visual Studio Code editor with Ctrl+Shift+B.
XPath queries partly work. No error returned for invalid XPath, and all tags must be prefixed with an 'm:' namespace.
DataItem update is now handled through POST, using a method similar to the `cppagent`.

All previous readme entries have been moved to `release-notes.md`.

## Known issues

Assets are not implemented at all.
Interval parameters are not supported.
The agent will not return an error document for several very basic error conditions.
All of the XML documents lack proper xmlns namespace attributes.
Test cases are not yet created.

## Installation

1. Install [Node.js](http://nodejs.org).
2. Obtain the MTConnect-Node repository.
3. (Optional) Modify the included probe.xml file, which was taken from the [MTConnect Institute Agent](http://agent.mtconnect.org).

## Usage

### Running the Agent

From a command prompt in the repository working directory:
$ npm start

All configuration is handled in `conf/agent.json`, but configuration is minimal at the moment.