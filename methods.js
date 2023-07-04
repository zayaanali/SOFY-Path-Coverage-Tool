import Graph, { DirectedGraph } from 'graphology';
import {allSimpleEdgePaths, allSimplePaths } from 'graphology-simple-path';
import { Sigma } from 'sigma';
import circular from 'graphology-layout/circular';
import getNodeProgramImage from "sigma/rendering/webgl/programs/node.image";
import NodeProgramBorder from "./node.border";



function getName(jsonArr, index) {
    var fullName = jsonArr.scenario[index].activityName;
    var lastPeriodIndex = fullName.lastIndexOf('.');
    if (lastPeriodIndex==-1)
        return fullName;
    else
        return fullName.substring(lastPeriodIndex + 1).trim();
}

function getImage(jsonArr, index) {
    return jsonArr.scenario[index].snapshotLocation;
}

function buildGraph(jsonArr) {

    // Instantiate directed unweighted graph (using graphology library)
    var newGraph = new Graph({multi: false, allowSelfLoops: true, type: 'directed'});
    

   
    // Connect each edge in the graph (using data from JSON)
    const arrLength = jsonArr.scenario.length;
    
    // Add all edges in the json arr to the 
    for (var i=0; i<arrLength;i++) {
        // add the node and image first
        // newGraph.mergeNode(getName(jsonArr, i), {image: getImage(jsonArr, index)});
        if (i+1<arrLength)
            newGraph.mergeEdge(getName(jsonArr, i), getName(jsonArr, i+1));
    }
    
    // store the master graph for use later
    localStorage.setItem("masterGraph", JSON.stringify(newGraph.export()));
    
    const container = document.getElementById('master-graph-container');
    circular.assign(newGraph);
    const renderer = new Sigma(newGraph, container);
}



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
        var paths = allSimplePaths(masterGraph, masterNodes[0], targetNode);
        
        for (var path of paths) {
            if (!notVisitedPaths.includes(path))
                notVisitedPaths.push(path);
        }
        
    }
    // return the not visited paths
    return notVisitedPaths
}


/* Function to display graphs given edge array */
function displayCoverageGraph(paths) {
 
    var coverageGraph = new Graph({multi: false, allowSelfLoops: true, type: 'directed'});
    for (var path of paths) {
        for (var i=0; i<path[0].length; i++) {
            if (i+1<path.length) {
                // console.log(path[i], path[i+1]);
                coverageGraph.mergeEdge(path[i], path[i+1]);} 
        }
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

function testFunction() {
    const container = document.getElementById("master-graph-container");

    const graph = new Graph();

    const RED = "#FA4F40";
    const BLUE = "#727EE0";
    const GREEN = "#5DB346";

    graph.addNode("John", { size: 15, label: "John", type: "image", image: "./user.svg", color: RED });
    graph.addNode("Mary", { size: 15, label: "Mary", type: "image", image: "./user.svg", color: RED });
    graph.addNode("Suzan", { size: 15, label: "Suzan", type: "image", image: "./user.svg", color: RED });
    graph.addNode("Nantes", { size: 15, label: "Nantes", type: "image", image: "./city.svg", color: BLUE });
    graph.addNode("New-York", { size: 15, label: "New-York", type: "image", image: "./city.svg", color: BLUE });
    graph.addNode("Sushis", { size: 7, label: "Sushis", type: "border", color: GREEN });
    graph.addNode("Falafels", { size: 7, label: "Falafels", type: "border", color: GREEN });
    graph.addNode("Kouign Amann", { size: 7, label: "Kouign Amann", type: "border", color: GREEN });

    graph.addEdge("John", "Mary", { type: "line", label: "works with", size: 5 });
    graph.addEdge("Mary", "Suzan", { type: "line", label: "works with", size: 5 });
    graph.addEdge("Mary", "Nantes", { type: "arrow", label: "lives in", size: 5 });
    graph.addEdge("John", "New-York", { type: "arrow", label: "lives in", size: 5 });
    graph.addEdge("Suzan", "New-York", { type: "arrow", label: "lives in", size: 5 });
    graph.addEdge("John", "Falafels", { type: "arrow", label: "eats", size: 5 });
    graph.addEdge("Mary", "Sushis", { type: "arrow", label: "eats", size: 5 });
    graph.addEdge("Suzan", "Kouign Amann", { type: "arrow", label: "eats", size: 5 });

    graph.nodes().forEach((node, i) => {
    const angle = (i * 2 * Math.PI) / graph.order;
    graph.setNodeAttribute(node, "x", 100 * Math.cos(angle));
    graph.setNodeAttribute(node, "y", 100 * Math.sin(angle));
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const renderer = new Sigma(graph, container, {
    // We don't have to declare edgeProgramClasses here, because we only use the default ones ("line" and "arrow")
    nodeProgramClasses: {
        image: getNodeProgramImage(),
        border: NodeProgramBorder,
    },
    renderEdgeLabels: true,
});

// Create the spring layout and start it
const layout = new ForceSupervisor(graph);
layout.start();




}



export { buildGraph, getNotVisitedPaths, displayCoverageGraph, testFunction };
