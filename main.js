/* Import graph/render libraries used */
import Graph, { DirectedGraph } from 'graphology';
import { Sigma } from 'sigma';
import circular from 'graphology-layout/circular';
import getNodeProgramImage from "sigma/rendering/webgl/programs/node.image";
import FA2Layout from "graphology-layout-forceatlas2/worker";
import forceAtlas2 from "graphology-layout-forceatlas2";



/* import from helper files */
import { parseJSON, getNotVisitedNodes, displayUnvisitedNodes, getNodeGroupRow, makeNodeGroup, makeSubNode, mergeNodeGroups, buildGraph, parseTemplate } from './methods.js';
import { masterJSON, getNodeIndex } from './helpers.js';
import { doesNodeIdExist } from './tools.js';

/**
 * Function takes in master template and saves the important information from the file to be used later (while processing the master file)
 * Files MUST be in the same order as requested in the master, else the order of the array will be incorrect
 * 
 * @param {*} evt 
 */
function masterTemplateFileSelect(evt) {
    // Read file
    let fileInput = evt.target;
    let files = fileInput.files;

    // array to contains names of template files
    let templateFileNames=[];
    
    // array to contain templates
    let templateArr=[];
    
    // function used to read file content
    async function readFileContent(file) {
        return new Promise (function(resolve, reject) {
            let reader = new FileReader();
            reader.onload = function(e) {
                resolve(e.target.result)
            };
            reader.onerror = function() {
                reject(e.target.error)
            };
            reader.readAsText(file);
        });
    }
    
    // parse template file content and add to templateArr
    async function processFiles() {
        for (let file of files) {
            templateFileNames.push(file.name);
            let content = await readFileContent(file);
            templateArr.push(parseTemplate(content));
        }
    }

    // run functions and only process data after files have been read
    processFiles().then(function() {
        // store template array in local storage
        localStorage.setItem("masterTemplateArray", JSON.stringify(templateArr));
        // display the currently uploaded files to the page
        document.getElementById('master-template-display').textContent = templateFileNames;
    }).catch(function(error) {
        console.error('Error processing files: ', error);
    });
}

/**
 * Function takes in child template files and processes them to be used later (while processing the child files)
 * Files MUST be in the same order as requested in the child, else the order of the array will be incorrect
 * @param {*} evt 
 */
