import Graph, { DirectedGraph } from 'graphology';
import { Sigma } from 'sigma';
import circular from 'graphology-layout/circular';
import getNodeProgramImage from "sigma/rendering/webgl/programs/node.image";
/* import various methods from methods.js */
import { buildGraph, getNotVisitedPaths, testFunction, parseJSON, generateTable, createPathJSON, checkSelfLoops, getNotVisitedNodes, createGraphFromPath } from './methods.js';
import { findImage, masterJSON } from './helpers.js';
import FA2Layout from "graphology-layout-forceatlas2/worker";
import forceAtlas2 from "graphology-layout-forceatlas2";






/* 
* Function to run when master file is uploaded. Function saves the master file and 
* file name to local storage so can be used in other functions
*/
function masterFileSelect(evt) {
    var masterNodes=[];
    var nodeArr=[];
    
    localStorage.clear();

    // Read file
    var file = evt.target.files[0];
    var reader = new FileReader();
    reader.onload = async function(e) {
        // Save the file name as well as the parsed contents of the file (get only the node names and images)
        localStorage.setItem("masterFileName", file.name);
        masterNodes = await parseJSON(e.target.result, nodeArr);

        // Save the master itself to retainer function
        masterJSON.setValue(e.target.result);
        
        // Store the master nodes in local storage as well as node groups
        localStorage.setItem("masterNodes", JSON.stringify(masterNodes));
        localStorage.setItem("masterNodeGroup", JSON.stringify(nodeArr))
        
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
    let childNodeGroup=[];
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
            fileNodes =  await parseJSON(content, childNodeGroup);
            for (var node of fileNodes)
                childNodes.push(node);
        }
    }

    // run functions and only process data after files have been read
    processFiles().then(function() {
        // store file names and file contents in local storage
        localStorage.setItem("childFilesNames", JSON.stringify(childFilesNames))
        localStorage.setItem("childNodes", JSON.stringify(childNodes));
        localStorage.setItem("childNodeGroup", JSON.stringify(childNodeGroup));

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
    if (document.getElementById('master-display').textContent=='') {
            alert('no master file given');
            throw new Error('master file not given');
    }
    
    // Get list of nodes in the master from local storage
    const masterNodes = JSON.parse(localStorage.getItem("masterNodes"));
    // Build graph using list of nodes
    var masterGraph = buildGraph(masterNodes);

    // store the master graph for use later
    localStorage.setItem("masterGraph", JSON.stringify(masterGraph.export()));

    
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
function generateCoverageGraph() {
    // first check for master file
    if (document.getElementById('master-display').textContent=='') {
        alert('no master file given');
        throw new Error('master file not given');
    }

    // check for child files
    if (document.getElementById('child-display').textContent=='') {
        alert('no child file given');
        throw new Error('child file not given');
    } 
    
    // run the master file
    generateMasterGraph();
    // Get array of master nodes from local storage
    const masterNodes = JSON.parse(localStorage.getItem("masterNodes"));
    const masterNodeGroup = JSON.parse(localStorage.getItem("masterNodeGroup"));

    // Get array of childNodes from local storage
    const childNodes = JSON.parse(localStorage.getItem("childNodes"));
    const childNodeGroup = JSON.parse(localStorage.getItem("childNodeGroup"));

    
    // Get master graph from local storage
    var masterGraph = Graph.from(JSON.parse(localStorage.getItem("masterGraph")));
    
    // Get not visited paths
    var notVisitedNodes = getNotVisitedNodes(masterNodeGroup, childNodeGroup);
    var notVisitedPaths = getNotVisitedPaths(masterGraph, notVisitedNodes);
    // displayNodes(notVisitedNodes, notVisitedPaths);
    
    // // build coverage graph to visit arr
    // var coverageGraph = createGraphFromPath(notVisitedPaths, masterNodes);

    // const container = document.getElementById('coverage-graph-display');
    // container.innerHTML='';
    
    // // set layout
    // circular.assign(coverageGraph, { scale: 10 });
    // const sensibleSettings = forceAtlas2.inferSettings(masterGraph);
    // const fa2Layout = new FA2Layout(coverageGraph, {
    //     settings: sensibleSettings,
    // });
    // fa2Layout.start();

    // // change edge sizes
    // masterGraph.edges().forEach(key => {
    //     masterGraph.setEdgeAttribute(key, 'size', 3);
    // })
    
    // // change edge sizes
    // coverageGraph.edges().forEach(key => {
    //     coverageGraph.setEdgeAttribute(key, 'size', 3);
    // })


    // let hoveredEdge = null;
    // const renderer = new Sigma(coverageGraph, container, {
    //     nodeProgramClasses: {
    //         image: getNodeProgramImage()
    //     },
        
    //     enableEdgeClickEvents: true,
    //     enableEdgeWheelEvents: true,
    //     enableEdgeHoverEvents: "debounce",
    //     edgeReducer(edge, data) {
    //         const res = { ...data };
    //         if (edge === hoveredEdge) res.color = "#cc0000";
    //         return res;
    //       },
    // });
        
    // renderer.on("enterEdge", ({ edge }) => {
    //     hoveredEdge = edge;
    //     renderer.refresh();
    // });
    // renderer.on("leaveEdge", ({ edge }) => {
    //     hoveredEdge = null;
    //     renderer.refresh();
    // });

    // renderer.on("clickEdge", ({ edge }) => {
        
    //     displayPaths(notVisitedPaths, coverageGraph.source(edge), coverageGraph.target(edge));
    //     renderer.refresh();
    // });


    // renderer.refresh();

}


/**
 * This function takes and displays all of the paths that include the edge
 */
function displayPaths(notVisitedPaths, source, target) {

    // Get master JSON
    var master = JSON.parse(masterJSON.getValue());
    
    // array containing paths
    var paths=[];
    
    for (var path of notVisitedPaths) {
        for (var i=0; i<path.length; i++) {
            if (path[i]==source && i+1<path.length) {
                if (path[i+1]==target)
                    paths.push(path);
            }
        }
    }

    // display the paths that still need to be taken
    var arrayDisplay = document.getElementById('paths-display');
    arrayDisplay.innerHTML = '';
    arrayDisplay.appendChild(generateTable(master, paths));

}



function displayNodes(notVisitedNodes, notVisitedPaths) {
    const container = document.getElementById('node-display')
    
    for (var i = 0; i < notVisitedNodes.length; i++) {
        
        var button = document.createElement('button');
        button.innerHTML = notVisitedNodes[i];
  
        // Add a click event listener to each button
        button.addEventListener('click', function() {
            displayPathToNode(notVisitedPaths, this.innerHTML)
        });
  
        // Append the button to the container
        container.appendChild(button);
      }
}

/**
 * This function takes end node and display all paths with given end node
 */
function displayPathToNode(notVisitedPaths, end) {

    // Get master JSON
    var master = JSON.parse(masterJSON.getValue());
    
    // array containing paths
    var paths=[];
    
    for (var path of notVisitedPaths) {
        let target = path.length-1;
        if (path[target]==end)
            paths.push(path);
    }

    // display the paths that still need to be taken
    var arrayDisplay = document.getElementById('paths-display');
    arrayDisplay.innerHTML = '';
    arrayDisplay.appendChild(generateTable(master, paths));

    // display create a graph with all of these paths
    const masterNodes = JSON.parse(localStorage.getItem("masterNodes"));
    let graph = createGraphFromPath(paths, masterNodes);

    const container = document.getElementById('coverage-graph-display');
    container.innerHTML='';
    
    // set layout
    circular.assign(graph, { scale: 10 });
    const sensibleSettings = forceAtlas2.inferSettings(graph);
    const fa2Layout = new FA2Layout(graph, {
        settings: sensibleSettings,
    });
    fa2Layout.start();
    
    // change edge sizes
    graph.edges().forEach(key => {
        graph.setEdgeAttribute(key, 'size', 3);
    })

    let hoveredEdge = null;
    const renderer = new Sigma(graph, container, {
        nodeProgramClasses: {
            image: getNodeProgramImage()
        },
        
        enableEdgeClickEvents: true,
        enableEdgeWheelEvents: true,
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

    renderer.on("clickEdge", ({ edge }) => {
        displayPaths(notVisitedPaths, graph.source(edge), graph.target(edge));
        renderer.refresh();
    });
    
    renderer.refresh();
}



/* Functions to run on button press */
document.getElementById('generate-master').addEventListener('click', generateMasterGraph);
document.getElementById('generate-coverage').addEventListener('click', generateCoverageGraph);
document.getElementById('master-json').addEventListener('change', masterFileSelect);
document.getElementById('child-json').addEventListener('change', childFileSelect);

