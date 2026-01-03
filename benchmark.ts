/**
 * RageVFX Performance Benchmark
 * Measures execution time for various node configurations
 * with and without parallel execution enabled.
 */

import { RageVFXApp } from './src/core/RageVFXApp';
import { DataType } from './src/core/Node';

async function runBenchmark() {
    console.log('--- RageVFX Performance Benchmark ---');
    const app = new RageVFXApp();
    const graph = app.getGraph();

    // Setup a benchmark scene: Input -> 5x Blur -> Output
    // This creates a chain of heavy operations
    app.createNode('ImageInput', 'input1');
    app.createNode('Blur', 'blur1');
    app.createNode('Blur', 'blur2');
    app.createNode('Blur', 'blur3');
    app.createNode('Blur', 'blur4');
    app.createNode('Blur', 'blur5');
    app.createNode('Output', 'output1');

    app.connectNodes('input1', 'image', 'blur1', 'image');
    app.connectNodes('blur1', 'image', 'blur2', 'image');
    app.connectNodes('blur2', 'image', 'blur3', 'image');
    app.connectNodes('blur3', 'image', 'blur4', 'image');
    app.connectNodes('blur4', 'image', 'blur5', 'image');
    app.connectNodes('blur5', 'image', 'output1', 'image');

    // Mock 8K input data
    const width = 7680;
    const height = 4320;
    const mockData = new Uint8Array(width * height * 4);
    const inputNode = graph.getNode('input1');
    if (inputNode) {
        inputNode.setInput('image', {
            width,
            height,
            channels: 4,
            data: mockData,
            format: 'rgba8'
        });
    }

    // Test 1: Sequential Execution
    console.log('\nRunning Sequential Execution (Baseline)...');
    graph.setParallelExecution(false);
    const startSeq = performance.now();
    await graph.execute();
    const endSeq = performance.now();
    console.log(`Sequential execution time: ${(endSeq - startSeq).toFixed(2)}ms`);

    // Reset dirty flags for re-execution
    graph.getAllNodes().forEach(n => n.markDirty());

    // Test 2: Parallel Execution (Worker Pool)
    console.log('\nRunning Parallel Execution (Web Workers)...');
    graph.setParallelExecution(true);
    const startPar = performance.now();
    await graph.execute();
    const endPar = performance.now();
    console.log(`Parallel execution time: ${(endPar - startPar).toFixed(2)}ms`);

    const speedup = (endSeq - startSeq) / (endPar - startPar);
    console.log(`\nSpeedup factor: ${speedup.toFixed(2)}x`);

    // Test 3: Memory Statistics
    const memStats = app.getMemoryManager().getStats();
    console.log('\nMemory Manager Statistics:');
    console.log(`- Peak Cache Usage: ${(memStats.peakUsage / 1024 / 1024).toFixed(2)} MB`);
    console.log(`- Cache Hit Rate: ${(memStats.hitRate * 100).toFixed(2)}%`);
    console.log(`- Total Evictions: ${memStats.evictions}`);

    console.log('\n--- Benchmark Complete ---');
    app.dispose();
}

runBenchmark().catch(console.error);