function childTemplateFileSelect(evt) {
    // Read file
    let fileInput = evt.target;
    let files = fileInput.files;

    // array to contains names of all child template files
    let templateFileNames=[];
    
    // array containing array of templates
    let templateArr=[];
    
    // function used to read file content
    async function readFileContent(file) {
        return new Promise (function(resolve, reject) {
            let reader = new FileReader();
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
        for (let file of files) {
            templateFileNames.push(file.name);
            let content = await readFileContent(file);
            templateArr.push(parseTemplate(content));
        }
    }

    // run functions and only process data after files have been read
    processFiles().then(function() {
        // store file names and file contents in local storage
        localStorage.setItem("childTemplateArray", JSON.stringify(templateArr));
        // display the currently uploaded files to the page
        document.getElementById('child-template-display').textContent = templateFileNames;
    }).catch(function(error) {
        console.error('Error processing files: ', error);
    });
}

/**
 * Function to run when master file is uploaded. Function saves the master file and 
 * file name to local storage as well as processes the file to build master node groups
 * @param {*} evt 
 */
function masterFileSelect(evt) {    
    // 
    let masterNodeGroup=[];
    
    // Read file
    let file = evt.target.files[0];
    let reader = new FileReader();
    reader.onload = async function(e) {    
        // Process input, build master node group and save to local storage
        await parseJSON(e.target.result, masterNodeGroup);
        localStorage.setItem("masterNodeGroup", JSON.stringify(masterNodeGroup))
        
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
    let fileInput = evt.target;
    let files = fileInput.files;

    // array to contains names of all child files
    let childFilesNames=[];
    
    // array containing child node groups
    let childNodeGroup=[];
    
    // function used to read file content
    async function readFileContent(file) {
        return new Promise (function(resolve, reject) {
            let reader = new FileReader();
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
        for (let file of files) {
            childFilesNames.push(file.name);
            const content = await readFileContent(file);
            await parseJSON(content, childNodeGroup, { child: true });
        }
    }

    // run functions and only process data after files have been read
    processFiles().then(function() {
        // store file names and file contents in local storage
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
 * Function to display master node groups and the corresponding nodes that it has matched to. Gives the user the
 * ability to move nodes in node groups as well as create new node groups
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
        // get div with displaying representative node as well as the subNodes, and display
        imageContainer.appendChild(getNodeGroupRow(node, checkedItems));
    }
}


/**
 * Function to display child node groups and the corresponding nodes that it has matched to. Gives the user the
 * ability to move nodes in node groups as well as create new node groups
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
        // get div with representative node + subnodes and display
        imageContainer.appendChild(getNodeGroupRow(node, checkedItems));
    }
}

/**
 * Downloads node group for future use so don't have to process files every time. 
 * Downloads whichever node group is currently being viewed
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
    const file = evt.target.files[0];
    const reader = new FileReader();
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
    const file = evt.target.files[0];
    const reader = new FileReader();
    reader.onload = async function(e) {    
        // save the file to local storage
        localStorage.setItem("childNodeGroup", JSON.stringify(e.target.result))
    };
    reader.readAsText(file);   
}


/* 
* 
*/

/**
 * Function to visualize master graph. Unvisited nodes must be generated before this function is called
 * since master graph only generated when unvisited nodes are generated. Edge deleted when clicked on
 */
function displayMasterGraph() {    

    // Get masterGraph from local storage
    let masterGraph = Graph.from(JSON.parse(localStorage.getItem("masterGraph")));
    
    // Give nodes (x,y) positions in circular manner
    circular.assign(masterGraph, { scale: 10 });

    // FA2 layout for graph positions
    const sensibleSettings = forceAtlas2.inferSettings(masterGraph);
    const fa2Layout = new FA2Layout(masterGraph, {
        settings: sensibleSettings,
    });
    fa2Layout.start();

    // change edge sizes
    masterGraph.edges().forEach(key => {
        masterGraph.setEdgeAttribute(key, 'size', 3);
    })
    
    // Output container
    const container = document.getElementById('master-graph-display');
    container.innerHTML='';  

    // renderer for graph
    let hoveredEdge = null;
    const renderer = new Sigma(masterGraph, container, {
        nodeProgramClasses: {
            image: getNodeProgramImage()
        },
        enableEdgeHoverEvents: "debounce",
        enableEdgeClickEvents: true,
        edgeReducer(edge, data) {
            const res = { ...data };
            if (edge === hoveredEdge) res.color = "#cc0000";
            return res;
        },
        allowInvalidContainer: true,
    });
    // drop edge when edge is clicked
    renderer.on("clickEdge", ({ edge }) => {
        console.log("drop edge: ", edge)
        masterGraph.dropEdge(edge);
        localStorage.setItem("masterGraph", JSON.stringify(masterGraph.export()));
        renderer.refresh();
    });
    // highlight edge when hovered over
    renderer.on("enterEdge", ({ edge }) => {
        hoveredEdge = edge;
        renderer.refresh();
    });
    // remove highlight when leaving edge
    renderer.on("leaveEdge", ({ edge }) => {
        hoveredEdge = null;
        renderer.refresh();
    });    

    renderer.refresh();
}


/**
 * Function to generate unvisited nodes, as well as find all the paths to unvisited nodes,
 * calls other functions to display paths/nodes
 */
const nodeMatchMap = new Map();
async function generateUnvisited() {
    // set the max diff (max deviation allowed for two screen to be found as identical)
    console.log('calculating')
    const maxDiff = 0.015
    
    // get master file, master node group, child node groups from local storage
    const master = JSON.parse(masterJSON.getValue());
    const masterNodeGroup = JSON.parse(localStorage.getItem('masterNodeGroup'));
    const childNodeGroup = JSON.parse(localStorage.getItem("childNodeGroup"))

    // build master graph and save to local storage
    const masterGraph = buildGraph(master, masterNodeGroup);
    localStorage.setItem('masterGraph', JSON.stringify(masterGraph));

    // calculate not visited nodes and save to local storage
    const notVisitedNodes = await getNotVisitedNodes(masterNodeGroup, childNodeGroup, maxDiff, nodeMatchMap);
    localStorage.setItem('notVisitedNodes', JSON.stringify(notVisitedNodes))

    displayUnvisitedNodes();
}


/**
 * This function display all master node group and which nodes in the child node group it has matched to
 * Additionally, shows user if the node is visited or unvisited (red/green background) as well as gives user
 * ability to manually mark the node as visited or unvisited.
 */
function displayNodeMatches() {
    // get notVisitedNode array from local storage
    const notVisitedNodes = JSON.parse(localStorage.getItem('notVisitedNodes'));
    
    // Remove content from unvisited node display
    const container2 = document.getElementById('unvisited-node-display');
    container2.innerHTML = ''; // Clear previous content

    // Get the container for displaying the node matches
    const imageContainer = document.getElementById('unvisited-node-match');
    imageContainer.className='display-node-match';
    imageContainer.innerHTML = ''; // Clear previous content
   
    
    // Ensure that nodeMatchMap is valid
    if (!nodeMatchMap) {
        alert('invalid nodes');
        return;
    }
    
    // nodeMatch map is a map of master nodes to an array of child nodes that it has matched to. Iterate through map and display child nodes
    for (const [masterNode, matchingArray] of nodeMatchMap) {
        // Create Div (row) to hold the master as well as the childnode
        const imageRowDiv = document.createElement('div');
        imageRowDiv.className = 'image-row'
        
        // Set the background color of the row to red if the master node is unvisited, green if it is visited
        if (doesNodeIdExist(notVisitedNodes, masterNode.nodeID))
            imageRowDiv.style.background = 'red';
        else
            imageRowDiv.style.background = 'green';
        
        // Create div for buttons
        const buttonDiv = document.createElement('div');
        buttonDiv.className = 'button-div'
        
        // Create Master Node Div
        const masterImageDiv = document.createElement('div');
        masterImageDiv.className = 'image-div'
        
        // Create image and buttons
        const masterNodeImage = document.createElement('img');
        masterNodeImage.src = masterNode.image;
        const setUnvisitedButton = document.createElement('button');
        setUnvisitedButton.textContent = "Unvisited";
        const setVisitedButton = document.createElement('button');
        setVisitedButton.textContent = "Visited";
        setVisitedButton.addEventListener('click', () => setVisited(masterNode) );
        setUnvisitedButton.addEventListener('click', () => setUnvisited(masterNode));

        buttonDiv.appendChild(setUnvisitedButton);
        buttonDiv.appendChild(setVisitedButton);

        // add image and buttons to the div
        masterImageDiv.appendChild(masterNodeImage);
        masterImageDiv.appendChild(buttonDiv);

        imageRowDiv.appendChild(masterImageDiv);

        // add all of the matching child nodes
        for (let childNode of matchingArray) {
            // Create div for child
            const childDiv = document.createElement('div');
            childDiv.className = 'image-div'
            
            // Child image element
            const childNodeImage = document.createElement('img')
            childNodeImage.src = childNode.image;

            // add the child image element and add it to the row
            childDiv.appendChild(childNodeImage)
            imageRowDiv.appendChild(childDiv)
        }
        imageContainer.appendChild(imageRowDiv)
    }    
}

/**
 * Set node in notVisitedNodes array as visited
 */
function setVisited(node) {
    // Get not visited node array from local storage
    const notVisitedNodes = JSON.parse(localStorage.getItem('notVisitedNodes'));
    // check if node exists in notVisitedNodes array
    const idx = getNodeIndex(notVisitedNodes, node);

    // if the element exists in the array remove it
    if (idx!=-1)
        notVisitedNodes.splice(idx, 1);

    // update the notVisitedNodes array in local storage, and update the display
    localStorage.setItem('notVisitedNodes', JSON.stringify(notVisitedNodes));
    displayNodeMatches();
}
/**
 * Set node in notVisitedNodes array as unvisited
 */
function setUnvisited(node) {
    const notVisitedNodes = JSON.parse(localStorage.getItem('notVisitedNodes'));

    // check if node exists in notVisitedNodes array
    const idx = getNodeIndex(notVisitedNodes, node);
    if (idx!=-1)
        return;
    else
        notVisitedNodes.push(node);

    localStorage.setItem('notVisitedNodes', JSON.stringify(notVisitedNodes));
    displayNodeMatches();
}


export { displayMasterGroup, displayChildGroup }

// Template upload
document.getElementById('master-template-json').addEventListener('change', masterTemplateFileSelect);
document.getElementById('child-template-json').addEventListener('change', childTemplateFileSelect);

// Master/child upload
document.getElementById('master-json').addEventListener('change', masterFileSelect);
document.getElementById('child-json').addEventListener('change', childFileSelect);

// Node Processing display
document.getElementById('show-master-group').addEventListener('click', displayMasterGroup);
document.getElementById('show-child-group').addEventListener('click', displayChildGroup);
document.getElementById('close-node-processing').addEventListener('click', ()=> document.getElementById('node-group-display').innerHTML='' );
document.getElementById('download-node-group').addEventListener('mouseup', downloadNodeGroup);

// Node processing editing
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


// master/childnode group upload
document.getElementById('master-node-group').addEventListener('change', storeMasterNodeGroup);
document.getElementById('child-node-group').addEventListener('change', storeChildNodeGroup);

// Generate Unvisited Nodes
document.getElementById('generate-coverage').addEventListener('click', generateUnvisited);

// Display Master Graph
document.getElementById('generate-master').addEventListener('click', displayMasterGraph);

// Display master node group matches to child node group
document.getElementById('display-node-match').addEventListener('click', displayNodeMatches)

// display unvisited ndoes
document.getElementById('display-unvisited').addEventListener('click', displayUnvisitedNodes)

