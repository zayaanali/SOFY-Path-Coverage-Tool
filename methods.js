import { isValidJSON, getName, getImage, getScenario, masterJSON, findImage, getNode, imageDiff, getSubNode, doesNodeExist, addNode } from './helpers.js';
import Graph, { DirectedGraph } from 'graphology';
import {allSimpleEdgePaths, allSimplePaths } from 'graphology-simple-path';
import { Sigma } from 'sigma';
import circular from 'graphology-layout/circular';
import { allowedDiff } from './main.js';


/*
* Takes JSON string and returns tuples containing the node and the image link associated with it. Also builds graph
*/
async function parseJSON(jsonStr, nodeArr) {
    

    var newGraph = new Graph({multi: false, allowSelfLoops: true, type: 'directed'});
    let returnArr=[];
    // Check if the JSON string is a valid JSON
    if (!isValidJSON(jsonStr))
        alert("Invalid JSON");
    
    // parse the JSON to get it from string to JSON object    
    var jsonArr = JSON.parse(jsonStr);

    // Get number of nodes in the JSON
    const arrLength = jsonArr.scenario.length;
    
    // Building concise node array (placing identical screen as subnodes)
    for (var i=0; i<arrLength;i++) {
       i = await addNode(jsonArr, i, arrLength, nodeArr); // adds the node of the given index to the array of representative nodes       
    }
    
    // building full node array
    for (var i=0; i<arrLength;i++) {
        returnArr.push(getNode(jsonArr, i))
    }
    return returnArr;
}

async function buildGraph(jsonStr, nodeArr) {
    

    var newGraph = new Graph({multi: false, allowSelfLoops: true, type: 'directed'});
    let returnArr=[];
    let node;
    let tempIndex;
    // Check if the JSON string is a valid JSON
    if (!isValidJSON(jsonStr))
        alert("Invalid JSON");
    
    // parse the JSON to get it from string to JSON object    
    var jsonArr = JSON.parse(jsonStr);

    // Get number of nodes in the JSON
    const arrLength = jsonArr.scenario.length;
    let lastNodeIndex=-999; // index of last node that was found (initially set to -999)
    
    // Building concise node array (placing identical screen as subnodes)
    for (var i=0; i<arrLength;i++) {
        // Get the image of the current node
        let curNode = jsonArr.scenario[i];
            
        // get the index of the node if it already exists in the array
        let nodeIndex = await doesNodeExist(nodeArr, curNode.image);
        
        // if already exists in array
        if (nodeIndex!=-1) {
            
            nodeArr[nodeIndex].subNodes.push(getSubNode(jsonArr, i));
            if (lastNodeIndex>0) // if there is a prior representative node (not the first screen)
                newGraph.mergeEdge(nodeArr[lastNodeIndex].nodeID, nodeArr[nodeIndex].nodeID); // add an edge between the last node in the array and the node that is being added
            
            lastNodeIndex=nodeIndex; // set the last node as representative node that was just processed
            
        } else { // does not exist in the array yet
            node=getNode(jsonArr,i);
            newGraph.mergeNode(node.nodeID, { type: "image", label: node.actionID, image: node.image, size: 10 }); // add node to graph
            if (lastNodeIndex>0) // if there is a prior representative node (not the first screen)
                newGraph.mergeEdge(nodeArr[lastNodeIndex].nodeID, node.nodeID); // add an edge between the last node in the array and the node that is being added
            
            nodeArr.push(node); // add the node to the array
            lastNodeIndex=nodeArr.length-1; // last node is now set to node that was just processed
        }
            
        
        let nextIndex = i+1;
        let done = false;
        
        // for all next nodes check if they are subnodes
        while (!done && nextIndex<arrLength) {
            
            // Get the next image and compute difference between current and next image
            let nextImage = jsonArr.scenario[nextIndex].snapshotLocation;
            let diff = await imageDiff(curNode.image, nextImage);

            // if the difference is less than 5% they are subnodes
            if (diff<=allowedDiff) {
                // check if the node that compared to is a subnode or representative node
                if (nodeIndex!=-1) // subnode
                    nodeArr[nodeIndex].subNodes.push(getSubNode(jsonArr, nextIndex)); // use the index found previously
                else // representative node
                    nodeArr[nodeArr.length-1].subNodes.push(getSubNode(jsonArr, nextIndex)); // use the index of the node that was just added to the array
                
                nextIndex++; // increment the temp index
            } else { // difference is more than 5% so don't do anything
                done=true;
                //  i = nextIndex-1; // will be incremented by the forloop
                return nextIndex-1;
            }
        }
    }
    
    // building full node array
    for (var i=0; i<arrLength;i++) {
        returnArr.push(getNode(jsonArr, i))
    }
    return newGraph;
}

