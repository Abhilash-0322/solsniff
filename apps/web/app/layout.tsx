import type { Metadata } from "next";
import { Zap } from "lucide-react";
import "./globals.css";

export const metadata: Metadata = {
  title: "SolSniff — Solana Narrative Detection & Idea Engine",
  description: "AI-powered tool that detects emerging narratives in the Solana ecosystem and generates actionable build ideas. Refreshed fortnightly.",
  keywords: ["solana", "narrative detection", "crypto trends", "build ideas", "DeFi", "Web3"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <div className="app-container">
          <nav className="navbar">
            <div className="navbar-inner">
              <div className="navbar-brand">
                <a href="/" className="navbar-logo">
                  <Zap className="text-sol-purple" style={{ marginRight: 8 }} /> SolSniff
                </a>
                <span className="navbar-badge">AI Agent</span>
              </div>
              <ul className="navbar-links">
                <li><a href="/">Dashboard</a></li>
                <li><a href="/narratives">Narratives</a></li>
                <li><a href="/ideas">Build Ideas</a></li>
                <li><a href="/signals">Signals</a></li>
                <li><a href="/about">About</a></li>
              </ul>
              <div className="navbar-status">
                <span className="status-dot"></span>
                <span>Live</span>
              </div>
            </div>
          </nav>
          <main className="main-content">
            {children}
          </main>
          <footer className="footer">
            <div className="footer-inner">
              <span>© 2026 SolSniff — Powered by AI Agents on Solana</span>
              <div className="footer-links">
                <a href="/about">Methodology</a>
                <a href="https://github.com" target="_blank" rel="noopener">GitHub</a>
                <a href="https://solana.com" target="_blank" rel="noopener">Solana</a>
              </div>
            </div>
          </footer>
        </div>
        <ParticleBackground />
      </body>
    </html>
  );
}

function ParticleBackground() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
(function() {
  const canvas = document.createElement('canvas');
  canvas.className = 'particle-canvas';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  
  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);
  
  const particles = [];
  const PARTICLE_COUNT = 60;
  const COLORS = ['rgba(153,69,255,', 'rgba(20,241,149,', 'rgba(0,212,255,'];
  
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      size: Math.random() * 2 + 0.5,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      opacity: Math.random() * 0.4 + 0.1,
    });
  }
  
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      
      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;
      
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color + p.opacity + ')';
      ctx.fill();
    }
    
    // Draw connections
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = 'rgba(153,69,255,' + (0.06 * (1 - dist / 120)) + ')';
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
    
    requestAnimationFrame(animate);
  }
  animate();
})();
        `,
      }}
    />
  );
}
