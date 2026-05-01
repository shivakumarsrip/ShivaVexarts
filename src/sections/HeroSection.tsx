import { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MapPin, Instagram, ChevronDown } from "lucide-react";

const VERTEX_SHADER = `
attribute vec2 a_pos;
void main() {
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision highp float;
uniform float u_time;
uniform vec2 u_res;
uniform float u_waveSpeed;
uniform float u_lineCount;
uniform vec2 u_mouse;

#define PI 3.14159265359
#define TAU 6.28318530718

float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

vec3 noised(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  vec2 du = 6.0 * f * (1.0 - f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  float val = a + (b - a) * u.x + (c - a) * u.y + (a - b - c + d) * u.x * u.y;
  vec2 deriv = vec2(du.x * ((b - a) + (a - b - c + d) * u.y), du.y * ((c - a) + (a - b - c + d) * u.x));
  return vec3(val, deriv);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  vec2 shift = vec2(100.0);
  for (int i = 0; i < 4; i++) {
    v += a * noised(p).x;
    p = p * 2.0 + shift;
    a *= 0.5;
  }
  return v;
}

vec3 fbmd(vec2 p) {
  float v = 0.0;
  vec2 d = vec2(0.0);
  float a = 0.5;
  vec2 shift = vec2(100.0);
  for (int i = 0; i < 4; i++) {
    vec3 n = noised(p);
    v += a * n.x;
    d += a * n.yz;
    p = p * 2.0 + shift;
    a *= 0.5;
  }
  return vec3(v, d);
}

float ridged(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 3; i++) {
    float n = noised(p).x;
    n = 1.0 - abs(n * 2.0 - 1.0);
    n = n * n;
    v += a * n;
    p = p * 2.0 + vec2(50.0);
    a *= 0.5;
  }
  return v;
}

void hexGrid(vec2 p, out vec2 hexCenter, out float edgeDist) {
  vec2 s = vec2(1.0, 1.7320508);
  vec2 h = s * 0.5;
  vec2 a = mod(p, s) - h;
  vec2 b = mod(p - h, s) - h;
  vec2 g = dot(a, a) < dot(b, b) ? a : b;
  edgeDist = 1.0 - max(abs(g.x) * 2.0 + abs(g.y) * 1.1547, abs(g.y) * 2.3094) * 0.5;
  hexCenter = p - g;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - u_res * 0.5) / min(u_res.x, u_res.y);
  float t = u_time * u_waveSpeed;

  mat2 tiltRot = mat2(1.0, 0.0, 0.0, 1.0);
  if (u_mouse.x > 0.0) {
    vec2 mNorm = (u_mouse - u_res * 0.5) / min(u_res.x, u_res.y);
    float tiltAngle = mNorm.x * 0.4;
    tiltRot = mat2(cos(tiltAngle), -sin(tiltAngle), sin(tiltAngle), cos(tiltAngle));
  }
  uv = tiltRot * uv;

  float scrollAmp = 0.5 + clamp(u_mouse.y / u_res.y, 0.0, 1.0) * 0.5;
  vec2 p = uv * (6.0 + u_lineCount * 4.0);

  vec2 hexCenter;
  float edgeDist;
  hexGrid(p, hexCenter, edgeDist);

  float n1 = fbm(hexCenter * 0.08 + vec2(t * 0.15, t * 0.12));
  float n2 = vnoise(hexCenter * 0.15 + vec2(-t * 0.08, t * 0.18));
  float n3 = fbm(hexCenter * 0.25 + vec2(t * 0.22, -t * 0.1)) * 0.6;
  float wave = (n1 * 0.5 + n2 * 0.3 + n3 * 0.2) * scrollAmp;

  float hexDist = edgeDist * (0.5 + 0.5 * ridged(hexCenter * 0.1 + t * 0.05));
  float att = 0.2 + 0.8 * smoothstep(0.7, 0.0, hexDist);
  float phase = floor(wave * 7.0) / 7.0;
  float lineField = smoothstep(0.3, 0.35, abs(fract(wave * 7.0) - 0.5) * 2.0);

  vec3 col = vec3(0.55, 0.35, 0.0) + vec3(0.25, 0.15, 0.02) * phase + vec3(0.08) * n2;
  col *= lineField * att;
  col += vec3(0.025, 0.02, 0.01) * smoothstep(0.12, 0.0, hexDist) * (0.5 + 0.5 * n1);

  float dof = smoothstep(0.02, 0.35, abs(fbm(uv * 2.0) * 2.0 - 1.0));
  col *= 0.6 + 0.4 * smoothstep(0.65, 0.25, length(uv));
  float brightness = dot(col, vec3(0.3, 0.5, 0.2));
  col += vec3(0.012, 0.008, 0.003) * (hash(gl_FragCoord.xy + fract(u_time * 37.0) * 1000.0) - 0.5);
  col = mix(vec3(0.035, 0.025, 0.015) * (1.0 - length(uv) * 0.3), col, brightness);

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;

export default function HeroSection() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const gl = canvas.getContext("webgl", { alpha: false, antialias: false });
    if (!gl) return;

    // Compile shaders
    function createShader(type: number, source: string) {
      const shader = gl!.createShader(type)!;
      gl!.shaderSource(shader, source);
      gl!.compileShader(shader);
      if (!gl!.getShaderParameter(shader, gl!.COMPILE_STATUS)) {
        console.error(gl!.getShaderInfoLog(shader));
        gl!.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vertShader = createShader(gl.VERTEX_SHADER, VERTEX_SHADER);
    const fragShader = createShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vertShader || !fragShader) return;

    const program = gl.createProgram()!;
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    // Fullscreen triangle
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

    const aPos = gl.getAttribLocation(program, "a_pos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    // Uniforms
    const uTime = gl.getUniformLocation(program, "u_time");
    const uRes = gl.getUniformLocation(program, "u_res");
    const uWaveSpeed = gl.getUniformLocation(program, "u_waveSpeed");
    const uLineCount = gl.getUniformLocation(program, "u_lineCount");
    const uMouse = gl.getUniformLocation(program, "u_mouse");

    gl.uniform1f(uWaveSpeed, 0.3);
    gl.uniform1f(uLineCount, 15.0);

    // Resize
    function resize() {
      const w = canvas!.clientWidth;
      const h = canvas!.clientHeight;
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      gl!.viewport(0, 0, canvas!.width, canvas!.height);
      gl!.uniform2f(uRes, canvas!.width, canvas!.height);
    }

    resize();
    window.addEventListener("resize", resize);

    // Mouse
    const handleMouse = (e: MouseEvent) => {
      const rect = canvas!.getBoundingClientRect();
      mouseRef.current.x = (e.clientX - rect.left) * dpr;
      mouseRef.current.y = (rect.height - (e.clientY - rect.top)) * dpr;
    };
    window.addEventListener("mousemove", handleMouse);

    // Animation loop
    let raf: number;
    function render() {
      gl!.uniform1f(uTime, performance.now() * 0.001);
      gl!.uniform2f(uMouse, mouseRef.current.x, mouseRef.current.y);
      gl!.drawArrays(gl!.TRIANGLES, 0, 3);
      raf = requestAnimationFrame(render);
    }
    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouse);
    };
  }, []);

  const scrollToGallery = () => {
    const el = document.querySelector("#gallery");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden">
      {/* WebGL Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ zIndex: 0 }}
      />

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
        <h1 className="font-display text-[40px] sm:text-[56px] md:text-[72px] text-white uppercase tracking-[0.05em] leading-none mb-4">
          SHIVAKUMAR S
        </h1>
        <p className="font-body text-[16px] sm:text-[18px] text-[#A1A1AA] mb-4">
          Vector Artist &amp; Movie Publicity Designer
        </p>

        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 border border-[#F59E0B] rounded-full mb-8">
          <MapPin size={14} className="text-[#F59E0B]" />
          <span className="font-body text-[13px] font-medium text-[#F59E0B]">
            Hyderabad, India
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
          <Button
            onClick={scrollToGallery}
            className="bg-[#F59E0B] text-[#09090B] hover:bg-[#D97706] font-body font-semibold rounded-lg px-6 py-3 text-[14px]"
          >
            Explore Gallery
          </Button>
          <Button
            variant="outline"
            onClick={() => window.open("https://www.instagram.com/shiva_vexarts", "_blank")}
            className="bg-transparent text-white border-white hover:bg-white hover:text-[#09090B] font-body font-semibold rounded-lg px-6 py-3 text-[14px]"
          >
            <Instagram size={16} className="mr-2" />
            View on Instagram
          </Button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-[#27272A] bg-[#09090B]/50 backdrop-blur-sm">
        <div className="container-vex py-4 sm:py-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8">
            {[
              { value: "107+", label: "Artworks" },
              { value: "1,482", label: "Followers" },
              { value: "387K+", label: "Views" },
              { value: "OPEN", label: "Orders" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="font-display text-[24px] sm:text-[32px] text-[#F59E0B]">{stat.value}</p>
                <p className="font-body text-[11px] sm:text-[13px] text-[#A1A1AA] uppercase tracking-wider">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <button
        onClick={scrollToGallery}
        className="absolute bottom-24 left-1/2 -translate-x-1/2 text-[#A1A1AA] hover:text-[#F59E0B] transition-colors animate-bounce"
      >
        <ChevronDown size={24} />
      </button>
    </section>
  );
}
