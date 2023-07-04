import { buildGraph, getNotVisitedPaths, displayCoverageGraph, testFunction } from './methods.js';

var currentMasterStr='';
var childListStr=[];
var masterJSONStr='';
var childJSONStr=[];


function masterFileSelect(evt) {
    var file = evt.target.files[0];
    var reader = new FileReader();
    reader.onload = function(e) {
        // Save the file name as well as the file itself to global variables
        currentMasterStr = file.name;
        masterJSONStr = e.target.result;
        document.getElementById('master-display').textContent = currentMasterStr;
    };
    reader.readAsText(file);
   
}

function childFileSelect(evt) {    
    
    var fileInput = evt.target;
    var files = fileInput.files;
    
    for (var i=0; i<files.length; i++) {
        var file = files[i];
        childListStr.push(file.name)
        var reader = new FileReader();
        reader.onload = function(e) {
            childJSONStr.push(e.target.result)
        };
        reader.readAsText(file);
    }
    document.getElementById('child-display').textContent = childListStr;
}

function isValidJSON(str) {
    try {
      JSON.parse(str);
      return true;
    } catch (e) {
      return false;
    }
}

function generateMasterGraph() {    
    // // Check if string is a valid JSON
    // if(!isValidJSON(masterJSONStr))
    //     alert("Invalid JSON");
    
    
    // // Convert string to JSON object
    // var masterJSON = JSON.parse(masterJSONStr);

    // // Use JSON object to build the 
    // buildGraph(masterJSON);

    // run a test function
    testFunction();

}

function generateCoverageGraph() {
    // need the entire graph

    // get all paths that have not been visited
    var notVisitedPaths = getNotVisitedPaths(childJSONStr);
 
    // display coverage graph
    displayCoverageGraph(notVisitedPaths);

    // make new graph with just paths that need to be visited


    // if needed make graph with visited paths as different color from unvisited paths

    // each node should be a screenshot

    // create seperate graphs for each path that has not been traversed yet


    
}


document.getElementById('generate-master').addEventListener('click', generateMasterGraph);
document.getElementById('generate-coverage').addEventListener('click', generateCoverageGraph);

  
document.getElementById('master-json').addEventListener('change', masterFileSelect);

document.getElementById('child-json').addEventListener('change', childFileSelect);

