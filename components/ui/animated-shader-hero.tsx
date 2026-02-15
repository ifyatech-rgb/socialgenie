"use client";

import React, { useRef, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const defaultShaderSource = `#version 300 es
precision highp float;
out vec4 O;
uniform vec2 resolution;
uniform float time;
#define FC gl_FragCoord.xy
#define T time
#define R resolution
#define MN min(R.x,R.y)
float rnd(vec2 p) {
  p=fract(p*vec2(12.9898,78.233));
  p+=dot(p,p+34.56);
  return fract(p.x*p.y);
}
float noise(in vec2 p) {
  vec2 i=floor(p), f=fract(p), u=f*f*(3.-2.*f);
  float a=rnd(i), b=rnd(i+vec2(1,0)), c=rnd(i+vec2(0,1)), d=rnd(i+1.);
  return mix(mix(a,b,u.x),mix(c,d,u.x),u.y);
}
float fbm(vec2 p) {
  float t=.0, a=1.; mat2 m=mat2(1.,-.5,.2,1.2);
  for (int i=0; i<5; i++) {
    t+=a*noise(p);
    p*=2.*m;
    a*=.5;
  }
  return t;
}
float clouds(vec2 p) {
  float d=1., t=.0;
  for (float i=.0; i<3.; i++) {
    float a=d*fbm(i*10.+p.x*.2+.2*(1.+i)*p.y+d+i*i+p);
    t=mix(t,d,a);
    d=a;
    p*=2./(i+1.);
  }
  return t;
}
void main(void) {
  vec2 uv=(FC-.5*R)/MN,st=uv*vec2(2,1);
  vec3 col=vec3(0);
  float bg=clouds(vec2(st.x+T*.5,-st.y));
  uv*=1.-.3*(sin(T*.2)*.5+.5);
  for (float i=1.; i<12.; i++) {
    uv+=.1*cos(i*vec2(.1+.01*i, .8)+i*i+T*.5+.1*uv.x);
    vec2 p=uv;
    float d=length(p);
    col+=.00125/d*(cos(sin(i)*vec3(1,2,3))+1.);
    float b=noise(i+p+bg*1.731);
    col+=.002*b/length(max(p,vec2(b*p.x*.02,p.y)));
    col=mix(col,vec3(bg*.55,bg*.35,bg*.85),d);
  }
  O=vec4(col*vec3(0.7,0.4,1.0),1);
}`;

export interface HeroProps {
  trustBadge?: {
    text: string;
    icons?: string[];
  };
  headline: {
    line1: string;
    line2: string;
  };
  subtitle: string;
  buttons?: {
    primary?: {
      text: string;
      href?: string;
      onClick?: () => void;
    };
    secondary?: {
      text: string;
      href?: string;
      onClick?: () => void;
    };
  };
  className?: string;
}

class WebGLRenderer {
  canvas: HTMLCanvasElement;
  scale: number;
  gl: WebGL2RenderingContext;
  program: WebGLProgram | null = null;
  vs: WebGLShader | null = null;
  fs: WebGLShader | null = null;
  buffer: WebGLBuffer | null = null;
  shaderSource: string;
  mouseMove: [number, number];
  mouseCoords: [number, number];
  pointerCoords: number[];
  nbrOfPointers: number;
  vertexSrc: string;
  vertices: number[];

  constructor(canvas: HTMLCanvasElement, scale: number) {
    this.canvas = canvas;
    this.scale = scale;
    const ctx = canvas.getContext("webgl2");
    if (!ctx) throw new Error("WebGL2 not supported");
    this.gl = ctx;
    this.gl.viewport(0, 0, canvas.width * scale, canvas.height * scale);
    this.shaderSource = defaultShaderSource;
    this.mouseMove = [0, 0];
    this.mouseCoords = [0, 0];
    this.pointerCoords = [0, 0];
    this.nbrOfPointers = 0;
    this.vertexSrc = `#version 300 es
precision highp float;
in vec4 position;
void main(){gl_Position=position;}`;
    this.vertices = [-1, 1, -1, -1, 1, 1, 1, -1];
  }

  updateMove(deltas: [number, number]) {
    this.mouseMove = deltas;
  }
  updateMouse(coords: [number, number]) {
    this.mouseCoords = coords;
  }
  updatePointerCoords(coords: number[]) {
    this.pointerCoords = coords;
  }
  updatePointerCount(nbr: number) {
    this.nbrOfPointers = nbr;
  }
  updateScale(scale: number) {
    this.scale = scale;
    this.gl.viewport(
      0,
      0,
      this.canvas.width * scale,
      this.canvas.height * scale
    );
  }

  compile(shader: WebGLShader, source: string) {
    const gl = this.gl;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error("Shader compilation error:", gl.getShaderInfoLog(shader));
    }
  }

  reset() {
    const gl = this.gl;
    if (
      this.program &&
      !gl.getProgramParameter(this.program, gl.DELETE_STATUS)
    ) {
      if (this.vs) {
        gl.detachShader(this.program, this.vs);
        gl.deleteShader(this.vs);
      }
      if (this.fs) {
        gl.detachShader(this.program, this.fs);
        gl.deleteShader(this.fs);
      }
      gl.deleteProgram(this.program);
    }
  }

  setup() {
    const gl = this.gl;
    this.vs = gl.createShader(gl.VERTEX_SHADER)!;
    this.fs = gl.createShader(gl.FRAGMENT_SHADER)!;
    this.compile(this.vs, this.vertexSrc);
    this.compile(this.fs, this.shaderSource);
    this.program = gl.createProgram()!;
    gl.attachShader(this.program, this.vs);
    gl.attachShader(this.program, this.fs);
    gl.linkProgram(this.program);
    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(this.program));
    }
  }

  init() {
    const gl = this.gl;
    const program = this.program!;
    this.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(this.vertices),
      gl.STATIC_DRAW
    );
    const position = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const prog = program as unknown as Record<string, WebGLUniformLocation | null>;
    prog.resolution = gl.getUniformLocation(program, "resolution");
    prog.time = gl.getUniformLocation(program, "time");
    prog.move = gl.getUniformLocation(program, "move");
    prog.touch = gl.getUniformLocation(program, "touch");
    prog.pointerCount = gl.getUniformLocation(program, "pointerCount");
    prog.pointers = gl.getUniformLocation(program, "pointers");
  }

  render(now = 0) {
    const gl = this.gl;
    const program = this.program!;
    if (!program || gl.getProgramParameter(program, gl.DELETE_STATUS)) return;
    gl.clearColor(0.07, 0.03, 0.12, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    const p = program as unknown as Record<string, WebGLUniformLocation | null>;
    if (!p.resolution || !p.time || !p.move || !p.touch || !p.pointerCount || !p.pointers) return;
    gl.uniform2f(p.resolution, this.canvas.width, this.canvas.height);
    gl.uniform1f(p.time, now * 1e-3);
    gl.uniform2f(p.move, ...this.mouseMove);
    gl.uniform2f(p.touch, ...this.mouseCoords);
    gl.uniform1i(p.pointerCount, this.nbrOfPointers);
    gl.uniform2fv(p.pointers, this.pointerCoords);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
}

class PointerHandler {
  scale: number;
  active: boolean;
  pointers: Map<number, [number, number]>;
  lastCoords: [number, number];
  moves: [number, number];

  constructor(element: HTMLCanvasElement, scale: number) {
    this.scale = scale;
    this.active = false;
    this.pointers = new Map();
    this.lastCoords = [0, 0];
    this.moves = [0, 0];
    const map = (
      el: HTMLCanvasElement,
      s: number,
      x: number,
      y: number
    ): [number, number] => [x * s, el.height - y * s];

    element.addEventListener("pointerdown", (e) => {
      this.active = true;
      this.pointers.set(e.pointerId, map(element, this.scale, e.clientX, e.clientY));
    });

    element.addEventListener("pointerup", (e) => {
      if (this.count === 1) this.lastCoords = this.first;
      this.pointers.delete(e.pointerId);
      this.active = this.pointers.size > 0;
    });

    element.addEventListener("pointerleave", (e) => {
      if (this.count === 1) this.lastCoords = this.first;
      this.pointers.delete(e.pointerId);
      this.active = this.pointers.size > 0;
    });

    element.addEventListener("pointermove", (e) => {
      if (!this.active) return;
      this.lastCoords = [e.clientX, e.clientY];
      this.pointers.set(e.pointerId, map(element, this.scale, e.clientX, e.clientY));
      this.moves = [this.moves[0] + e.movementX, this.moves[1] + e.movementY];
    });
  }

  get count() {
    return this.pointers.size;
  }
  get move() {
    return this.moves;
  }
  get coords(): number[] {
    return this.pointers.size > 0
      ? Array.from(this.pointers.values()).flat()
      : [0, 0];
  }
  get first(): [number, number] {
    const v = this.pointers.values().next().value;
    return v ?? this.lastCoords;
  }
}

function HeroButton({
  text,
  href,
  onClick,
  variant,
}: {
  text: string;
  href?: string;
  onClick?: () => void;
  variant: "primary" | "secondary";
}) {
  const basePrimary =
    "px-8 py-4 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white rounded-full font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/25 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-black";
  const baseSecondary =
    "px-8 py-4 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-300/30 hover:border-purple-300/50 text-purple-100 rounded-full font-semibold text-lg transition-all duration-300 hover:scale-105 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-black";
  const classes = variant === "primary" ? basePrimary : baseSecondary;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {text}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={classes}>
      {text}
    </button>
  );
}

