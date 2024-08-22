#Proxy for using V8 debuggers with Commerce Cloud servers

##Project Overview
With the release of Commerce Cloud's Script-Debugger API, it is now possible to debug Commerce Cloud storefronts using IDEs other than the Studio plugin to Eclipse. This project provides you with a proxy that allows IDEs that are capable of debugging through V8 to communicate via Commerce Cloud's Script Debugging API to Commerce Cloud servers.

The proxy was tested with two different IDEs that both support the V8 debugging standard: **node-inspector** and **Visual Studio Code**. In the following documentation `ni` refers to node-inspector-specific files and commands and `vsc` refers to files and commands used for Visual Studio Code.

>#####Please NOTE!  This software is offered "AS IS" with no promises of reliability, accuracy, or support!  We have found it useful and offer to the Demandware community with the hope that you too will find it helpful and that you'll help us improve the project by fixing bugs and submitting pull requests.

###Background and Technical Overview
To debug Commerce Cloud’s software, your IDE interacts with the Commerce Cloud server through the Commerce Cloud Script API. Currently, you can debug code using a plugin for Eclipse called Studio.  Details of Studio can be found at [UX Studio Download](https://xchange.demandware.com/docs/DOC-1936).

For other IDEs, instead of writing plugins for each IDE uniquely, this repository provides a debugger proxy tool that translates requests and responses between the IDE and the Commerce Cloud Script API. The debugger proxy is a standalone application provided by this repository.

![DebuggerReadme.gif](https://bitbucket.org/repo/78XE7E/images/1787324837-DebuggerReadme.gif)

The IDE and the debugger proxy are located on the developer machine and the Demandware Script API is located on the server. The request and response messages are communicated over HTTPS.



All three systems work on a request-response model. Most of these requests originate from the IDE and use the V8 standard. However, the content in the request may not be understood by the Demandware Script API. The debugger proxy repackages the request data in a format that is understood by the Script API. On receiving the request, the server does its processing and sends a response. The debugger proxy intercepts this response and repackages the data in it for the IDE.

For example, if the IDE needs scope variables and issues a request, the debugger proxy forwards this request to the Commerce Cloud server and receives the response. The debugger proxy repackages this response for the IDE.

There are cases where the request may originate from the Script API. For example, for events that happen on the server such as hitting a breakpoint. In this case, the debugger proxy works by constantly listening for events happening on the Commerce Cloud server.


##Getting Started

1) Download the repository.

2) Run npm install to install the dependencies for this project.

3) Create a `dw.json` and place it in the root of the repository.
This file specifies the following parameters:

* *hostname* – the URL of your Sandbox/website
* *username* – username having debugging privileges
* *password* – plain-text password for the username
* *version* – enter the code version. The default is version1

**dw.json example:**


```
{
    "hostname": "dev11.sitegenesis.dw.demandware.net",
    "username": "admin",
    "password": "mypassword",
    "version": "version1"
}
```


4) Launch the debugger proxy.

Start the debugger proxy before you attach from your IDE. The IDE you used must support the V8 standard.

To start the proxy:

  a) Open a terminal in the root of the debugger repository.

  b) Run the debugger proxy as a Node application using the following command:

```
#!sh
node bin/cli [cwd,environment]
```

* *--cwd* - the full absolute path to your local folder containing the code
* *--environment [ni | vsc]* - the environment used to debug your code. In the current repository, you can choose between node-inspector (ni) or visual studio code (vsc).

*Example:*
```
#!sh

node bin/cli --cwd=/Users/username/repos/sitegenesis_repo/sitegenesis/ --environment=ni
```

*Note:* Proxy is launched on the default Node's debugger port (5858). Before launching proxy, make sure that you do not have that port used by some other process.

###Debugging with **node-inspector**
*Note:* The function call to this._handleInjectorClientBreak.bind(this, obj) in BreakEventHandler.js (under async.waterfall) in the node-inspector source code has been commented out as it interferes with normal working of our software. It seems to serve no important purpose and an issue has been raised on GitHub for the same here. You need to comment it out too.

1) Make sure you changed the environment to `ni` when launching the debugger proxy.

2) Start Node Inspector. In a terminal, type:

```
#!sh

% node-inspector
```


3) Node-inspector gives you a URL to follow.  Open the URL in Google Chrome.

###Debugging with **Visual Studio Code**
1) Make sure you changed the environment to `vsc` in Step 1.

2) Open a new VSC window and open your source code folder in it.

3) Open the code you want to test and add a breakpoint.

4) Go to the debug tab, select Attach, and select Play.

##Developing for the Debugger Proxy
This section is intended for developers who are adding features to this repository.

