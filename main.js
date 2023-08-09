import Graph, { DirectedGraph } from 'graphology';
import { Sigma } from 'sigma';
import circular from 'graphology-layout/circular';
import getNodeProgramImage from "sigma/rendering/webgl/programs/node.image";
/* import various methods from methods.js */
import { buildGraph, getNotVisitedPaths, testFunction, parseJSON, createPathJSON, getNotVisitedNodes, displayUnvisitedNodes } from './methods.js';
import { displayPath } from './methods.js';
import { masterJSON } from './helpers.js';

import FA2Layout from "graphology-layout-forceatlas2/worker";
import forceAtlas2 from "graphology-layout-forceatlas2";

import { hiltonChildNoHotel } from './old-run-data/hilton-child-nohotelsearch.js';
import { hiltonChildNoSignIn } from './old-run-data/hilton-child-nosignin.js';
import { hiltonMasterGraph } from './old-run-data/hilton-master-graph.js';
import { hiltonMasterGroup } from './old-run-data/hilton-master-group.js'
import { notVisited } from './old-src/notVisited.js';
import { unvisitedNodeSearch } from './old-run-data/unvisited-node-search.js';
import { unvisitedNodeSignIn } from './old-run-data/unvisited-nodes-signin.js';
import { masterSearchGroup } from './old-run-data/master-search-node-group-hilton.js';
import { hiltonSearchGraph } from './old-run-data/search-mastergraph-hilton.js';
import { unvisitedTest } from './old-run-data/unvisited-test.js';
import { checkoutChildNodeGroup } from './old-run-data/checkout-nodegroup-child.js';
import { hotelSearchGraph } from './run-data/hotel-search-master-graph.js';
import { hotelSearchNodeGroup } from './run-data/hotel-search-master-nodegroup.js';
import { hotelNoSignInChild } from './run-data/hotel-search-nosignin-child.js';
import { unvisitedNoSignIn } from './run-data/unvisitedNoSignIn.js';
import { hotelSignInChild } from './run-data/hotel-search-signin-child.js';
import { unvisitedSignIn } from './run-data/unvisitedSignIn.js';




var allowedDiff = 0.005;

/* 
* Function to run when master file is uploaded. Function saves the master file and 
* file name to local storage as well as processes the file to build master graph and node groups
*/
function masterFileSelect(evt) {
    var nodeArr=[];
    
    localStorage.clear();

    // Read file
    var file = evt.target.files[0];
    var reader = new FileReader();
    reader.onload = async function(e) {
        // Save the file name
        localStorage.setItem("masterFileName", file.name);
        
        // Build master graph as well as master node groups and save it
        let masterGraph= await buildGraph(e.target.result, nodeArr);
        localStorage.setItem("masterGraph", JSON.stringify(masterGraph.export()));
        localStorage.setItem("masterNodeGroup", JSON.stringify(nodeArr))
        console.log(nodeArr)
        console.log(masterGraph.export())
        // Save the master itself to retainer function
        masterJSON.setValue(e.target.result);
                
        // display the currently uploaded file on the page
        document.getElementById('master-display').textContent = file.name;
    };
    reader.readAsText(file);   
}


/* 
* Function to run when child files are uploaded. Function saves the child file contents
* the file names to local storage as well as creates child node groups
*/
function childFileSelect(evt) {    

    // Read file
    var fileInput = evt.target;
    var files = fileInput.files;

    // array to contains names of all child files
    var childFilesNames=[];
    
    // array containing parsed json content (node name + image) + temp array
    let childNodeGroup=[];
    
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
            await parseJSON(content, childNodeGroup);
        }
    }

    // run functions and only process data after files have been read
    processFiles().then(function() {
        // store file names and file contents in local storage
        localStorage.setItem("childFilesNames", JSON.stringify(childFilesNames))
        localStorage.setItem("childNodeGroup", JSON.stringify(childNodeGroup));
        console.log(childNodeGroup)
        // display the currently uploaded files to the page
        document.getElementById('child-display').textContent = childFilesNames;

    }).catch(function(error) {
        console.error('Error processing files: ', error);
    });
}

/* 
* Function to generate master graph given input JSON file
*/
function displayMasterGraph() {    
   
    var masterGraph = Graph.from(JSON.parse(localStorage.getItem("masterGraph")));

    
    // Give nodes (x,y) positions in circular manner
    circular.assign(masterGraph, { scale: 10 });

    const sensibleSettings = forceAtlas2.inferSettings(masterGraph);
    const fa2Layout = new FA2Layout(masterGraph, {
        settings: sensibleSettings,
    });

    fa2Layout.start();

    // change edge sizes
    masterGraph.edges().forEach(key => {
        masterGraph.setEdgeAttribute(key, 'size', 3);
    })
    
    // output to page
    const container = document.getElementById('master-graph-display');
    container.innerHTML='';

    let hoveredEdge = null;
    const renderer = new Sigma(masterGraph, container, {
        nodeProgramClasses: {
            image: getNodeProgramImage()
        },
        enableEdgeHoverEvents: "debounce",
        edgeReducer(edge, data) {
            const res = { ...data };
            if (edge === hoveredEdge) res.color = "#cc0000";
            return res;
        },
    });
    
    renderer.on("enterEdge", ({ edge }) => {
        hoveredEdge = edge;
        renderer.refresh();
    });
    renderer.on("leaveEdge", ({ edge }) => {
        hoveredEdge = null;
        renderer.refresh();
    });

    renderer.refresh();


}



/* 
* Function to generate child coverage graph
*/
async function generateCoverageGraph() {
    console.log('calculating')
    const maxDiff = 0.015
    
    
    // other options: masterSearchGroup, hiltonMasterGroup, hotelSearchNodeGroup
    // const masterNodeGroup = hotelSearchNodeGroup
    const masterNodeGroup = JSON.parse(localStorage.getItem('masterNodeGroup'));
    
    // const childNodeGroup = hiltonChildNoHotel;
    // options: childNoHotel, childNoSignIn, checkoutChildNodeGroup, hotelnosigninchild, hotelsigninchild
    const childNodeGroup = JSON.parse(localStorage.getItem("childNodeGroup"))
    // const childNodeGroup = hotelNoSignInChild


    // options: hiltonSearchGraph, hiltonMasterGraph, hotelSearchGraph
    const masterGraph = Graph.from(JSON.parse(localStorage.getItem('masterGraph')));
    // var masterGraph = Graph.from(hotelSearchGraph)    

    // options: unvisitedNodeSignin, UnvisitedNodeSearch, unvisitedTest
    // var notVisitedNodes=unvisitedNoSignIn
    var notVisitedNodes = await getNotVisitedNodes(masterNodeGroup, childNodeGroup, maxDiff);
    // console.log(notVisitedNodes)
    displayUnvisitedNodes(masterGraph, masterNodeGroup, notVisitedNodes)

}


// /* Functions to run on button press */
document.getElementById('generate-master').addEventListener('click', testFunction);
document.getElementById('generate-coverage').addEventListener('click', generateCoverageGraph);
document.getElementById('master-json').addEventListener('change', masterFileSelect);
document.getElementById('child-json').addEventListener('change', childFileSelect);

