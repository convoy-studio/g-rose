varying vec3 vLightPos;

uniform float roughness; //0.5
uniform float n0; //0.2
uniform vec4 specularColor;

float G1V(float dotNV, float k) {
  return 1.0/(dotNV*(1.0-k)+k);
}

float LightingFuncGGX_REF(vec3 N, vec3 V, vec3 L, float roughness, float F0) {
  float alpha = roughness * roughness;

  //half vector
  vec3 H = normalize(V+L);

  float dotNL = clamp(dot(N,L), 0.0, 1.0);
  float dotNV = clamp(dot(N,V), 0.0, 1.0);
  float dotNH = clamp(dot(N,H), 0.0, 1.0);
  float dotLH = clamp(dot(L,H), 0.0, 1.0);

  float F, D, vis;

  //microfacet model

  // D - microfacet distribution function, shape of specular peak
  float alphaSqr = alpha*alpha;
  float pi = 3.14159;
  float denom = dotNH * dotNH * (alphaSqr-1.0) + 1.0;
  D = alphaSqr/(pi * denom * denom);

  // F - fresnel reflection coefficient
  float dotLH5 = pow(1.0 - dotLH, 5.0);
  F = F0 + (1.0 - F0) * (dotLH5);

  // V / G - geometric attenuation or shadowing factor
  float k = alpha / 2.0;
  vis = G1V(dotNL, k) * G1V(dotNV, k);

  float specular = dotNL * D * F * vis;
  return specular;
}

void main_GGX(in vec3 normalIn, in vec3 positionIn, inout vec4 color) {
  vec3 L = normalize(vLightPos - positionIn); //lightDir
  vec3 V = normalize(-positionIn); //viewDir
  vec3 N = normalize(normalIn); //normal

  float specular = LightingFuncGGX_REF(N, V, L, roughness, n0);

  color.rgb += vec3(specular) * specularColor.rgb;
  //color
}