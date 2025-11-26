"use strict";
/**
 * Example: Color Grading Pipeline
 * Demonstrates advanced color correction
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createColorGradingPipeline = createColorGradingPipeline;
const NodeGraph_1 = require("../src/core/NodeGraph");
const ImageInputNode_1 = require("../src/nodes/ImageInputNode");
const ColorCorrectNode_1 = require("../src/nodes/ColorCorrectNode");
const OutputNode_1 = require("../src/nodes/OutputNode");
async function createColorGradingPipeline() {
    const graph = new NodeGraph_1.NodeGraph();
    // Create nodes
    const input = new ImageInputNode_1.ImageInputNode('input');
    const primaryGrade = new ColorCorrectNode_1.ColorCorrectNode('primary');
    const secondaryGrade = new ColorCorrectNode_1.ColorCorrectNode('secondary');
    const output = new OutputNode_1.OutputNode('output');
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
//# sourceMappingURL=color-grading.js.map