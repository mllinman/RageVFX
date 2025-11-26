/**
 * Example: Basic Blur Effect
 * Demonstrates a simple image processing pipeline
 */

import { NodeGraph } from '../src/core/NodeGraph';
import { ImageInputNode } from '../src/nodes/ImageInputNode';
import { BlurNode } from '../src/nodes/BlurNode';
import { OutputNode } from '../src/nodes/OutputNode';

async function createBasicBlurEffect() {
  // Create the node graph
  const graph = new NodeGraph();

  // Create nodes
  const inputNode = new ImageInputNode('input');
  const blurNode = new BlurNode('blur');
  const outputNode = new OutputNode('output');

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

export { createBasicBlurEffect };
