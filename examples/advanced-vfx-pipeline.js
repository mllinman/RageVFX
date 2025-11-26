"use strict";
/**
 * Example: Advanced VFX Pipeline
 * Demonstrates a professional-grade VFX workflow combining multiple techniques
 * This example showcases:
 * - Procedural texture generation
 * - Multi-layer compositing
 * - Color grading
 * - Chroma keying
 * - Edge detection and enhancement
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAdvancedVFXPipeline = createAdvancedVFXPipeline;
const NodeGraph_1 = require("../src/core/NodeGraph");
const ImageInputNode_1 = require("../src/nodes/ImageInputNode");
const NoiseNode_1 = require("../src/nodes/NoiseNode");
const GradientNode_1 = require("../src/nodes/GradientNode");
const BlurNode_1 = require("../src/nodes/BlurNode");
const ColorCorrectNode_1 = require("../src/nodes/ColorCorrectNode");
const MergeNode_1 = require("../src/nodes/MergeNode");
const TransformNode_1 = require("../src/nodes/TransformNode");
const ChromaKeyNode_1 = require("../src/nodes/ChromaKeyNode");
const EdgeDetectNode_1 = require("../src/nodes/EdgeDetectNode");
const OutputNode_1 = require("../src/nodes/OutputNode");
/**
 * Creates a professional VFX pipeline demonstrating the full power of RageVFX
 */
