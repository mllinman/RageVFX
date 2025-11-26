"use strict";
/**
 * Example: Basic Blur Effect
 * Demonstrates a simple image processing pipeline
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBasicBlurEffect = createBasicBlurEffect;
const NodeGraph_1 = require("../src/core/NodeGraph");
const ImageInputNode_1 = require("../src/nodes/ImageInputNode");
const BlurNode_1 = require("../src/nodes/BlurNode");
const OutputNode_1 = require("../src/nodes/OutputNode");
async function createBasicBlurEffect() {
    // Create the node graph
    const graph = new NodeGraph_1.NodeGraph();
    // Create nodes
    const inputNode = new ImageInputNode_1.ImageInputNode('input');
    const blurNode = new BlurNode_1.BlurNode('blur');
    const outputNode = new OutputNode_1.OutputNode('output');
    // Configure blur parameters
    blurNode.setParameter('blurAmount', 15.0);
    blurNode.setParameter('quality', 'production');
    // Add nodes to graph
    graph.addNode(inputNode);
    graph.addNode(blurNode);
    graph.addNode(outputNode);
    // Connect the pipeline
    graph.connect('input', 'image', 'blur', 'image');
    graph.connect('blur', 'image', 'output', 'image');
    // Execute the graph
    console.log('Executing basic blur effect...');
    await graph.execute();
    // Get the result
    const result = outputNode.getFinalOutput();
    console.log('Blur effect complete!', result);
    return result;
}
//# sourceMappingURL=basic-blur.js.map