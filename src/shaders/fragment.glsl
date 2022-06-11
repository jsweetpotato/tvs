uniform float time;
uniform float progress;
uniform sampler2D texture;
uniform vec4 resolution;

varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vNormal;

void main(){
  vec2 st = gl_FragCoord.xy/resolution.xy;
  st.x *= resolution.x/resolution.y;

  vec3 color = abs(sin(vec3(1.0)*time*0.001));

  gl_FragColor =  vec4(color,1.0);
}
