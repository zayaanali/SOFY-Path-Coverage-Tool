import Graph, { DirectedGraph } from 'graphology';
import {allSimpleEdgePaths, allSimplePaths} from 'graphology-simple-path';
import { Sigma } from 'sigma';
import circular from 'graphology-layout/circular';



function getName(jsonArr, index) {
    var fullName = jsonArr.scenario[index].activityName;
    var lastPeriodIndex = fullName.lastIndexOf('.');
    if (lastPeriodIndex==-1)
        return fullName;
    else
        return fullName.substring(lastPeriodIndex + 1).trim();
}

function buildGraph(jsonArr) {
    
    // Instantiate directed unweighted graph (using graphology library)
    var newGraph = new Graph({multi: false, allowSelfLoops: true, type: 'directed'});
    
    const container = document.getElementById('master-graph-container');
   
    // Connect each edge in the graph (using data from JSON)
    const arrLength = jsonArr.scenario.length;
    
    // Add all edges in the json arr to the 
    for (var i=0; i<arrLength;i++) {
        if (i+1<arrLength)
            newGraph.mergeEdge(getName(jsonArr, i), getName(jsonArr, i+1));
    }
    // store the master graph for use later
    localStorage.setItem("masterGraph", JSON.stringify(newGraph.export()));
    
    circular.assign(newGraph);
    const renderer = new Sigma(newGraph, container)
}

// function buildGraph() {
//     //build a graph from just edges to each other

//     // return graph
// }



function getNotVisitedPaths(childJSONStr) {
    // Get list of nodes in the master
    var masterNodes=[];
    var masterGraph = Graph.from(JSON.parse(localStorage.getItem("masterGraph")));

    masterGraph.forEachNode((node, attributes) => {
        masterNodes.push(node);
      });

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
    ''
    // Create list of nodes that have yet to be visited
    var toVisitArr = masterNodes.filter(value => !childNodes.includes(value));
    
    // all paths from each node to the target nodes, allpaths function
    var notVisitedPaths=[]
    // for each nodes that needs to be visited
    for (var targetNode of toVisitArr) {
        var paths = allSimpleEdgePaths(masterGraph, masterNodes[0], targetNode);
        // console.log(paths)
        if (!notVisitedPaths.includes(paths))
            notVisitedPaths.push(paths);
    }
    // return the not visited paths
    return notVisitedPaths
}


/* Function to display graphs given edge array */
function displayCoverageGraph(edgeArr) {
    
    var coverageGraph = new Graph({multi: false, allowSelfLoops: true, type: 'directed'});
    for (var edge in edgeArr) {
        coverageGraph.mergeEdge(edge[0], edge[1]);
    }
    const container = document.getElementById('coverage-graph-container');
    circular.assign(coverageGraph);
    const renderer = new Sigma(coverageGraph, container)
}   

function isValidJSON(str) {
    try {
      JSON.parse(str);
      return true;
    } catch (e) {
      return false;
    }
}


export { buildGraph, getNotVisitedPaths, displayCoverageGraph };
