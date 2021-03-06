//based on http://blenderartists.org/forum/showthread.php?184102-nicer-and-faster-SSAO and http://www.pasteall.org/12299
#ifdef VERT

attribute vec2 position;
attribute vec2 texCoord;

varying vec2 vTexCoord;

void main() {
  gl_Position = vec4(position, 0.0, 1.0);
  vTexCoord = texCoord;
}

#endif

#ifdef FRAG

#define PI    3.14159265

varying vec2 vTexCoord;

uniform sampler2D depthMap;
uniform vec2 textureSize;
uniform float near;
uniform float far;

const int samples = 3;
const int rings = 5;

uniform float strength;
uniform float cutoutBg;

vec2 rand(vec2 coord) {
  float noiseX = (fract(sin(dot(coord, vec2(12.9898,78.233))) * 43758.5453));
  float noiseY = (fract(sin(dot(coord, vec2(12.9898,78.233) * 2.0)) * 43758.5453));
  return vec2(noiseX,noiseY) * 0.004;
}

float compareDepths( in float depth1, in float depth2 )
{
  float aoCap = 1.0;
  float aoMultiplier = 100.0;
  float depthTolerance = 0.0001;
  float aorange = 2.0;// units in space the AO effect extends to (this gets divided by the camera far range
  float diff = sqrt(clamp(1.0-(depth1-depth2) / (aorange/(far-near)),0.0,1.0));
  float ao = min(aoCap, max(0.0, depth1-depth2-depthTolerance) * aoMultiplier) * diff;
  //if (diff > depthTolerance * 5000) return 0;
  return ao * strength;
}

//from depth buf normalized z to linear (eye space) z
//http://stackoverflow.com/questions/6652253/getting-the-true-z-value-from-the-depth-buffer
float ndcDepthToEyeSpace(float ndcDepth, float near, float far) {
  return 2.0 * near * far / (far + near - ndcDepth * (far - near));
}

//fron depth buf normalized z to linear (eye space) z
//http://stackoverflow.com/questions/6652253/getting-the-true-z-value-from-the-depth-buffer
float readDepth(sampler2D depthMap, vec2 coord, float near, float far) {
  float z_b = texture2D(depthMap, coord).r;
  float z_n = 2.0 * z_b - 1.0;
  return ndcDepthToEyeSpace(z_n, near, far);
}

void main() {
  vec2 texCoord = vec2(gl_FragCoord.x / textureSize.x, gl_FragCoord.y / textureSize.y);
  float depth = readDepth(depthMap, texCoord, near, far)/far;

  float d;

  float aspect = textureSize.x / textureSize.y;
  vec2 noise = rand(vTexCoord);

  float w = (1.0 / textureSize.x)/clamp(depth,0.05,1.0)+(noise.x*(1.0-noise.x));
  float h = (1.0 / textureSize.y)/clamp(depth,0.05,1.0)+(noise.y*(1.0-noise.y));

  float pw;
  float ph;

  float ao = 0.0;
  float s = 0.0;
  float fade = 4.0;

  for (int i = 0 ; i < rings; i += 1)
  {
    fade *= 0.5;
    for (int j = 0 ; j < samples*rings; j += 1)
    {
      if (j >= samples*i) break;
      float step = PI * 2.0 / (float(samples) * float(i));
      pw = (cos(float(j)*step) * float(i) * 0.5);
      ph = (sin(float(j)*step) * float(i) * 0.5) * aspect;
      d = readDepth(depthMap, vec2(texCoord.s + pw * w,texCoord.t + ph * h), near, far)/far;
      ao += compareDepths(depth, d) * fade;
      s += 1.0 * fade;
    }
  }

  ao /= s;
  ao *= 1.5;
  ao = 1.0 - ao;

  if (depth > 0.99) ao += 0.5;

  vec3 black = vec3(0.0, 0.0, 0.0);
  vec3 treshold = vec3(0.2, 0.2, 0.2);

  gl_FragColor = vec4(texCoord, 0.0, 1.0);
  //gl_FragColor = vec4(getDepth(texCoord), 0.0, 0.0, 1.0);
  gl_FragColor = vec4(ao, ao, ao, 1.0);

  if (depth*cutoutBg > 0.5) gl_FragColor = vec4(0.0);
}

#endif