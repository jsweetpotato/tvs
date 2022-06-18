uniform float time;
uniform float progress;
uniform float offset;
uniform sampler2D texture;
uniform vec4 resolution;
uniform bool isVideo;

varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vNormal;

vec3 rgbShift(sampler2D textureimage, vec2 uv, vec2 offset ){
    float r = texture2D(textureimage, uv + offset).r;
    vec2 gb = texture2D(textureimage, uv).gb;
    return  vec3(r, gb);
}

void main(){
  vec2 st = gl_FragCoord.xy/resolution.xy;
  st.x *= resolution.x/resolution.y;

  vec4 cam = texture2D( texture, vUv );

  vec3 color = vec3(0.);
  color = abs(sin(vec3(1.0)*time*0.001)*progress);
 
  // if(isVideo) color = vec3(cam.r, cam.g, cam.b);
  if(isVideo) color = rgbShift(texture, vUv, vec2(offset,0.));

  gl_FragColor =  vec4(color,1.0);
}
