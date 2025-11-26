/**
 * ParticleEmitterNode - Control particle emission
 */

import { Node, DataType } from '../core/Node';

export class ParticleEmitterNode extends Node {
  constructor(id: string) {
    super(id, 'ParticleEmitter', 'Particle Emitter');
    this.metadata.category = 'Particles';
    this.metadata.description = 'Control particle emission properties';
    this.metadata.version = '1.1.0';
    
    this.addOutput('emitter', 'Emitter', DataType.VECTOR);
    
    this.setParameter('position', { x: 0, y: 0 });
    this.setParameter('shape', 'point'); // point, circle, rectangle, line
    this.setParameter('radius', 50);
    this.setParameter('width', 100);
    this.setParameter('height', 100);
    this.setParameter('angle', 0);
    this.setParameter('spread', 360);
  }

  async process(): Promise<void> {
    const position = this.getParameter('position');
    const shape = this.getParameter('shape');
    const radius = this.getParameter('radius');
    const width = this.getParameter('width');
    const height = this.getParameter('height');
    const angle = this.getParameter('angle');
    const spread = this.getParameter('spread');

    const emitterData = {
      position,
      shape,
      radius,
      width,
      height,
      angle,
      spread
    };

    const output = this.outputs.get('emitter');
    if (output) {
      output.value = emitterData;
    }
  }
}
