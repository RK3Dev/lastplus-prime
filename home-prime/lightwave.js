(() => {
  const VS = "attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0.,1.);}";
  const FS = `
precision highp float;
varying vec2 v;
uniform vec2 uSize, uO;
uniform float uR, uW, uRing, uVeil, uRim, uT, uCorner, uLight, uSeed;
float h21(vec2 p){ p = fract(p * vec2(233.34, 851.73)); p += dot(p, p + 23.45); return fract(p.x * p.y); }
float n2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
float fbm(vec2 p){ return .6 * n2(p) + .28 * n2(p * 2.07 + 7.3) + .12 * n2(p * 4.31 + 3.1); }
const vec3 BLUE = vec3(.671, .624, .949);
const vec3 SKY = vec3(.769, .733, .969);
const vec3 PALE = vec3(.894, .875, .984);
const vec3 WHITE = vec3(.965, .961, .984);
const vec3 MIST = vec3(.612, .576, .788);
const vec3 CREAM = vec3(.925, .906, .973);
const vec3 DEEP = vec3(.235, .176, .620);
const vec3 NAVYL = vec3(.384, .294, .906);
const vec3 INK = vec3(.016, .024, .047);
float sdBox(vec2 p, vec2 b, float r){ vec2 q = abs(p) - b + r; return length(max(q, 0.)) + min(max(q.x, q.y), 0.) - r; }
void main(){
  vec2 px = vec2(v.x, 1. - v.y) * uSize;
  vec2 d = px - uO;
  float dist = length(d);
  float ang = atan(d.y, d.x);
  float wob = .55 * sin(ang * 2. + uT * .8 + uSeed * 6.) + .35 * sin(ang * 3. - uT * 1. + uSeed * 3.) + .2 * sin(ang * 5. + uT * 1.4 + uSeed * 9.);
  float cloud = fbm(px / 95. + vec2(uT * .25, -uT * .18) + uSeed * 17.) - .5;
  float R = uR * (1. + .11 * wob) + cloud * uW * .75;
  float wv = uW * (1. + .5 * (.5 + .5 * sin(ang * 3. + uSeed * 5. + uT * .9)));
  float x = (dist - R) / wv;

  float patch = .45 + .55 * (.5 + .5 * sin(ang * 2. + uSeed * 7. - uT * 1.1)) * (.65 + .35 * sin(ang * 5. + uSeed * 2. + uT * 1.9));
  float ahead = x > 0. ? exp(-x * x * .42) : exp(-x * x * 1.5);
  float core = exp(-x * x * 2.2) * .45;
  float haze = x < 0. ? exp(-x * x * .32) : 0.;
  vec3 glow = mix(BLUE, SKY, .5 + .5 * sin(ang * 2. + uSeed * 3. + uT * .5));
  glow = mix(glow, MIST, .32 * (.5 + .5 * cos(ang + uSeed * 5.)));
  glow = mix(glow, CREAM, .6 * smoothstep(.3, 1., sin(ang + uSeed * 6.2832)));
  vec3 bright = mix(glow, PALE, .5);
  vec3 hz = mix(DEEP, vec3(.310, .235, .780), .5 + .5 * sin(ang * 2. + uSeed * 4. + uT * .6));
  if (uLight > .5) { glow = pow(glow, vec3(1.6)); bright = pow(bright, vec3(1.5)); hz = PALE; }
  float aW = ahead * .66 * patch * uRing, aC = core * .75 * patch * uRing, aH = haze * .36 * uRing;
  vec3 L = glow * aW + bright * aC + hz * aH;
  float A = min(aW + aC + aH, 1.);

  vec2 id = floor(px / 10.);
  float hh = h21(id + uSeed * 7.);
  vec2 sp = (id + .5 + (vec2(h21(id + 3.1), h21(id + 8.7)) - .5) * .7) * 10.;
  float tw = .45 + .55 * sin(uT * 5. + hh * 50.);
  float zone = x < 0. ? exp(x * .55) : exp(-x * x * 2.);
  float spk = step(.89, hh) * smoothstep(1.3, .25, length(px - sp)) * tw * zone * uRing * .85;
  L += (uLight > .5 ? NAVYL : vec3(.93, .91, 1.)) * spk;
  A += spk;

  vec2 c = uSize * .5;
  float e = max(-sdBox(px - c, c, uCorner), 0.);
  float rimA = (exp(-e / 8.) * .72 + exp(-e / 26.) * .34) * uRim * smoothstep(.4, -1.4, x);
  float ra = atan(px.y - c.y, px.x - c.x);
  vec3 rc = mix(BLUE, PALE, .5 + .5 * sin(ra * 2. + uSeed * 4. + uT * .6));
  rc = mix(rc, CREAM, .55 * smoothstep(.4, 1., sin(ra + uSeed * 6.2832 + 2.)));
  if (uLight > .5) rc = pow(rc, vec3(1.6));
  L += rc * rimA;
  A += rimA;
  if (A > 1.) { L /= A; A = 1.; }

  float behind = max(0., uR - dist);
  float veil = smoothstep(.2, -.9, x) * exp(-behind / (uSize.y * .5)) * uVeil * (uLight > .5 ? .35 : .4);
  vec3 vc = uLight > .5 ? vec3(1.) : INK;
  gl_FragColor = vec4(L + vc * veil * (1. - A), A + veil * (1. - A));
}`;

  window.LightWave = {
    create(canvas) {
      let gl = null;
      try { gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, powerPreference: "low-power" }); } catch (e) { gl = null; }
      if (!gl) return null;
      const sh = (type, src) => {
        const s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn("LightWave:", gl.getShaderInfoLog(s)); return null; }
        return s;
      };
      const vs = sh(gl.VERTEX_SHADER, VS), fs = sh(gl.FRAGMENT_SHADER, FS);
      if (!vs || !fs) return null;
      const pr = gl.createProgram();
      gl.attachShader(pr, vs);
      gl.attachShader(pr, fs);
      gl.linkProgram(pr);
      if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { console.warn("LightWave:", gl.getProgramInfoLog(pr)); return null; }
      gl.useProgram(pr);
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      const at = gl.getAttribLocation(pr, "p");
      gl.enableVertexAttribArray(at);
      gl.vertexAttribPointer(at, 2, gl.FLOAT, false, 0, 0);
      const U = {};
      ["uSize", "uO", "uR", "uW", "uRing", "uVeil", "uRim", "uT", "uCorner", "uLight", "uSeed"].forEach((n) => { U[n] = gl.getUniformLocation(pr, n); });
      let lost = false;
      canvas.addEventListener("webglcontextlost", (e) => { e.preventDefault(); lost = true; });
      let w = 1, h = 1;
      const api = {
        get lost() { return lost; },
        size(cw, ch, dpr) {
          const W = Math.max(1, Math.round(cw * dpr)), H = Math.max(1, Math.round(ch * dpr));
          if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
          gl.viewport(0, 0, W, H);
          w = cw; h = ch;
        },
        draw(f) {
          if (lost) return;
          gl.uniform2f(U.uSize, w, h);
          gl.uniform2f(U.uO, f.ox, f.oy);
          gl.uniform1f(U.uR, f.r);
          gl.uniform1f(U.uW, f.w);
          gl.uniform1f(U.uRing, f.ring);
          gl.uniform1f(U.uVeil, f.veil);
          gl.uniform1f(U.uRim, f.rim);
          gl.uniform1f(U.uT, f.t);
          gl.uniform1f(U.uCorner, f.corner);
          gl.uniform1f(U.uLight, f.light ? 1 : 0);
          gl.uniform1f(U.uSeed, f.seed);
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        },
        clear() {
          if (lost) return;
          gl.clearColor(0, 0, 0, 0);
          gl.clear(gl.COLOR_BUFFER_BIT);
        },
      };
      return api;
    },
  };
})();
