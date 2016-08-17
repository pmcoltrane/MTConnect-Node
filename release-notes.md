
*2016/08/16*

I am working on migrating this project over to Typescript, and implementing some of the functionality that has been missing for the past 4+ years. This project has not been updated in a long time, so hopefully there will be a significant update in the next few weeks, as soon as I can get the new project at least as feature-complete as the current project was/is.

*2013/01/26*

* Significant restructuring. Project now runs from `run.js`. 
* Functionality that was in `server.js`, `store.js`, and `probe.js` has now been split between the new `agent.js` and `document.js` modules.
* Removed the `/test` folder. I believe a better approach will be to create an `adapter.js` that can connect to the MTConnect reference agent adapters.

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
