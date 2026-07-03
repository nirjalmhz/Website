import { useEffect, useRef } from "react";

interface WeatherBackgroundProps {
  conditionCode: number; // Open-Meteo WMO code
  isDay: boolean;
}

export default function WeatherBackground({ conditionCode, isDay }: WeatherBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    // Weather condition types
    // 0: Sunny/Clear
    // 1-3: Cloudy
    // 45-48: Fog/Cloudy
    // 51-67, 80-82: Rainy
    // 71-77, 85-86: Snowy
    // 95-99: Thunderstorm
    let weatherType: "sunny" | "cloudy" | "rainy" | "snowy" | "night" = "sunny";

    if (!isDay) {
      weatherType = "night";
    } else if (conditionCode === 0 || conditionCode === 1) {
      weatherType = "sunny";
    } else if ([2, 3, 45, 48].includes(conditionCode)) {
      weatherType = "cloudy";
    } else if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(conditionCode)) {
      weatherType = "rainy";
    } else if ([71, 73, 75, 77, 85, 86].includes(conditionCode)) {
      weatherType = "snowy";
    }

    // Handle Resize
    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener("resize", handleResize);

    // Particles Setup
    const particles: any[] = [];
    const maxParticles = weatherType === "rainy" ? 120 : weatherType === "snowy" ? 80 : weatherType === "night" ? 100 : 30;

    // Helper: Twinkling star
    class Star {
      x: number;
      y: number;
      size: number;
      alpha: number;
      speed: number;

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = Math.random() * 1.5;
        this.alpha = Math.random();
        this.speed = 0.005 + Math.random() * 0.015;
      }

      update() {
        this.alpha += this.speed;
        if (this.alpha > 1 || this.alpha < 0) {
          this.speed = -this.speed;
        }
      }

      draw() {
        if (!ctx) return;
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.abs(this.alpha)})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Helper: Shooting star
    class ShootingStar {
      x: number;
      y: number;
      length: number;
      speed: number;
      active: boolean;

      constructor() {
        this.x = 0;
        this.y = 0;
        this.length = 0;
        this.speed = 0;
        this.active = false;
        this.reset();
      }

      reset() {
        this.x = Math.random() * width * 0.8;
        this.y = Math.random() * height * 0.4;
        this.length = 40 + Math.random() * 80;
        this.speed = 8 + Math.random() * 12;
        this.active = Math.random() < 0.001; // rare triggering
      }

      update() {
        if (!this.active) {
          if (Math.random() < 0.0005) this.active = true;
          return;
        }
        this.x += this.speed;
        this.y += this.speed * 0.5;
        if (this.x > width || this.y > height) {
          this.reset();
        }
      }

      draw() {
        if (!this.active || !ctx) return;
        ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x - this.length, this.y - this.length * 0.5);
        ctx.stroke();
      }
    }

    // Helper: Rain particle
    class RainDrop {
      x: number;
      y: number;
      length: number;
      speed: number;
      opacity: number;

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * -height;
        this.length = 15 + Math.random() * 20;
        this.speed = 10 + Math.random() * 15;
        this.opacity = 0.15 + Math.random() * 0.25;
      }

      update() {
        this.y += this.speed;
        if (this.y > height) {
          this.y = Math.random() * -100;
          this.x = Math.random() * width;
        }
      }

      draw() {
        if (!ctx) return;
        ctx.strokeStyle = `rgba(156, 163, 175, ${this.opacity})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + 1, this.y + this.length);
        ctx.stroke();
      }
    }

    // Helper: Snow particle
    class Snowflake {
      x: number;
      y: number;
      size: number;
      speed: number;
      opacity: number;
      swing: number;
      swingSpeed: number;

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * -height;
        this.size = 1 + Math.random() * 4;
        this.speed = 1 + Math.random() * 2;
        this.opacity = 0.2 + Math.random() * 0.6;
        this.swing = Math.random() * 100;
        this.swingSpeed = 0.01 + Math.random() * 0.02;
      }

      update() {
        this.y += this.speed;
        this.swing += this.swingSpeed;
        this.x += Math.sin(this.swing) * 0.5;

        if (this.y > height) {
          this.y = Math.random() * -100;
          this.x = Math.random() * width;
        }
      }

      draw() {
        if (!ctx) return;
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Helper: Cloud particle
    class Cloud {
      x: number;
      y: number;
      size: number;
      speed: number;
      opacity: number;

      constructor() {
        this.x = Math.random() * width * 1.5 - width * 0.25;
        this.y = Math.random() * height * 0.4;
        this.size = 80 + Math.random() * 140;
        this.speed = 0.15 + Math.random() * 0.35;
        this.opacity = 0.04 + Math.random() * 0.08;
      }

      update() {
        this.x += this.speed;
        if (this.x - this.size > width) {
          this.x = -this.size;
          this.y = Math.random() * height * 0.4;
        }
      }

      draw() {
        if (!ctx) return;
        ctx.fillStyle = `rgba(226, 232, 240, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.arc(this.x + this.size * 0.6, this.y - this.size * 0.2, this.size * 0.8, 0, Math.PI * 2);
        ctx.arc(this.x - this.size * 0.6, this.y - this.size * 0.1, this.size * 0.7, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Helper: Sunny sun rays
    class SunRay {
      x: number;
      y: number;
      angle: number;
      speed: number;
      length: number;
      opacity: number;

      constructor() {
        this.x = width * 0.85;
        this.y = height * 0.15;
        this.angle = Math.random() * Math.PI * 2;
        this.speed = 0.001 + Math.random() * 0.002;
        this.length = 200 + Math.random() * 400;
        this.opacity = 0.02 + Math.random() * 0.04;
      }

      update() {
        this.angle += this.speed;
      }

      draw() {
        if (!ctx) return;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.fillStyle = `rgba(253, 224, 71, ${this.opacity})`;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-20, this.length);
        ctx.lineTo(20, this.length);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    }

    // Populate particles based on weather type
    if (weatherType === "night") {
      for (let i = 0; i < maxParticles; i++) {
        particles.push(new Star());
      }
      for (let i = 0; i < 3; i++) {
        particles.push(new ShootingStar());
      }
    } else if (weatherType === "rainy") {
      for (let i = 0; i < maxParticles; i++) {
        particles.push(new RainDrop());
      }
    } else if (weatherType === "snowy") {
      for (let i = 0; i < maxParticles; i++) {
        particles.push(new Snowflake());
      }
    } else if (weatherType === "cloudy") {
      for (let i = 0; i < 15; i++) {
        particles.push(new Cloud());
      }
    } else if (weatherType === "sunny") {
      for (let i = 0; i < 10; i++) {
        particles.push(new SunRay());
      }
    }

    // Thunderstorm variables
    let lightningFlash = 0;

    // Loop
    const draw = () => {
      if (!ctx || !canvas) return;

      // Handle lightning
      if (conditionCode >= 95 && Math.random() < 0.005) {
        lightningFlash = 25 + Math.random() * 25; // number of frames to flash
      }

      ctx.clearRect(0, 0, width, height);

      // Render sky backgrounds
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      if (lightningFlash > 0 && Math.random() < 0.5) {
        // Flash light blue screen
        ctx.fillStyle = `rgba(219, 234, 254, ${0.45 * (lightningFlash / 25)})`;
        ctx.fillRect(0, 0, width, height);
        lightningFlash--;
      } else {
        // Ambient styles
        if (weatherType === "night") {
          gradient.addColorStop(0, "#0b0e14"); // Frosted Glass Theme Deep Charcoal / Navy
          gradient.addColorStop(1, "#111827");
        } else if (weatherType === "sunny") {
          gradient.addColorStop(0, "#bae6fd"); // sky-200
          gradient.addColorStop(1, "#fef08a"); // yellow-200
        } else if (weatherType === "cloudy") {
          gradient.addColorStop(0, "#cbd5e1"); // slate-300
          gradient.addColorStop(1, "#f1f5f9"); // slate-100
        } else if (weatherType === "rainy") {
          gradient.addColorStop(0, "#475569"); // slate-600
          gradient.addColorStop(1, "#94a3b8"); // slate-400
        } else if (weatherType === "snowy") {
          gradient.addColorStop(0, "#e2e8f0"); // slate-200
          gradient.addColorStop(1, "#ffffff"); // white
        }
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
      }

      // Special visual elements
      if (weatherType === "night") {
        // Draw elegant glowing moon
        ctx.shadowColor = "rgba(254, 240, 138, 0.4)";
        ctx.shadowBlur = 40;
        ctx.fillStyle = "rgba(254, 240, 138, 0.85)";
        ctx.beginPath();
        ctx.arc(width * 0.85, height * 0.15, 35, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0; // reset
        
        // Draw crescent moon notch
        ctx.fillStyle = "#0b0e14";
        ctx.beginPath();
        ctx.arc(width * 0.85 - 12, height * 0.15 - 5, 35, 0, Math.PI * 2);
        ctx.fill();
      } else if (weatherType === "sunny") {
        // Draw elegant glowing sun
        ctx.shadowColor = "rgba(253, 224, 71, 0.5)";
        ctx.shadowBlur = 50;
        ctx.fillStyle = "rgba(253, 224, 71, 0.95)";
        ctx.beginPath();
        ctx.arc(width * 0.85, height * 0.15, 45, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0; // reset
      }

      // Update & Draw particles
      particles.forEach((p) => {
        p.update();
        p.draw();
      });

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
    };
  }, [conditionCode, isDay]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full -z-10 pointer-events-none transition-all duration-1000"
    />
  );
}
