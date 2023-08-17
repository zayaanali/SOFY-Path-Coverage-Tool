/* Import graph/render libraries used */
import Graph, { DirectedGraph } from 'graphology';
import { Sigma } from 'sigma';
import circular from 'graphology-layout/circular';
import getNodeProgramImage from "sigma/rendering/webgl/programs/node.image";
import FA2Layout from "graphology-layout-forceatlas2/worker";
import forceAtlas2 from "graphology-layout-forceatlas2";



/* import from helper files */
import { parseJSON, getNotVisitedNodes, displayUnvisitedNodes, getNodeGroupRow, makeNodeGroup, makeSubNode, mergeNodeGroups, buildGraph } from './methods.js';
import { masterJSON } from './helpers.js';


// Global variable for amount of pixel difference excepted for nodes to be declared the same
var allowedDiff = 0.005;

/* 
* Function to run when master file is uploaded. Function saves the master file and 
* file name to local storage as well as processes the file to build master node groups
*/
function masterFileSelect(evt) {    
    var masterNodeGroup=[];
    localStorage.clear();

    // Read file
    var file = evt.target.files[0];
    var reader = new FileReader();
    reader.onload = async function(e) {
        
        // Save the file name
        localStorage.setItem("masterFileName", file.name);
    
        // Process input, build master node group and save to local storage
        await parseJSON(e.target.result, masterNodeGroup);
        localStorage.setItem("masterNodeGroup", JSON.stringify(masterNodeGroup))

        // Build master graph
        const masterGraph = 

        // Save the master itself to retainer function
        masterJSON.setValue(e.target.result);
                
        // display the currently uploaded file on the page
        document.getElementById('master-display').textContent = file.name;
    };
    reader.readAsText(file);   
}


/* 
* Function to run when child files are uploaded. Function saves the child file contents
* the file names to local storage as well as creates child node groups. Child node groups are saved to local storage
*/
function childFileSelect(evt) {    

    // Read file
    var fileInput = evt.target;
    var files = fileInput.files;

    // array to contains names of all child files
    var childFilesNames=[];
    
    // array containing child node groups
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
        // display the currently uploaded files to the page
        document.getElementById('child-display').textContent = childFilesNames;

    }).catch(function(error) {
        console.error('Error processing files: ', error);
    });
}

// array maintaining all checked items
var checkedItems=[];

// Boolean, is true when master groups is being displayed, false when child groups are being displayed
var displayingMaster;
/**
 * Function to display master node groups for editing
 */
function displayMasterGroup() {
    // set master as being displayed as well as set checked items to empty array
    displayingMaster=true;
    checkedItems=[];
    
    // Get container for displaying all node images and remove previous content
    const imageContainer = document.getElementById('node-group-display');
    imageContainer.innerHTML='';
    
    // get the master node group from local storage
    const masterNodeGroup = JSON.parse(localStorage.getItem('masterNodeGroup'));

    // For each node group get row of images (node group + subnodes)
    for (let node of masterNodeGroup) {
        // get div with representative and subnodes and display
        imageContainer.appendChild( getNodeGroupRow(node, checkedItems) );
    }
}


/**
 * Function to display child node groups
 */
function displayChildGroup() {
    // set displaying master as false, reset checked items array
    displayingMaster=false;
    checkedItems=[];
    
    // Get image container for displaying node group and remove previously displayed content
    const imageContainer = document.getElementById('node-group-display');
    imageContainer.innerHTML='';
    
    // Get childnodeGroup from local storage
    const childNodeGroup = JSON.parse(localStorage.getItem('childNodeGroup'));


    // For each node group display row of images (child node group + subnodes)
    for (let node of childNodeGroup) {
        // get div with representative and subnodes and display
        imageContainer.appendChild( getNodeGroupRow(node, checkedItems) );
    }
}

/**
 * Function to download node groups on button press
 */

function downloadNodeGroup() {
    // download whichever node group is being viewed
    if (displayingMaster)
        console.log(JSON.parse(localStorage.getItem('masterNodeGroup')))
    else if (!displayingMaster)
        console.log(JSON.parse(localStorage.getItem('childNodeGroup')))
}

