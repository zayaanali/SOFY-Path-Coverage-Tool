import Graph, { DirectedGraph } from 'graphology';
import { Sigma } from 'sigma';
import circular from 'graphology-layout/circular';
import getNodeProgramImage from "sigma/rendering/webgl/programs/node.image";
/* import various methods from methods.js */
import { buildGraph, getNotVisitedPaths, testFunction, parseJSON } from './methods.js';
import { findImage } from './helpers.js';



/* 
* Function to run when master file is uploaded. Function saves the master file and 
* file name to local storage so can be used in other functions
*/
function masterFileSelect(evt) {
    var masterNodes=[];
    
    localStorage.clear();

    // Read file
    var file = evt.target.files[0];
    var reader = new FileReader();
    reader.onload = function(e) {
        // Save the file name as well as the parsed contents of the file (get only the node names and images)
        localStorage.setItem("masterFileName", file.name);
        masterNodes = parseJSON(e.target.result);
        
        // Store the master nodes in local storage
        localStorage.setItem("masterNodes", JSON.stringify(masterNodes));
        
        // display the currently uploaded file on the page
        document.getElementById('master-display').textContent = file.name;
    };
    reader.readAsText(file);   
}


/* 
* Function to run when child files are uploaded. Function saves the child file contents
* the file names to local storage so can be used in other functions
*/
function childFileSelect(evt) {    

    // Read file
    var fileInput = evt.target;
    var files = fileInput.files;

    // array to contains names of all child files
    var childFilesNames=[];
    
    // array containing parsed json content (node name + image) + temp array
    var childNodes=[];
    var fileNodes=[];
        
    
    // function used to read file content
    async function readFileContent(file) {
        return new Promise (function(resolve, reject) {
            var reader = new FileReader();
            reader.onload = function(e) {
                resolve(e.target.result)
            };
            reader.onerror = function() {
                reject(e.target.error)
            };
            reader.readAsText(file);
        });
    }

    // function used to read multiple files
    async function processFiles() {
        for (var file of files) {
            childFilesNames.push(file.name);
            var content = await readFileContent(file);
            fileNodes = parseJSON(content);
            for (var tuple of fileNodes)
                childNodes.push(tuple);
        }
    }

    // run functions and only process data after files have been read
    processFiles().then(function() {
        // store file names and file contents in local storage
        localStorage.setItem("childFilesNames", JSON.stringify(childFilesNames))
        localStorage.setItem("childNodes", JSON.stringify(childNodes));

        // display the currently uploaded files to the page
        document.getElementById('child-display').textContent = childFilesNames;

    }).catch(function(error) {
        console.error('Error processing files: ', error);
    });
}

/* 
* Function to generate master graph given input JSON file
*/
function generateMasterGraph() {    
    // Get list of nodes in the master from local storage
    const masterNodes = JSON.parse(localStorage.getItem("masterNodes"));
    
    // Build graph using list of nodes
    var masterGraph = buildGraph(masterNodes);

    // store the master graph for use later
    localStorage.setItem("masterGraph", JSON.stringify(masterGraph.export()));

    
    // Give nodes (x,y) positions in circular manner
    circular.assign(masterGraph);

    // change edge sizes
    masterGraph.edges().forEach(key => {
        masterGraph.setEdgeAttribute(key, 'size', 5);
    })
    
    // output to page
    const container = document.getElementById('master-graph-container');
    const renderer = new Sigma(masterGraph, container, {
        nodeProgramClasses: {
          image: getNodeProgramImage()
    }});

}

/* 
* Function to generate child coverage graph
*/
function generateCoverageGraph() {
    
    // Get array of master nodes from local storage
    const masterNodes = JSON.parse(localStorage.getItem("masterNodes"));


    // Get array of childNodes from local storage
    const childNodes = JSON.parse(localStorage.getItem("childNodes"));
    
    // Get master graph from local storage
    var masterGraph = Graph.from(JSON.parse(localStorage.getItem("masterGraph")));
    
    // Get not visited paths
    var notVisitedPaths = getNotVisitedPaths(masterGraph, childNodes);
    
    // Create graph from not visited paths
    var coverageGraph = new Graph({multi: false, allowSelfLoops: true, type: 'directed'});

    console.log(notVisitedPaths)
    // for each path merge each edge
    for (var path of notVisitedPaths) {
        for (var i=0; i<path.length; i++) {
            // if there is a following node in the path
            if (i+1<path.length) {
                // add first node (name and image)
                console.log(findImage(masterNodes, path[i]))
                if (findImage(masterNodes, path[i])!=null)
                    coverageGraph.mergeNode(path[i], { type: "image", image: findImage(masterNodes, path[i]), size: 30 });
                else    
                    coverageGraph.mergeNode(path[i], { size: 30 });

                // add second node (name and image)
                console.log(findImage(childNodes, path[i+1]))
                if (findImage(masterNodes, path[i+1])!=null)
                    coverageGraph.mergeNode(path[i+1], { type: "image", image: findImage(masterNodes, path[i+1]), size: 30 });
                else
                    coverageGraph.mergeNode(path[i+1], { size: 30 });

                // add edge between the two nodes
                coverageGraph.mergeEdge(path[i], path[i+1]);
            } 
        }
    }

    const container = document.getElementById('coverage-graph-container');
    circular.assign(coverageGraph);
    
    // change edge sizes
    coverageGraph.edges().forEach(key => {
        coverageGraph.setEdgeAttribute(key, 'size', 5);
    })


    const renderer = new Sigma(coverageGraph, container, {
        nodeProgramClasses: {
          image: getNodeProgramImage()
    }});

}

/* Functions to run on button press */
document.getElementById('generate-master').addEventListener('click', generateMasterGraph);
document.getElementById('generate-coverage').addEventListener('click', generateCoverageGraph);
document.getElementById('master-json').addEventListener('change', masterFileSelect);
document.getElementById('child-json').addEventListener('change', childFileSelect);

