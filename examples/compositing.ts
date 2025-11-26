/**
 * Example: Multi-Layer Compositing
 * Demonstrates advanced compositing with multiple layers
 */

import { NodeGraph } from '../src/core/NodeGraph';
import { ImageInputNode } from '../src/nodes/ImageInputNode';
import { BlurNode } from '../src/nodes/BlurNode';
import { ColorCorrectNode } from '../src/nodes/ColorCorrectNode';
import { MergeNode } from '../src/nodes/MergeNode';
import { TransformNode } from '../src/nodes/TransformNode';
import { OutputNode } from '../src/nodes/OutputNode';

async function createCompositingExample() {
  const graph = new NodeGraph();

  // Background layer
  const background = new ImageInputNode('background');
  const bgBlur = new BlurNode('bg-blur');
  bgBlur.setParameter('blurAmount', 5.0);

  // Foreground layer 1
  const foreground1 = new ImageInputNode('fg1');
  const fg1Transform = new TransformNode('fg1-transform');
  fg1Transform.setParameter('scaleX', 1.2);
  fg1Transform.setParameter('scaleY', 1.2);
  fg1Transform.setParameter('translateX', 50);
  fg1Transform.setParameter('translateY', 30);

  // Foreground layer 2
  const foreground2 = new ImageInputNode('fg2');
  const fg2Color = new ColorCorrectNode('fg2-color');
  fg2Color.setParameter('brightness', 0.1);
  fg2Color.setParameter('saturation', 1.3);

  // Compositing
  const merge1 = new MergeNode('merge1');
  merge1.setParameter('operation', 'over');
  merge1.setParameter('opacity', 1.0);

  const merge2 = new MergeNode('merge2');
  merge2.setParameter('operation', 'over');
  merge2.setParameter('opacity', 0.8);

  const output = new OutputNode('output');

  // Add all nodes
  [background, bgBlur, foreground1, fg1Transform, foreground2, fg2Color, merge1, merge2, output]
    .forEach(node => graph.addNode(node));

  // Build the compositing tree
  // Background processing
  graph.connect('background', 'image', 'bg-blur', 'image');

  // Foreground 1 processing
  graph.connect('fg1', 'image', 'fg1-transform', 'image');

  // Foreground 2 processing
  graph.connect('fg2', 'image', 'fg2-color', 'image');

  // First merge: background + foreground1
  graph.connect('bg-blur', 'image', 'merge1', 'background');
  graph.connect('fg1-transform', 'image', 'merge1', 'foreground');

  // Second merge: result + foreground2
  graph.connect('merge1', 'image', 'merge2', 'background');
  graph.connect('fg2-color', 'image', 'merge2', 'foreground');

  // Final output
  graph.connect('merge2', 'image', 'output', 'image');

  // Execute the complex pipeline
  console.log('Executing multi-layer compositing...');
  await graph.execute();

  const result = output.getFinalOutput();
  console.log('Compositing complete! Layers merged successfully.', result);

  return result;
}

export { createCompositingExample };
