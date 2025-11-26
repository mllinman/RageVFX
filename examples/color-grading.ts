/**
 * Example: Color Grading Pipeline
 * Demonstrates advanced color correction
 */

import { NodeGraph } from '../src/core/NodeGraph';
import { ImageInputNode } from '../src/nodes/ImageInputNode';
import { ColorCorrectNode } from '../src/nodes/ColorCorrectNode';
import { OutputNode } from '../src/nodes/OutputNode';

async function createColorGradingPipeline() {
  const graph = new NodeGraph();

  // Create nodes
  const input = new ImageInputNode('input');
  const primaryGrade = new ColorCorrectNode('primary');
  const secondaryGrade = new ColorCorrectNode('secondary');
  const output = new OutputNode('output');

  // Primary color correction
  primaryGrade.setParameter('brightness', 0.05);
  primaryGrade.setParameter('contrast', 1.15);
  primaryGrade.setParameter('saturation', 1.1);

  // Secondary color correction (fine tuning)
  secondaryGrade.setParameter('brightness', -0.02);
  secondaryGrade.setParameter('contrast', 1.05);

  // Build the pipeline
  graph.addNode(input);
  graph.addNode(primaryGrade);
  graph.addNode(secondaryGrade);
  graph.addNode(output);

  // Connect nodes
  graph.connect('input', 'image', 'primary', 'image');
  graph.connect('primary', 'image', 'secondary', 'image');
  graph.connect('secondary', 'image', 'output', 'image');

  // Execute
  console.log('Executing color grading pipeline...');
  await graph.execute();

  const result = output.getFinalOutput();
  console.log('Color grading complete!', result);

  return result;
}

export { createColorGradingPipeline };