export default function AnimatedShaderHero({
  trustBadge,
  headline,
  subtitle,
  buttons,
  className,
}: HeroProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const rendererRef = useRef<WebGLRenderer | null>(null);
  const pointersRef = useRef<PointerHandler | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let gl: WebGL2RenderingContext | null = null;
    try {
      gl = canvas.getContext("webgl2");
    } catch {
      console.error("WebGL2 context creation failed");
      return;
    }
    if (!gl) {
      console.error("WebGL2 not supported");
      return;
    }

    const resize = () => {
      if (!canvasRef.current) return;
      const dpr = Math.max(1, 0.5 * window.devicePixelRatio);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      if (rendererRef.current) rendererRef.current.updateScale(dpr);
    };

    const loop = (now: number) => {
      if (!rendererRef.current || !pointersRef.current) return;
      rendererRef.current.updateMouse(pointersRef.current.first);
      rendererRef.current.updatePointerCount(pointersRef.current.count);
      rendererRef.current.updatePointerCoords(pointersRef.current.coords);
      rendererRef.current.updateMove(pointersRef.current.move);
      rendererRef.current.render(now);
      animationFrameRef.current = requestAnimationFrame(loop);
    };

    const dpr = Math.max(1, 0.5 * window.devicePixelRatio);
    rendererRef.current = new WebGLRenderer(canvas, dpr);
    pointersRef.current = new PointerHandler(canvas, dpr);
    rendererRef.current.setup();
    rendererRef.current.init();
    resize();
    loop(0);
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      if (animationFrameRef.current)
        cancelAnimationFrame(animationFrameRef.current);
      if (rendererRef.current) rendererRef.current.reset();
    };
  }, []);

  return (
    <section
      className={cn(
        "relative w-full h-screen overflow-hidden bg-gradient-to-b from-[#1a0a2e] via-[#0d0518] to-black",
        className
      )}
      aria-label="Hero"
    >
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
          opacity: 0;
        }
        .animate-fade-in-down {
          animation: fadeInDown 0.8s ease-out forwards;
          opacity: 0;
        }
        .delay-200 {
          animation-delay: 0.2s;
        }
        .delay-400 {
          animation-delay: 0.4s;
        }
        .delay-600 {
          animation-delay: 0.6s;
        }
        .delay-800 {
          animation-delay: 0.8s;
        }
      `}</style>

      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full z-0"
        style={{ background: "transparent" }}
        aria-hidden
      />

      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-white px-4">
        {trustBadge && (
          <div className="mb-8 animate-fade-in-down">
            <div className="flex items-center gap-2 px-6 py-3 bg-purple-500/10 backdrop-blur-md border border-purple-300/30 rounded-full text-sm text-purple-100">
              {trustBadge.icons?.map((icon, i) => (
                <span key={i}>{icon}</span>
              ))}
              <span>{trustBadge.text}</span>
            </div>
          </div>
        )}

        <div className="text-center space-y-6 max-w-5xl mx-auto">
          <div className="space-y-2">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold bg-gradient-to-r from-purple-300 via-violet-400 to-purple-500 bg-clip-text text-transparent animate-fade-in-up delay-200">
              {headline.line1}
            </h1>
            <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold bg-gradient-to-r from-violet-300 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent animate-fade-in-up delay-400">
              {headline.line2}
            </h2>
          </div>

          <div className="max-w-3xl mx-auto animate-fade-in-up delay-600">
            <p className="text-lg md:text-xl lg:text-2xl text-purple-100/90 font-light leading-relaxed">
              {subtitle}
            </p>
          </div>

          {buttons && (buttons.primary || buttons.secondary) && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10 animate-fade-in-up delay-800">
              {buttons.primary && (
                <HeroButton
                  text={buttons.primary.text}
                  href={buttons.primary.href}
                  onClick={buttons.primary.onClick}
                  variant="primary"
                />
              )}
              {buttons.secondary && (
                <HeroButton
                  text={buttons.secondary.text}
                  href={buttons.secondary.href}
                  onClick={buttons.secondary.onClick}
                  variant="secondary"
                />
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
