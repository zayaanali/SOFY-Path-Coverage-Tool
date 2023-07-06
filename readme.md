# SOFY Path Coverage Tool

## Introduction
Tool for finding and visualizing missing paths given a master of all possible paths in an application as well as child files containing individual paths that can be taken



## Installation
Clone the project in your desired folder: <br>
``` 
git clone https://github.com/zayaanali/SOFY-Path-Coverage-Tool.git
```
navigate to the folder and install all required packages <br>
```
npm install
```


## Usage
Once all required packages have been installed, in the cloned folder run: <br>
```
npm run dev
```

Enter the given URL in your browser of choice (Chrome recommended)  <br>

### Generate master graph
Upload master file, and click generate graph

### Generate Coverage Graph
Upload master file, upload child files. Press generate master graph then press generate coverage graph 

## Provided Files
A number of files have been provided within the src folder for testing purposes. Here is a quick rundown of the important ones

<b>hilton-test2-master.json:<b> master for all of the following child files <br>
<b>hilton-test3-child:<b> Chat + make a reservation <br>
<b>hilton-test4-child:<b> sign in, join, booking <br>
<b>hilton-test5-child:<b> sign in, join, offers, stays, booking, reservation <br>
<b>hilton-test6-child:<b> no actions <br>
<b>hilton-test7-child:<b> try to have mostly full coverage but not all paths <br>


