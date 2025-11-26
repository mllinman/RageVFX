/**
 * ShaderLibrary - Collection of GPU shaders for image processing and effects
 */

export class ShaderLibrary {
  /**
   * Basic vertex shader for full-screen quad
   */
  static readonly VERTEX_SHADER = `#version 300 es
    in vec2 position;
    out vec2 vUv;
    
    void main() {
      vUv = position * 0.5 + 0.5;
      gl_Position = vec4(position, 0.0, 1.0);
    }
  `;

  /**
   * Pass-through fragment shader
   */
  static readonly PASSTHROUGH_SHADER = `#version 300 es
    precision highp float;
    
    in vec2 vUv;
    out vec4 fragColor;
    uniform sampler2D inputTexture;
    
    void main() {
      fragColor = texture(inputTexture, vUv);
    }
  `;

  /**
   * Blur shader
   */
  static readonly BLUR_SHADER = `#version 300 es
    precision highp float;
    
    in vec2 vUv;
    out vec4 fragColor;
    uniform sampler2D inputTexture;
    uniform vec2 resolution;
    uniform float blurAmount;
    
    void main() {
      vec2 texelSize = 1.0 / resolution;
      vec4 result = vec4(0.0);
      float total = 0.0;
      
      for(float x = -4.0; x <= 4.0; x++) {
        for(float y = -4.0; y <= 4.0; y++) {
          vec2 offset = vec2(x, y) * texelSize * blurAmount;
          float weight = exp(-(x*x + y*y) / 8.0);
          result += texture(inputTexture, vUv + offset) * weight;
          total += weight;
        }
      }
      
      fragColor = result / total;
    }
  `;

  /**
   * Color correction shader
   */
  static readonly COLOR_CORRECT_SHADER = `#version 300 es
    precision highp float;
    
    in vec2 vUv;
    out vec4 fragColor;
    uniform sampler2D inputTexture;
    uniform float brightness;
    uniform float contrast;
    uniform float saturation;
    uniform vec3 colorTint;
    
    vec3 adjustContrast(vec3 color, float contrast) {
      return (color - 0.5) * contrast + 0.5;
    }
    
    vec3 adjustSaturation(vec3 color, float saturation) {
      float gray = dot(color, vec3(0.299, 0.587, 0.114));
      return mix(vec3(gray), color, saturation);
    }
    
    void main() {
      vec4 color = texture(inputTexture, vUv);
      
      // Apply brightness
      color.rgb += brightness;
      
      // Apply contrast
      color.rgb = adjustContrast(color.rgb, contrast);
      
      // Apply saturation
      color.rgb = adjustSaturation(color.rgb, saturation);
      
      // Apply color tint
      color.rgb *= colorTint;
      
      fragColor = color;
    }
  `;

  /**
   * Compositing shader (over operation)
   */
  static readonly COMPOSITE_SHADER = `#version 300 es
    precision highp float;
    
    in vec2 vUv;
    out vec4 fragColor;
    uniform sampler2D foreground;
    uniform sampler2D background;
    uniform float opacity;
    
    void main() {
      vec4 fg = texture(foreground, vUv);
      vec4 bg = texture(background, vUv);
      
      fg.a *= opacity;
      
      // Over compositing operation
      vec3 result = fg.rgb + bg.rgb * (1.0 - fg.a);
      float alpha = fg.a + bg.a * (1.0 - fg.a);
      
      fragColor = vec4(result, alpha);
    }
  `;

  /**
   * Transform shader
   */
  static readonly TRANSFORM_SHADER = `#version 300 es
    precision highp float;
    
    in vec2 vUv;
    out vec4 fragColor;
    uniform sampler2D inputTexture;
    uniform mat3 transformMatrix;
    
    void main() {
      vec3 transformed = transformMatrix * vec3(vUv, 1.0);
      vec2 newUv = transformed.xy / transformed.z;
      
      if(newUv.x < 0.0 || newUv.x > 1.0 || newUv.y < 0.0 || newUv.y > 1.0) {
        fragColor = vec4(0.0);
      } else {
        fragColor = texture(inputTexture, newUv);
      }
    }
  `;

  /**
   * Edge detection shader
   */
  static readonly EDGE_DETECT_SHADER = `#version 300 es
    precision highp float;
    
    in vec2 vUv;
    out vec4 fragColor;
    uniform sampler2D inputTexture;
    uniform vec2 resolution;
    
    void main() {
      vec2 texelSize = 1.0 / resolution;
      
      // Sobel operator
      float tl = texture(inputTexture, vUv + vec2(-1.0, -1.0) * texelSize).r;
      float t  = texture(inputTexture, vUv + vec2( 0.0, -1.0) * texelSize).r;
      float tr = texture(inputTexture, vUv + vec2( 1.0, -1.0) * texelSize).r;
      float l  = texture(inputTexture, vUv + vec2(-1.0,  0.0) * texelSize).r;
      float r  = texture(inputTexture, vUv + vec2( 1.0,  0.0) * texelSize).r;
      float bl = texture(inputTexture, vUv + vec2(-1.0,  1.0) * texelSize).r;
      float b  = texture(inputTexture, vUv + vec2( 0.0,  1.0) * texelSize).r;
      float br = texture(inputTexture, vUv + vec2( 1.0,  1.0) * texelSize).r;
      
      float gx = -tl - 2.0*l - bl + tr + 2.0*r + br;
      float gy = -tl - 2.0*t - tr + bl + 2.0*b + br;
      
      float edge = sqrt(gx*gx + gy*gy);
      
      fragColor = vec4(vec3(edge), 1.0);
    }
  `;
}
