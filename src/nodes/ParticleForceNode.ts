/**
 * ParticleForceNode - Apply physics forces to particles
 */

import { Node, DataType } from '../core/Node';

export class ParticleForceNode extends Node {
  constructor(id: string) {
    super(id, 'ParticleForce', 'Particle Force');
    this.metadata.category = 'Particles';
    this.metadata.description = 'Apply physics forces to particles';
    this.metadata.version = '1.1.0';
    
    this.addOutput('force', 'Force', DataType.PARTICLES);
    
    this.setParameter('type', 'gravity'); // gravity, wind, vortex, turbulence, drag
    this.setParameter('strength', 100);
    this.setParameter('direction', { x: 0, y: 1 });
    this.setParameter('center', { x: 0, y: 0 });
    this.setParameter('radius', 100);
    this.setParameter('falloff', 1.0);
  }

  async process(): Promise<void> {
    const type = this.getParameter('type');
    const strength = this.getParameter('strength');
    const direction = this.getParameter('direction');
    const center = this.getParameter('center');
    const radius = this.getParameter('radius');
    const falloff = this.getParameter('falloff');

    const forceData = {
      type,
      strength,
      direction,
      center,
      radius,
      falloff
    };

    const output = this.outputs.get('force');
    if (output) {
      output.value = forceData;
    }
  }
}