###A detailed overview of the code structure

The structure of the files needed to add functionality for other debuggers is:

-	`debugger.js` – All requests from the IDE and Commerce Cloud Server Events are processed through this file. The file checks for type of IDE from the configuration file and appropriately directs the flow of the program.

-	`niRequestProcessor`/`vscRequestProcessor`/`RequestProcessor.js` – All receive a response from the Commerce Cloud server,  translate it and send it to the IDE. Requests received in the Debugger.js are directed to one of these files.
While the requestProcessor.js has commands that are common to both of the IDEs, niRequestProcessor and vscRequestProcessor serve requests that are either exclusive to these IDEs or the response expected by the IDEs differ from each other. We expect you to continue this convention of separating common code and code specific to each IDE you work with.


-	`refManager.js` – The IDEs expect a reference table containing variables, scripts, and other information. This file handles the same information.


-	`globData.js` – Required only for Node Inspector. Node Inspector explicitly asks all files to be sent in the initialization step. The globData.js keeps the source code in local variables and does so at the earliest stages of initializations so that the source code request does not time out due to latency.

-      `serverRequest`/`socketHandler`/`socketWriter` – These handle the underlying communication and may not require a lot of modification for expanding the code.

**Note:** The Demandware API does not provide all the details that the IDE expects. However, these details usually have no significant impact and are spoofed in the code to trick your IDE into working*

**Info:** The scriptId and its refNo for a script is different and handled differently. It is a common confusion that these are the same.

###Examining requests and responses between an IDE and the Demandware Script API
This section explains how to compare expected requests and responses between and IDE and Demandware script. It is intended to be used for future enhancement of this project or for contributions by the community.

The `nodeLogger.js` file logs the communication between the IDE and the actual V8 debugging engine. This gives us information about what the IDE requests and what V8 is sending back. This is helpful if you want to enable this proxy to be used with another IDE not currently supported. While V8 debugger API is documented and provides enough commands to debug any Node application, majority of IDEs use V8s debugger flexibility to create their own implementation of standard commands (that supply additional information). In order to detect those proprietary commands and figure out how should Node respond to them, you can use `nodeLogger.js` file to log all of the debugging information for a regular (non-Demandware) Node application.
To use the information from nodeLogger.js:
* Log the data using `validate.js` (a simple hello world) in order to get an understanding of what the IDE expects in the response to each request.
* Write responses in the format seen from previous output (sometimes spoofing data).

*Note: To get a “nicely” formatted output of nodeLogger, wait for the connection to be terminated*

###How to run the nodeLogger/validate for VSC
1) In a terminal window, run
```
#!sh

node nodeLogger.js
```


2) Open a second terminal and run:
```
#!sh

--debug-brk=5857 validate.js
```

3) Open the code you want to debug in VSC and set a breakpoint.


4) Go to the debug tab in VSC, select Attach, and hit Play.


5) Enter the URL for the code to test in your browser.

You see requests and responses being logged in the nodeLogger terminal window

###How to see communication when running Demandware code – VSC
1) Open debugger code folder in VSC

2) Change config file

3) Go to the debug tab in VSC.

4) Select launch mode and hit play.
The Debug Console logs all communication between IDE and the debugger proxy.

5) Open another VSC window, open the source code in it

6) Go to the debug tab in VSC, select Attach, and hit Play.


###How to run the nodeLogger/validate for NI
1) Open a terminal window and run
```
#!sh

node nodeLogger.js
```

2) Open a second terminal window and run:
```
#!sh

node --debug-brk=5857 validate.js
```

3) Open a third terminal window and run:
```
#!sh

node-inspector
```

4.) Open the URL shown in  the result of step 3 in Chrome.

5) The nodeLogger window logs all communication between IDE and the debugger proxy.

###How to see communication when running Demandware code for NI
1) Open the debugging proxy software code in VSC

2) Edit the `launch.json` appropriately

3) Go to debug tab -> select launch mode -> click play

4) The debug console should show the communication once it begins communicating

5) Open a terminal window and run
```
#!sh

 node-inspector
```


6) Go to the URL shown in the result.

*Note:* Since the code of node-inspector is available on GitHub, you can choose to debug this to see the internal working and adapt the translator accordingly. To do this, in step 5, run
```
#!sh

node --debug=5856 <path to node-inspector installation folder>
```
 and then attach an IDE to this port.

*Important*: The function call to `this._handleInjectorClientBreak.bind(this, obj)` in BreakEventHandler.js (under async.waterfall) has been commented in the node-inspector source code out as it interferes with normal working of our software. It seems to serve no important purpose and an issue has been raised on GitHub*