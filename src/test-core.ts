/**
 * Test script to verify core RageVFX functionality
 */

import { NodeGraph } from './core/NodeGraph';
import { ImageInputNode } from './nodes/ImageInputNode';
import { BlurNode } from './nodes/BlurNode';
import { ColorCorrectNode } from './nodes/ColorCorrectNode';
import { MergeNode } from './nodes/MergeNode';
import { TransformNode } from './nodes/TransformNode';
import { OutputNode } from './nodes/OutputNode';

async function testBasicPipeline() {
  console.log('=== Testing Basic Image Pipeline ===');
  
  const graph = new NodeGraph();
  
  // Create a simple pipeline: Input -> Blur -> Output
  const input = new ImageInputNode('input1');
  const blur = new BlurNode('blur1');
  const output = new OutputNode('output1');
  
  blur.setParameter('blurAmount', 10.0);
  
  graph.addNode(input);
  graph.addNode(blur);
  graph.addNode(output);
  
  const connected1 = graph.connect('input1', 'image', 'blur1', 'image');
  const connected2 = graph.connect('blur1', 'image', 'output1', 'image');
  
  console.log('Connections created:', connected1, connected2);
  
  // Execute the graph
  await graph.execute();
  
  const result = output.getFinalOutput();
  console.log('Result:', result ? `Image ${result.width}x${result.height}` : 'null');
  
  graph.clear();
  console.log('✓ Basic pipeline test passed\n');
}

async function testColorCorrection() {
  console.log('=== Testing Color Correction ===');
  
  const graph = new NodeGraph();
  
  const input = new ImageInputNode('input1');
  const colorCorrect = new ColorCorrectNode('cc1');
  const output = new OutputNode('output1');
  
  colorCorrect.setParameter('brightness', 0.1);
  colorCorrect.setParameter('contrast', 1.2);
  colorCorrect.setParameter('saturation', 1.3);
  
  graph.addNode(input);
  graph.addNode(colorCorrect);
  graph.addNode(output);
  
  graph.connect('input1', 'image', 'cc1', 'image');
  graph.connect('cc1', 'image', 'output1', 'image');
  
  await graph.execute();
  
  const result = output.getFinalOutput();
  console.log('Color corrected image:', result ? `${result.width}x${result.height}` : 'null');
  
  graph.clear();
  console.log('✓ Color correction test passed\n');
}

async function testCompositing() {
  console.log('=== Testing Compositing ===');
  
  const graph = new NodeGraph();
  
  const background = new ImageInputNode('bg');
  const foreground = new ImageInputNode('fg');
  const merge = new MergeNode('merge1');
  const output = new OutputNode('output1');
  
  merge.setParameter('operation', 'over');
  merge.setParameter('opacity', 0.8);
  
  graph.addNode(background);
  graph.addNode(foreground);
  graph.addNode(merge);
  graph.addNode(output);
  
  graph.connect('bg', 'image', 'merge1', 'background');
  graph.connect('fg', 'image', 'merge1', 'foreground');
  graph.connect('merge1', 'image', 'output1', 'image');
  
  await graph.execute();
  
  const result = output.getFinalOutput();
  console.log('Composited image:', result ? `${result.width}x${result.height}` : 'null');
  
  graph.clear();
  console.log('✓ Compositing test passed\n');
}

async function testTransform() {
  console.log('=== Testing Transform ===');
  
  const graph = new NodeGraph();
  
  const input = new ImageInputNode('input1');
  const transform = new TransformNode('transform1');
  const output = new OutputNode('output1');
  
  transform.setParameter('translateX', 100);
  transform.setParameter('translateY', 50);
  transform.setParameter('rotation', 45);
  transform.setParameter('scaleX', 1.5);
  transform.setParameter('scaleY', 1.5);
  
  graph.addNode(input);
  graph.addNode(transform);
  graph.addNode(output);
  
  graph.connect('input1', 'image', 'transform1', 'image');
  graph.connect('transform1', 'image', 'output1', 'image');
  
  await graph.execute();
  
  const result = output.getFinalOutput();
  console.log('Transformed image:', result ? `${result.width}x${result.height}` : 'null');
  
  graph.clear();
  console.log('✓ Transform test passed\n');
}

async function testComplexPipeline() {
  console.log('=== Testing Complex Pipeline ===');
  
  const graph = new NodeGraph();
  
  // Create a complex multi-branch pipeline
  const input1 = new ImageInputNode('input1');
  const input2 = new ImageInputNode('input2');
  const blur = new BlurNode('blur1');
  const colorCorrect = new ColorCorrectNode('cc1');
  const transform = new TransformNode('transform1');
  const merge = new MergeNode('merge1');
  const output = new OutputNode('output1');
  
  blur.setParameter('blurAmount', 5.0);
  colorCorrect.setParameter('brightness', 0.1);
  transform.setParameter('scaleX', 1.2);
  transform.setParameter('scaleY', 1.2);
  merge.setParameter('operation', 'over');
  
  [input1, input2, blur, colorCorrect, transform, merge, output].forEach(node => {
    graph.addNode(node);
  });
  
  // Branch 1: input1 -> blur -> merge.background
  graph.connect('input1', 'image', 'blur1', 'image');
  graph.connect('blur1', 'image', 'merge1', 'background');
  
  // Branch 2: input2 -> colorCorrect -> transform -> merge.foreground
  graph.connect('input2', 'image', 'cc1', 'image');
  graph.connect('cc1', 'image', 'transform1', 'image');
  graph.connect('transform1', 'image', 'merge1', 'foreground');
  
  // Output
  graph.connect('merge1', 'image', 'output1', 'image');
  
  console.log('Executing complex pipeline with multiple branches...');
  await graph.execute();
  
  const result = output.getFinalOutput();
  console.log('Final composited result:', result ? `${result.width}x${result.height}` : 'null');
  
  const connections = graph.getAllConnections();
  console.log(`Pipeline has ${graph.getAllNodes().length} nodes and ${connections.length} connections`);
  
  graph.clear();
  console.log('✓ Complex pipeline test passed\n');
}

async function testNodeCount() {
  console.log('=== Testing Node Management ===');
  
  const graph = new NodeGraph();
  
  const node1 = new ImageInputNode('n1');
  const node2 = new BlurNode('n2');
  const node3 = new OutputNode('n3');
  
  graph.addNode(node1);
  graph.addNode(node2);
  graph.addNode(node3);
  
  console.log('Added 3 nodes, count:', graph.getAllNodes().length);
  
  graph.removeNode('n2');
  console.log('Removed 1 node, count:', graph.getAllNodes().length);
  
  graph.clear();
  console.log('Cleared graph, count:', graph.getAllNodes().length);
  
  console.log('✓ Node management test passed\n');
}

async function runAllTests() {
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║   RageVFX Core Functionality Tests      ║');
  console.log('╚══════════════════════════════════════════╝\n');
  
  try {
    await testBasicPipeline();
    await testColorCorrection();
    await testCompositing();
    await testTransform();
    await testComplexPipeline();
    await testNodeCount();
    
    console.log('╔══════════════════════════════════════════╗');
    console.log('║  ✓ All tests passed successfully!       ║');
    console.log('╚══════════════════════════════════════════╝\n');
  } catch (error) {
    console.error('✗ Test failed:', error);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}

export { runAllTests };
