import Graph from 'graphology';
import {allSimplePaths} from 'graphology-simple-path';

const graph = new Graph();
graph.mergeEdge('1', '2');
graph.mergeEdge('1', '3');
graph.mergeEdge('2', '3');

const paths = allSimplePaths(graph, '1', '3');
console.log(paths)