/*
* This function takes in an array of nodes and builds a graph from it. Returns the built graph
*/
// function buildGraph(nodeArr) {

//     // Instantiate directed unweighted graph (using graphology library)
//     var newGraph = new Graph({multi: false, allowSelfLoops: true, type: 'directed'});
    
//     // Save length of the array
//     const arrLength = nodeArr.length;
    
//     // Add all edges in the json arr to the 
//     for (var i=0; i<arrLength;i++) {
//         // Add node and image. Check if image exists first
//         // image does exist
//         if (nodeArr[i].image!=null)
//             newGraph.mergeNode(nodeArr[i].nodeID, { type: "image", label: nodeArr[i].actionID, image: nodeArr[i].image, size: 10 });
//         else
//             newGraph.mergeNode(nodeArr[i].nodeID, { size: 10, label: nodeArr[i].actionID });
        
//         // if there is a node following attach an edge to it
//         if (i+1<arrLength)
//             newGraph.mergeEdge(nodeArr[i].nodeID, nodeArr[i+1].nodeID);
//     }
//     return newGraph;
// }

async function getNotVisitedNodes(masterNodeGroup, childNodeGroup) {
    
    // Create a deep copy of master array 
    let toVisitArr= JSON.parse(JSON.stringify(masterNodeGroup));
    let toRemove=[];
    
    // Iterate through each node of the master. If matched with a node in the child mark for removal
    for (let i=0; i<masterNodeGroup.length; i++) {
        for (let childNode of childNodeGroup) {
            let diff =  await imageDiff(masterNodeGroup[i].image, childNode.image)
            if (diff<=allowedDiff)
                toRemove.push(i);
        }
    }
    // Remove all nodes that have already been visited and return
    return toVisitArr.filter((item, index) => !toRemove.includes(index));
    // // Get list of nodes in the master
    // var masterNodes=[];
    // masterGraph.forEachNode((node, attributes) => {
    //     masterNodes.push(node);
    // });

    // // Get list of nodes that have already been visited (remove duplicates)
    // var visitedNodes=[];
    // for (var node of childNodes) {
    //     if (!visitedNodes.includes(node.nodeID))
    //         visitedNodes.push(node.nodeID);
    // }

    // // Create list of nodes that have yet to be visited. Get all nodes in master not present in child
    // var toVisitArr = masterNodes.filter(value => !visitedNodes.includes(value));
    
    // return toVisitArr
}
/*
* This function takes a graph as well as list of child nodes and returns all of the
* paths that have not been traversed yet from the start node (first node in the master)
*/
function getNotVisitedPaths(masterGraph, toVisitArr) {
    let targetArr=[];
    for (let node of toVisitArr) {
        targetArr.push(node.nodeID)
    }
    
    console.log(targetArr)
    // Get list of nodes in the master
    var masterNodes=[];
    masterGraph.forEachNode((node, attributes) => {
        masterNodes.push(node);
    });
    // find all paths from start node to all not visited nodes
    var notVisitedPaths=[]
    // for each nodes that needs to be visited
    for (var targetNode of targetArr) {
        var paths = allSimplePaths(masterGraph, masterNodes[0], targetNode, { maxDepth:20 });
        console.log(paths)
        for (var path of paths) {
            if (!notVisitedPaths.includes(path))
                notVisitedPaths.push(path);
        }
    }
    
    console.log(notVisitedPaths)
    return notVisitedPaths
}

