import { useEffect, useRef } from "react";
import gsap from "gsap";

interface WeatherAtmosphereProps {
  condition?: string;
  isNight?: boolean;
}

export const WeatherAtmosphere = ({
  condition = "Clear",
  isNight = false,
}: WeatherAtmosphereProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const cond = condition.toLowerCase();
    const isRain = cond.includes("rain") || cond.includes("drizzle");
    const isSnow = cond.includes("snow");
    const isThunder = cond.includes("thunder");
    const isClear = cond.includes("clear");

    // Particle pool
    const count = isRain ? 120 : isSnow ? 90 : isClear ? 35 : 45;
    const particles: Array<{
      x: number;
      y: number;
      size: number;
      speedY: number;
      speedX: number;
      opacity: number;
      oscillation?: number;
    }> = [];

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: isRain ? Math.random() * 1.8 + 1 : isSnow ? Math.random() * 3 + 1.5 : Math.random() * 4 + 2,
        speedY: isRain ? Math.random() * 9 + 8 : isSnow ? Math.random() * 1.5 + 0.5 : Math.random() * 0.4 - 0.2,
        speedX: isRain ? -1.5 : isSnow ? Math.sin(i) * 0.5 : Math.random() * 0.6 - 0.3,
        opacity: Math.random() * 0.6 + 0.2,
        oscillation: Math.random() * Math.PI * 2,
      });
    }

    let thunderFlash = 0;
    let thunderTimer = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Handle lightning for thunderstorm
      if (isThunder) {
        thunderTimer++;
        if (thunderTimer > 200 && Math.random() < 0.03) {
          thunderFlash = 0.45;
          thunderTimer = 0;
        }
        if (thunderFlash > 0) {
          ctx.fillStyle = `rgba(230, 240, 255, ${thunderFlash})`;
          ctx.fillRect(0, 0, width, height);
          thunderFlash -= 0.03;
        }
      }

      // Draw and update particles
      for (const p of particles) {
        p.y += p.speedY;
        p.x += p.speedX;

        if (isSnow) {
          p.oscillation! += 0.02;
          p.x += Math.sin(p.oscillation!) * 0.8;
        }

        // Loop bounds
        if (p.y > height + 20) {
          p.y = -10;
          p.x = Math.random() * width;
        }
        if (p.x < -20) p.x = width + 10;
        if (p.x > width + 20) p.x = -10;

        ctx.save();
        ctx.beginPath();

        if (isRain) {
          // Rain streak
          ctx.strokeStyle = `rgba(165, 215, 255, ${p.opacity * 0.75})`;
          ctx.lineWidth = p.size;
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - 3, p.y + p.size * 9);
          ctx.stroke();
        } else if (isSnow) {
          // Flake
          ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity * 0.85})`;
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else if (isClear) {
          // Ambient sun/starlight mote
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2);
          grad.addColorStop(0, `rgba(255, 230, 160, ${p.opacity * 0.6})`);
          grad.addColorStop(1, "rgba(255, 230, 160, 0)");
          ctx.fillStyle = grad;
          ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Clouds / haze soft orbs
          ctx.fillStyle = `rgba(200, 220, 255, ${p.opacity * 0.12})`;
          ctx.arc(p.x, p.y, p.size * 8, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    };

    gsap.ticker.add(render);

    return () => {
      window.removeEventListener("resize", handleResize);
      gsap.ticker.remove(render);
    };
  }, [condition, isNight]);

  // Dynamic background gradient based on condition
  const getGradient = () => {
    const cond = condition.toLowerCase();
    if (cond.includes("thunder")) {
      return "from-[#0f111e] via-[#161a2e] to-[#0a0c16]";
    }
    if (cond.includes("rain") || cond.includes("drizzle")) {
      return "from-[#101b2b] via-[#16273e] to-[#0c1421]";
    }
    if (cond.includes("snow")) {
      return "from-[#1b2533] via-[#28384d] to-[#121a24]";
    }
    if (cond.includes("cloud")) {
      return "from-[#121c2b] via-[#1e2a3c] to-[#0d141e]";
    }
    // Clear
    return isNight
      ? "from-[#080d1a] via-[#12182c] to-[#050811]"
      : "from-[#132347] via-[#1e3c72] to-[#0b152d]";
  };

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 pointer-events-none z-0 transition-colors duration-1000 bg-gradient-to-br ${getGradient()}`}
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-80" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-400/10 via-transparent to-black/50" />
    </div>
  );
};
