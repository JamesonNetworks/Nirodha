# Nirodha 

[![Build Status](https://secure.travis-ci.org/JamesonNetworks/Nirodha.png)](http://travis-ci.org/JamesonNetworks/Nirodha)[![Coverage Status](https://coveralls.io/repos/JamesonNetworks/Nirodha/badge.png?branch=github)](https://coveralls.io/r/JamesonNetworks/Nirodha?branch=github)[![Dependency Status](https://david-dm.org/JamesonNetworks/Nirodha.svg?theme=shields.io)](https://david-dm.org/JamesonNetworks/Nirodha)[![devDependency Status](https://david-dm.org/alanshaw/david/dev-status.svg?theme=shields.io)](https://david-dm.org/JamesonNetworks/Nirodha#info=devDependencies)

Nirodha (Pali, Sanskrit; Tibetan 'gog pa) — literally refers to the absence or extinction of a given entity. As the 
third of the four noble truths, it refers specifically to the cessation of dukkha (suffering) and its causes; it is 
commonly used as a synonym for nirvana. (from Wikipedia)

A node.js website builder which compiles and minifies sets of included libraries for quickly building websites and
eliminates the pain of keeping track of javascript and css libraries.

Nirodha is a simple command line application which I've developed to facilitate the quick creation and deployment
of websites. The main goal of this project is to simplify javascript library management and css inclusion for 
developing websites quickly.

# Installing:

Clone the repository and run npm install.

# Quick Examples:

### After cloning

There are two steps that need to be taken after installing Nirodha. Copy the settings_template.json file into a settings.json file and set the path to nirodha to the correct path which you have downloaded it to. 

Then add the nirodha directory into your local path so that you can execute the nirodha file from anywhere. Now you can execute the following examples.

### Creating a new project

```shell
nirodha -c project_name
```
### Creating a new view from inside a project

From inside of a project directory:
```shell
nirodha -c view second_view
```
Creates a new view inside the project called second_view.html

### Serving the project assets

From inside a project directory:
```shell
nirodha -s
```
Starts a web server that will serve all of the libraries from the lib directory in the nirodha root, as well as
serving the assets that are in the custom directory of the project.

### Deploying a project

From inside the project directory:
```shell
nirodha -d index
```
Compiles the index view for deployment. This will take all of the referenced js and css files, put them into one
consolidated file, and then minify those assets.

You can also run 
```shell
nirodha -d
```
by itself, this will deploy all of the views in the directory.

### 'Watching' a project

From inside the project directory:
```shell
nirodha -w
```
This will look for changes to the file system and run a deploy when any of the project files change. This is useful for embedding nirodha projects into other projects and serving the files without constantly redeploying from the commandline.

# Purpose

I created Nirodha to be a simple website generator and compiler to eliminate some of the pain in developing client
side javascript and minifying and deploying the libraries. I didn't want to use source maps, but I did want compiled
minified js and css on my web server. Using Nirodha, I can manage all of my libraries in one place, make quick 
references to them in the html view, and deploy all of those files with one command.

# How it works

Nirodha projects will pull js and css files from both the libs folder from the Nirodha libs directory as well as 
from the custom folder inside each of the projects. By putting all of your js and css files in one of these two
places (based on whether its a shared libary or not), you can add a reference to them in the json file that describes
the view. When the view is served via nirodha, those includes will be injected into the html files for you. When
you have finished developing on your uncompressed source files, run the niroddha -d $view command to compile the view
into an html file that references your now minified assets. The structure of the json file should look like the 
included example (see the example folder for details). 

# License

This software is licensed under the MIT license:
The MIT License (MIT)

Copyright (c) 2013-2014, Brent Jameson

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