/**
 * 
 * function to take master node group input and replace existing node group files (if has already been downloaded)
 */
function storeMasterNodeGroup(evt) {
    // Read file
    var file = evt.target.files[0];
    var reader = new FileReader();
    reader.onload = async function(e) {    
        // save the file to local storage
        localStorage.setItem("masterNodeGroup", JSON.stringify(e.target.result))
    };
    reader.readAsText(file);   
}

/**
 * 
 * function to take child node group input and replace existing node group file (if has already been downloaded)
 */
function storeChildNodeGroup(evt) {
    // Read file
    var file = evt.target.files[0];
    var reader = new FileReader();
    reader.onload = async function(e) {    
        // save the file to local storage
        localStorage.setItem("childNodeGroup", JSON.stringify(e.target.result))
    };
    reader.readAsText(file);   
}


/* 
* Function to display master graph
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
* Function to generate unvisited nodes, as well as find all the paths to unvisited nodes
* calls other functions to display paths/nodes
*/
async function generateUnvisited() {
    
    // set the max diff allowed for to match pixels
    console.log('calculating')
    const maxDiff = 0.015
    
    // get master file
    const master = JSON.parse(masterJSON.getValue());
    
    // other options: masterSearchGroup, hiltonMasterGroup, hotelSearchNodeGroup
    // const masterNodeGroup = hotelSearchNodeGroup
    const masterNodeGroup = JSON.parse(localStorage.getItem('masterNodeGroup'));
    
    // const childNodeGroup = hiltonChildNoHotel;
    // options: childNoHotel, childNoSignIn, checkoutChildNodeGroup, hotelnosigninchild, hotelsigninchild
    const childNodeGroup = JSON.parse(localStorage.getItem("childNodeGroup"))
    // const childNodeGroup = hotelNoSignInChild

    // options: hiltonSearchGraph, hiltonMasterGraph, hotelSearchGraph
    const masterGraph = buildGraph(master, masterNodeGroup)
    console.log(masterGraph)
    // var masterGraph = Graph.from(hotelSearchGraph) 


    // options: unvisitedNodeSignin, UnvisitedNodeSearch, unvisitedTest
    // var notVisitedNodes=unvisitedSignIn
    var notVisitedNodes = await getNotVisitedNodes(masterNodeGroup, childNodeGroup, maxDiff);
    // console.log(notVisitedNodes)
    displayUnvisitedNodes(masterGraph, masterNodeGroup, notVisitedNodes)

}


export { displayMasterGroup, displayChildGroup}


/* Functions to run on button press */
// document.getElementById('generate-master').addEventListener('click', testFunction);
document.getElementById('generate-coverage').addEventListener('click', generateUnvisited);
document.getElementById('master-json').addEventListener('change', masterFileSelect);
document.getElementById('child-json').addEventListener('change', childFileSelect);

document.getElementById('show-master-group').addEventListener('click', displayMasterGroup);
document.getElementById('show-child-group').addEventListener('click', displayChildGroup);

document.getElementById('close-node-processing').addEventListener('click', ()=> document.getElementById('node-group-display').innerHTML='' );

document.getElementById('make-node-group').addEventListener("mouseup", () => {
    makeNodeGroup(checkedItems, { master: displayingMaster}); 
    if (displayingMaster)
        displayMasterGroup();
    else
        displayChildGroup();
});

document.getElementById('make-subnode').addEventListener("mouseup", () => { 
    makeSubNode(checkedItems, { master: displayingMaster});  
    if (displayingMaster)
        displayMasterGroup();
    else    
        displayChildGroup();
});

document.getElementById('merge-node-groups').addEventListener("mouseup", () => { 
    mergeNodeGroups(checkedItems, { master: displayingMaster}); 
    if (displayingMaster)
        displayMasterGroup();
    else
        displayChildGroup();
});

document.getElementById('download-node-group').addEventListener('mouseup', downloadNodeGroup);

document.getElementById('master-node-group').addEventListener('change', storeMasterNodeGroup);
document.getElementById('child-node-group').addEventListener('change', storeChildNodeGroup);

