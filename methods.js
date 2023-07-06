import { isValidJSON, getName, getImage } from './helpers.js';
import Graph, { DirectedGraph } from 'graphology';
import {allSimpleEdgePaths, allSimplePaths } from 'graphology-simple-path';
import { Sigma } from 'sigma';
import circular from 'graphology-layout/circular';



/*
* This function takes in an array of nodes and builds a graph from it. Returns the built graph
*/
function buildGraph(nodeArr) {

    // Instantiate directed unweighted graph (using graphology library)
    var newGraph = new Graph({multi: false, allowSelfLoops: true, type: 'directed'});
    
    // Save length of the array
    const arrLength = nodeArr.length;
    
    // Add all edges in the json arr to the 
    for (var i=0; i<arrLength;i++) {
        // Add node and image. Check if image exists first
        
        // image does exist
        if (nodeArr[i][1]!=null)
            newGraph.mergeNode(nodeArr[i][0], { type: "image", image: nodeArr[i][1], size: 30 });
        else
            newGraph.mergeNode(nodeArr[i][0], { size: 30 });
        
        // if there is a node following attach an edge to it
        if (i+1<arrLength)
            newGraph.mergeEdge(nodeArr[i][0], nodeArr[i+1][0]);
    }
    
    return newGraph;
    

}


/*
* This function takes a graph as well as list of child nodes and returns all of the
* paths that have not been traversed yet from the start node (first node in the master)
*/
function getNotVisitedPaths(masterGraph, childNodes) {
    
    // Get list of nodes in the master
    var masterNodes=[];
    masterGraph.forEachNode((node, attributes) => {
        masterNodes.push(node);
    });

    
    // Get list of nodes that have already been visited
    var visitedNodes=[];
    for (var tuple of childNodes)
        if (!visitedNodes.includes(tuple[0]))
            visitedNodes.push(tuple[0]);

    // Create list of nodes that have yet to be visited. Get all nodes in master not present in child
    var toVisitArr = masterNodes.filter(value => !visitedNodes.includes(value));
    
    // find all paths from start node to all not visited nodes
    var notVisitedPaths=[]
    // for each nodes that needs to be visited
    for (var targetNode of toVisitArr) {
        var paths = allSimplePaths(masterGraph, masterNodes[0], targetNode);
        for (var path of paths) {
            if (!notVisitedPaths.includes(path))
                notVisitedPaths.push(path);
        }
    }

    return notVisitedPaths
}


/*
* Takes JSON string and returns tuples containing the node and the image link associated with it 
*/
function parseJSON(jsonStr) {
    
    // array to return containing node/image tuples
    var returnArr=[];
    
    // Check if the JSON string is a valid JSON
    if (!isValidJSON(jsonStr))
        alert("Invalid JSON");
    
    // parse the JSON to get it from string to JSON object    
    var jsonArr = JSON.parse(jsonStr);

    // Get number of nodes in the JSON
    const arrLength = jsonArr.scenario.length;
    
    // Add all edges in the json arr to the 
    for (var i=0; i<arrLength;i++) {
        // add name and image tuple to array
        returnArr.push([getName(jsonArr, i), getImage(jsonArr, i)]);
    }
    return returnArr;
}

/*
 * Ignore - this function is used for testing purposes
 */
function testFunction() {

    const testGraph = new Graph();

    testGraph.addNode('NODE1', {
        size: 100,
        type:"image",
        image:"http://portalvhdsld5gs9t7pkkvf.blob.core.windows.net/qbot/quantyzdandroidruns/Scenarios%5Ccom.hilton.android.hhonors%5C3fe0880c-33b3-4e5c-b1b3-c9497f27e19a%5CHilton-TestRun-1%5CImages%5C1687121175233.png",
        scale:500,
        color:"#FA4F40"
    });
    testGraph.addNode('NODE2', {
        size:100,
        type:"image",
        image:"./user.svg",
        scale: 500,
        color:"#727EE0"
    });

    testGraph.addEdge("NODE1", "NODE2")

    testGraph.nodes().forEach((node, i) => {
        const angle = (i * 2 * Math.PI) / testGraph.order;
        testGraph.setNodeAttribute(node, "x", 100 * Math.cos(angle));
        testGraph.setNodeAttribute(node, "y", 100 * Math.sin(angle));
      });


    const container = document.getElementById('master-graph-container');

    const renderer = new Sigma(testGraph, container, {
        nodeProgramClasses: {
          image: getNodeProgramImage()
    }});


    // Sigma.utils.pkg('sigma.canvas.nodes');
    // const testGraph = new Graph();

    // var node1 = {
    //     id:'NODE1',
    //     size: 10, 
    //     type:"image", 
    //     image:"http://portalvhdsld5gs9t7pkkvf.blob.core.windows.net/qbot/quantyzdandroidruns/Scenarios%5Ccom.hilton.android.hhonors%5C3fe0880c-33b3-4e5c-b1b3-c9497f27e19a%5CHilton-TestRun-1%5CImages%5C1687121175233.png"
    // }
    // var node2 = {
    //     id:'NODE2',
    //     size: 50, 
    //     type:"image", 
    //     image:"./user.svg", 
    //     color:"#727EE0"
    // }

    // testGraph.addNode(node1);
    // testGraph.addNode(node2);
    // testGraph.addEdge(node1,node2);

    // //const container = document.getElementById('master-graph-container');
    // const renderer = new Sigma({
    //     graph: testGraph,
    //     renderer: {
    //         container: document.getElementById('master-graph-container'),
    //         type: 'canvas'
    //     },
    //     settings: {
    //         minNodeSize: 8,
    //         maxNodeSize: 16
    //     }
    // });
    // CustomShapes.init(s);
    // s.refresh();
}




export { buildGraph, getNotVisitedPaths, testFunction, parseJSON };
