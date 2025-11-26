/**
 * MotionVectorsNode - Visualize optical flow as motion vectors
 */

import { Node, DataType } from '../core/Node';

export class MotionVectorsNode extends Node {
  constructor(id: string) {
    super(id, 'MotionVectors', 'Motion Vectors');
    this.metadata.category = 'Tracking';
    this.metadata.description = 'Visualize optical flow as motion vectors';
    this.metadata.version = '1.1.0';
    
    this.addInput('opticalFlow', 'Optical Flow', DataType.IMAGE);
    this.addInput('image', 'Background', DataType.IMAGE);
    this.addOutput('image', 'Output', DataType.IMAGE);
    
    this.setParameter('scale', 1.0);
    this.setParameter('gridSize', 16);
    this.setParameter('color', { r: 0, g: 255, b: 0 });
    this.setParameter('thickness', 2);
    this.setParameter('showBackground', true);
  }

  async process(): Promise<void> {
    const opticalFlowInput = this.inputs.get('opticalFlow');
    const imageInput = this.inputs.get('image');
    
    if (!opticalFlowInput?.value) {
      return;
    }

    const flowCanvas = opticalFlowInput.value as HTMLCanvasElement;
    const flowCtx = flowCanvas.getContext('2d');
    if (!flowCtx) return;

    const width = flowCanvas.width;
    const height = flowCanvas.height;
    const scale = this.getParameter('scale');
    const gridSize = this.getParameter('gridSize');
    const color = this.getParameter('color');
    const thickness = this.getParameter('thickness');
    const showBackground = this.getParameter('showBackground');

    // Create output canvas
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    // Draw background if requested
    if (showBackground && imageInput?.value) {
      ctx.drawImage(imageInput.value as HTMLCanvasElement, 0, 0);
    } else {
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, width, height);
    }

    // Draw motion vectors
    const flowData = flowCtx.getImageData(0, 0, width, height);
    
    ctx.strokeStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
    ctx.lineWidth = thickness;

    for (let y = 0; y < height; y += gridSize) {
      for (let x = 0; x < width; x += gridSize) {
        const idx = (y * width + x) * 4;
        const vx = (flowData.data[idx] / 255 - 0.5) * 2 * scale * gridSize;
        const vy = (flowData.data[idx + 1] / 255 - 0.5) * 2 * scale * gridSize;

        // Only draw vectors with significant motion
        if (Math.abs(vx) > 0.1 || Math.abs(vy) > 0.1) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + vx, y + vy);
          ctx.stroke();

          // Draw arrow head
          const angle = Math.atan2(vy, vx);
          const arrowSize = 5;
          ctx.beginPath();
          ctx.moveTo(x + vx, y + vy);
          ctx.lineTo(
            x + vx - arrowSize * Math.cos(angle - Math.PI / 6),
            y + vy - arrowSize * Math.sin(angle - Math.PI / 6)
          );
          ctx.moveTo(x + vx, y + vy);
          ctx.lineTo(
            x + vx - arrowSize * Math.cos(angle + Math.PI / 6),
            y + vy - arrowSize * Math.sin(angle + Math.PI / 6)
          );
          ctx.stroke();
        }
      }
    }

    const output = this.outputs.get('image');
    if (output) {
      output.value = canvas;
    }
  }
}