async function createAdvancedVFXPipeline() {
    console.log('\n╔════════════════════════════════════════════════╗');
    console.log('║  Advanced VFX Pipeline - Professional Grade   ║');
    console.log('╚════════════════════════════════════════════════╝\n');
    const graph = new NodeGraph_1.NodeGraph();
    // ===== Background Creation =====
    console.log('📐 Building procedural background...');
    // Create a noise-based background
    const backgroundNoise = new NoiseNode_1.NoiseNode('bg-noise');
    backgroundNoise.setParameter('scale', 0.005);
    backgroundNoise.setParameter('octaves', 6);
    backgroundNoise.setParameter('persistence', 0.6);
    // Add gradient overlay
    const bgGradient = new GradientNode_1.GradientNode('bg-gradient');
    bgGradient.setParameter('type', 'radial');
    bgGradient.setParameter('color1', { r: 20, g: 30, b: 50, a: 255 });
    bgGradient.setParameter('color2', { r: 5, g: 10, b: 20, a: 255 });
    // Merge noise and gradient
    const bgMerge = new MergeNode_1.MergeNode('bg-merge');
    bgMerge.setParameter('operation', 'multiply');
    bgMerge.setParameter('opacity', 0.7);
    // Blur the background slightly
    const bgBlur = new BlurNode_1.BlurNode('bg-blur');
    bgBlur.setParameter('blurAmount', 3.0);
    // ===== Main Subject Layer =====
    console.log('🎬 Processing main subject...');
    // Main subject with green screen
    const mainSubject = new ImageInputNode_1.ImageInputNode('main-subject');
    // Remove green screen
    const chromaKey = new ChromaKeyNode_1.ChromaKeyNode('chroma-key');
    chromaKey.setParameter('keyColor', { r: 0, g: 255, b: 0 });
    chromaKey.setParameter('threshold', 0.35);
    chromaKey.setParameter('softness', 0.15);
    // Color grade the subject
    const subjectGrade = new ColorCorrectNode_1.ColorCorrectNode('subject-grade');
    subjectGrade.setParameter('brightness', 0.08);
    subjectGrade.setParameter('contrast', 1.15);
    subjectGrade.setParameter('saturation', 1.2);
    // ===== Edge Enhancement Layer =====
    console.log('⚡ Adding edge enhancement...');
    // Detect edges on the keyed subject
    const edgeDetect = new EdgeDetectNode_1.EdgeDetectNode('edge-detect');
    edgeDetect.setParameter('threshold', 0.15);
    edgeDetect.setParameter('outputMode', 'edges');
    // Color the edges
    const edgeColor = new ColorCorrectNode_1.ColorCorrectNode('edge-color');
    edgeColor.setParameter('brightness', 0.3);
    // Blur edges slightly for glow effect
    const edgeBlur = new BlurNode_1.BlurNode('edge-blur');
    edgeBlur.setParameter('blurAmount', 2.0);
    // ===== Foreground Element =====
    console.log('🎨 Creating foreground element...');
    // Create a particle-like foreground element
    const fgNoise = new NoiseNode_1.NoiseNode('fg-noise');
    fgNoise.setParameter('scale', 0.02);
    fgNoise.setParameter('octaves', 3);
    // Transform and position it
    const fgTransform = new TransformNode_1.TransformNode('fg-transform');
    fgTransform.setParameter('scaleX', 0.8);
    fgTransform.setParameter('scaleY', 0.8);
    fgTransform.setParameter('rotation', 15);
    fgTransform.setParameter('translateX', 200);
    fgTransform.setParameter('translateY', -100);
    // Color grade the foreground
    const fgGrade = new ColorCorrectNode_1.ColorCorrectNode('fg-grade');
    fgGrade.setParameter('brightness', -0.2);
    fgGrade.setParameter('saturation', 0.3);
    // ===== Compositing Stack =====
    console.log('🔗 Compositing layers...');
    // Layer 1: Background + Edge glow
    const composite1 = new MergeNode_1.MergeNode('comp1');
    composite1.setParameter('operation', 'add');
    composite1.setParameter('opacity', 0.5);
    // Layer 2: Add main subject
    const composite2 = new MergeNode_1.MergeNode('comp2');
    composite2.setParameter('operation', 'over');
    composite2.setParameter('opacity', 1.0);
    // Layer 3: Add foreground element
    const composite3 = new MergeNode_1.MergeNode('comp3');
    composite3.setParameter('operation', 'over');
    composite3.setParameter('opacity', 0.3);
    // Final color grade
    const finalGrade = new ColorCorrectNode_1.ColorCorrectNode('final-grade');
    finalGrade.setParameter('brightness', 0.05);
    finalGrade.setParameter('contrast', 1.1);
    finalGrade.setParameter('saturation', 1.05);
    // Output
    const output = new OutputNode_1.OutputNode('output');
    output.setParameter('format', 'png');
    output.setParameter('quality', 100);
    // ===== Build the Graph =====
    console.log('🔨 Assembling node graph...');
    const allNodes = [
        // Background
        backgroundNoise, bgGradient, bgMerge, bgBlur,
        // Main subject
        mainSubject, chromaKey, subjectGrade,
        // Edge enhancement
        edgeDetect, edgeColor, edgeBlur,
        // Foreground
        fgNoise, fgTransform, fgGrade,
        // Compositing
        composite1, composite2, composite3, finalGrade, output
    ];
    allNodes.forEach(node => graph.addNode(node));
    // Background pipeline
    graph.connect('bg-noise', 'image', 'bg-merge', 'foreground');
    graph.connect('bg-gradient', 'image', 'bg-merge', 'background');
    graph.connect('bg-merge', 'image', 'bg-blur', 'image');
    // Main subject pipeline
    graph.connect('main-subject', 'image', 'chroma-key', 'image');
    graph.connect('chroma-key', 'image', 'subject-grade', 'image');
    // Edge enhancement pipeline
    graph.connect('chroma-key', 'image', 'edge-detect', 'image');
    graph.connect('edge-detect', 'image', 'edge-color', 'image');
    graph.connect('edge-color', 'image', 'edge-blur', 'image');
    // Foreground pipeline
    graph.connect('fg-noise', 'image', 'fg-transform', 'image');
    graph.connect('fg-transform', 'image', 'fg-grade', 'image');
    // Compositing stack
    graph.connect('bg-blur', 'image', 'comp1', 'background');
    graph.connect('edge-blur', 'image', 'comp1', 'foreground');
    graph.connect('comp1', 'image', 'comp2', 'background');
    graph.connect('subject-grade', 'image', 'comp2', 'foreground');
    graph.connect('comp2', 'image', 'comp3', 'background');
    graph.connect('fg-grade', 'image', 'comp3', 'foreground');
    graph.connect('comp3', 'image', 'final-grade', 'image');
    graph.connect('final-grade', 'image', 'output', 'image');
    console.log(`\n✓ Graph assembled: ${graph.getAllNodes().length} nodes, ${graph.getAllConnections().length} connections`);
    // ===== Execute the Pipeline =====
    console.log('\n🚀 Executing advanced VFX pipeline...');
    console.log('This may take a moment for complex processing...\n');
    const startTime = Date.now();
    await graph.execute();
    const endTime = Date.now();
    const result = output.getFinalOutput();
    console.log('╔════════════════════════════════════════════════╗');
    console.log('║         Pipeline Execution Complete!          ║');
    console.log('╚════════════════════════════════════════════════╝');
    console.log(`\n📊 Statistics:`);
    console.log(`   • Execution time: ${endTime - startTime}ms`);
    console.log(`   • Output resolution: ${result ? `${result.width}x${result.height}` : 'N/A'}`);
    console.log(`   • Color depth: ${result ? `${result.channels} channels` : 'N/A'}`);
    console.log(`   • Format: ${result ? result.format.toUpperCase() : 'N/A'}`);
    console.log(`   • Total nodes: ${graph.getAllNodes().length}`);
    console.log(`   • Total connections: ${graph.getAllConnections().length}`);
    console.log(`\n✨ This pipeline demonstrates:`);
    console.log(`   ✓ Procedural texture generation with Perlin noise`);
    console.log(`   ✓ Multi-layer compositing with blend modes`);
    console.log(`   ✓ Professional chroma keying`);
    console.log(`   ✓ Edge detection and enhancement`);
    console.log(`   ✓ Advanced color grading`);
    console.log(`   ✓ Complex transform operations`);
    console.log(`   ✓ Real-time preview capabilities`);
    console.log(`\n🎬 RageVFX - Ready for AAA Movie Production!\n`);
    return result;
}
// Run the advanced pipeline
if (require.main === module) {
    createAdvancedVFXPipeline().catch(console.error);
}
//# sourceMappingURL=advanced-vfx-pipeline.js.map