import { isValidJSON, getName, getImage, getScenario } from './helpers.js';
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
            newGraph.mergeNode(nodeArr[i][0], { type: "image", label: nodeArr[i][0], image: nodeArr[i][1], size: 30 });
        else
            newGraph.mergeNode(nodeArr[i][0], { size: 30, label: nodeArr[i][0] });
        
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





/*
 * Ignore - this function is used for testing purposes
 */
function testFunction() {

    const testGraph = new Graph();

    testGraph.addNode('NODE1');
    testGraph.addNode('NODE2');
    testGraph.addNode('NODE3')

    testGraph.addEdge("NODE1", "NODE2");
    testGraph.addEdge("NODE2", "NODE3");

    // change edge sizes
    testGraph.edges().forEach(key => {
        testGraph.setEdgeAttribute(key, 'size', 5);
    })

    circular.assign(testGraph);
    const container = document.getElementById('master-graph-container');

    let hoveredEdge = null;
    const renderer = new Sigma(testGraph, container, {
        enableEdgeClickEvents: true,
        enableEdgeWheelEvents: true,
        enableEdgeHoverEvents: "debounce",
        edgeReducer(edge, data) {
            const res = { ...data };
            if (edge === hoveredEdge) res.color = "#cc0000";
            return res;
          },
    });
    const nodeEvents = [
        "enterNode",
        "leaveNode",
        "downNode",
        "clickNode",
        "rightClickNode",
        "doubleClickNode",
        "wheelNode",
      ];
      const edgeEvents = ["downEdge", "clickEdge", "rightClickEdge", "doubleClickEdge", "wheelEdge"];
      const stageEvents = ["downStage", "clickStage", "doubleClickStage", "wheelStage"];
      
      
      renderer.on("enterEdge", ({ edge }) => {

        hoveredEdge = edge;
        renderer.refresh();
      });

      renderer.on("clickEdge", ({ edge }) => {

        console.log(edge);
        console.log(testGraph.source(edge))
        console.log(testGraph.target(edge))
  
        renderer.refresh();
      });

      renderer.on("leaveEdge", ({ edge }) => {

        hoveredEdge = null;
        renderer.refresh();
      });
      


}







export { buildGraph, getNotVisitedPaths, testFunction, parseJSON, generateTable, createPathJSON };
