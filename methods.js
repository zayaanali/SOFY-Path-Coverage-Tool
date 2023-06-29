import Graph, { DirectedGraph } from 'graphology';
import {allSimpleEdgePaths, allSimplePaths} from 'graphology-simple-path';
import { Sigma } from 'sigma';
import circular from 'graphology-layout/circular';

// Instantiate directed unweighted graph (using graphology library)
var newGraph = new Graph({multi: false, allowSelfLoops: true, type: 'directed'});

function getName(jsonArr, index) {
    var fullName = jsonArr.scenario[index].activityName;
    var lastPeriodIndex = fullName.lastIndexOf('.');
    if (lastPeriodIndex==-1)
        return fullName;
    else
        return fullName.substring(lastPeriodIndex + 1).trim();
}

function buildGraph(jsonArr) {
    const container = document.getElementById('sigma-container');
   
    // Connect each edge in the graph (using data from JSON)
    const arrLength = jsonArr.scenario.length;
    
    // Add all edges in the json arr to the 
    for (var i=0; i<arrLength;i++) {
        if (i+1<arrLength)
            newGraph.mergeEdge(getName(jsonArr, i), getName(jsonArr, i+1));
    }
    circular.assign(newGraph);
    const renderer = new Sigma(newGraph, container)
}

function buildGraph() {
    //build a graph from just edges to each other

    // return graph
}



function getNotVisitedPaths(childJSONStr) {
    // Get list of nodes in the master
    masterNodes = newGraph.nodes;

    // Get list of nodes in the child JSON (from array of strings)
    var childNodes=[];
    var arrLength, childJSON;
    
    // for each child file given
    for (var i=0; i<childJSONStr.length; i++) {
        // check if JSON is valid
        if(!isValidJSON(childJSONStr[i]))
            alert("Invalid JSON");
        
        // iterate through each node and add to an array
        childJSON = JSON.parse(childJSONStr[i]);
        arrLength = childJSON.scenario.length;
        for (var j=0; j<arrLength; j++) {
            if (!childNodes.includes(getName(childJSON, j)))
                childNodes.push(getName(childJSON, j));
        }
    }
    
    
    
    // Create list of nodes that have yet to be visited
    var toVisitArr = masterNodes.filter(value => !childNodes.includes(value));

    // all paths from each node to the target nodes, allpaths function
    var notVisitedPaths=[]
    // for each nodes that needs to be visited
    for (targetNode of toVisitArr) {
        var paths = allSimpleEdgePaths(newGraph, masterNodes[0], targetNode);
        if (!notVisitedPaths.includes(paths))
            notVisitedPaths.push(paths);
    }

    // return the not visited paths
    return notVisitedPaths
}

function getNodesFromJSON(childJSON) {
    // d
}

export { buildGraph, getNotVisitedPaths };
