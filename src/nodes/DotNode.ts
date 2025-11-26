/**
 * DotNode - Connection routing node (passthrough)
 */

import { Node, DataType } from '../core/Node';

export class DotNode extends Node {
  constructor(id: string) {
    super(id, 'Dot', 'Dot');
    this.metadata.category = 'Utility';
    this.metadata.description = 'Route connections for cleaner graph layout';
    
    this.addInput('input', 'Input', DataType.ANY);
    this.addOutput('output', 'Output', DataType.ANY);
  }

  async process(): Promise<void> {
    const input = this.inputs.get('input');
    const output = this.outputs.get('output');
    
    if (output) {
      output.value = input?.value ?? null;
    }
  }
}