function createGraphFromPath(notVisitedPaths, masterNodes) {
    
    // Create graph from not visited paths
    var coverageGraph = new Graph({multi: false, allowSelfLoops: true, type: 'directed'});

    // for each path merge each edge
    for (var path of notVisitedPaths) {
        for (var i=0; i<path.length; i++) {
            // if there is a following node in the path
            if (i+1<path.length) {
                // add first node (name and image)
                if (findImage(masterNodes, path[i])!=null)
                    coverageGraph.mergeNode(path[i], { type: "image", label: path[i], image: findImage(masterNodes, path[i]), size: 30 });
                else    
                    coverageGraph.mergeNode(path[i], { size: 30, label: path[i] });

                // add second node (name and image)
                if (findImage(masterNodes, path[i+1])!=null)
                    coverageGraph.mergeNode(path[i+1], { type: "image", label: path[i+1], image: findImage(masterNodes, path[i+1]), size: 30 });
                else
                    coverageGraph.mergeNode(path[i+1], { label: path[i+1], size: 30 });

                // add edge between the two nodes
                coverageGraph.mergeEdge(path[i], path[i+1]);
            } 
        }
    }
    return coverageGraph;
}





/*
 * Generate an html table for nested arrays
*/
function generateTable(masterJSON, array) {
    var table = document.createElement('table');

      for (var i = 0; i < array.length; i++) {
        var row = document.createElement('tr');

        for (var j = 0; j < array[i].length; j++) {
          var cell = document.createElement('td');
          var cellText = document.createTextNode(array[i][j]);
          cell.appendChild(cellText);
          row.appendChild(cell);
        }

        var buttonCell = document.createElement('td');
        var button = document.createElement('button');
        button.textContent = 'Download Test JSON';
        button.addEventListener('click', createButtonHandler(array[i])); // Attach event handler to the button
        buttonCell.appendChild(button);
        row.appendChild(buttonCell);

        table.appendChild(row);
    }

    return table;

    // Function to create an event handler for the button
    function createButtonHandler(arrayElement) {
        return function() {
          // Perform your desired action with the array element
          var newJSON = createPathJSON(masterJSON, arrayElement);
          downloadJSON("SOFY-TEST", newJSON);
          console.log(newJSON)
        };
    }

    function downloadJSON(filename, jsonContent) {
        var element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(jsonContent)));
        element.setAttribute('download', filename);
        
        element.style.display = 'none';
        document.body.appendChild(element);
        
        element.click();
        
        document.body.removeChild(element);
    }



  
}
/*
 * creates a JSON for a corresponding path to be able to run a test
 */
function createPathJSON(master, path) {
    // create a deep copy of the master to modify
    var newJSON = JSON.parse(JSON.stringify(master));
    
    // set the scenario to empty
    newJSON.scenario=[];

    // for each node on the path, add the node to the scenario
    for (var node of path)
        newJSON.scenario.push(getScenario(master, node));
    
    return newJSON
}







/**
 * For each node in the graph checks for self-loops. If they exist then shows the different
 * actions within the self-loop;
 */
function checkSelfLoops(node) {
    // Get master JSON
    if (!isValidJSON(masterJSON.getValue()))
        throw new Error("master json not valid");
    
    var master = JSON.parse(masterJSON.getValue());


    var actionArr=[];
    
    // For each node of the 
    for (var i=0; i<master.scenario.length; i++) {
        
        if (getName(master, i)==node && i+1<master.scenario.length && getName(master, i+1)==node) {
            var actions=[];
            actions.push(master.scenario[i].action);
            actions.push(master.scenario[i+1].action);
            i=i+2;
            while (i<master.scenario.length && getName(master, i)==node) {
                actions.push(master.scenario[i].action);
                i++;
            }
            actionArr.push(actions);
        }
    }
    return actionArr

}

/*
 * Ignore - this function is used for testing purposes
 */
async function testFunction() {
    const imageURL1 = 'http://portalvhdsld5gs9t7pkkvf.blob.core.windows.net/qbot/quantyzdandroidruns/Scenarios%5Ccom.hilton.android.hhonors%5C880a1e7d-5b4f-4315-a9e5-61aef9190447%5Chilton-filter-test%5CImages%5C1690229476825.png';
    const imageURL2 = 'http://portalvhdsld5gs9t7pkkvf.blob.core.windows.net/qbot/quantyzdandroidruns/Scenarios%5Ccom.hilton.android.hhonors%5C880a1e7d-5b4f-4315-a9e5-61aef9190447%5Chilton-filter-test%5CImages%5C1690229476982.png';
    console.log(100*await imageDiff(imageURL1,imageURL2))
}








export { buildGraph, getNotVisitedPaths, testFunction, parseJSON, generateTable, createPathJSON, checkSelfLoops, getNotVisitedNodes, createGraphFromPath };
