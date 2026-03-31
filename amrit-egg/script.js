gsap.registerPlugin(ScrollTrigger);

// ── LENIS SMOOTH SCROLL ──────────────────────────
const lenis = new Lenis({
  duration: 1.0,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  direction: 'vertical', smooth: true,
});
function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
requestAnimationFrame(raf);

// ── CUSTOM MAGNETIC CURSOR ───────────────────────
const cursor = document.getElementById('cursor');
let mouseX = 0, mouseY = 0, cX = 0, cY = 0;

document.addEventListener('mousemove', (e) => {
  mouseX = e.clientX; mouseY = e.clientY;
});
gsap.ticker.add(() => {
  cX += (mouseX - cX) * 0.15;
  cY += (mouseY - cY) * 0.15;
  gsap.set(cursor, { x: cX, y: cY });
});

document.querySelectorAll('.magnetic-wrap').forEach(mag => {
  mag.addEventListener('mouseenter', () => cursor.classList.add('magnet-active'));
  mag.addEventListener('mouseleave', () => {
    cursor.classList.remove('magnet-active');
    gsap.to(mag, { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1, 0.3)' });
  });
  mag.addEventListener('mousemove', (e) => {
    const rect = mag.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width/2) * 0.3;
    const y = (e.clientY - rect.top - rect.height/2) * 0.3;
    gsap.to(mag, { x, y, duration: 0.3, ease: 'power2.out' });
  });
});

// ── SPLIT TYPE SETUP ─────────────────────────────
const splits = [];
document.querySelectorAll('.split-lines').forEach(el => {
  splits.push(new SplitType(el, { types: 'lines' }));
  gsap.set(el.querySelectorAll('.line'), { y: '100%', opacity: 0 }); // Initial state
});
document.querySelectorAll('.split-chars').forEach(el => {
  splits.push(new SplitType(el, { types: 'chars' }));
});

// ── CANVAS ENGINE & TIMELINE LOADER ──────────────
const canvas = document.getElementById("video-canvas");
if (canvas) {
    const ctx = canvas.getContext("2d");
    const TOTAL_FRAMES = 90;
    const frames = [];
    let loadedCount = 0;
    
    let cW = window.innerWidth; let cH = window.innerHeight;
    canvas.width = cW; canvas.height = cH;
    
    window.addEventListener('resize', () => {
        cW = window.innerWidth; cH = window.innerHeight;
        canvas.width = cW; canvas.height = cH;
        if (frames[0]) drawFrame(frames[Math.floor(obj.frame) || 0]);
    });

    const getFrameUrl = (index) => {
        const offset = (index * (13 / 90)).toFixed(2);
        return `https://res.cloudinary.com/dwi1p8y7f/video/upload/so_${offset},w_1920,q_100,f_jpg/Video_Project_3_ermf8s.jpg`;
    };

    function drawFrame(img) {
        if (!img || !img.complete || !img.naturalWidth) return;
        const vAspect = img.naturalWidth / img.naturalHeight; const cAspect = cW / cH;
        let dW, dH, dX, dY;
        if (cAspect > vAspect) { dW = cW; dH = cW / vAspect; dX = 0; dY = (cH - dH) / 2; } 
        else { dW = cH * vAspect; dH = cH; dX = (cW - dW) / 2; dY = 0; }
        
        // 5% zoom to clear watermark
        const scale = 1.05; const sW = dW * scale; const sH = dH * scale;
        const sX = dX - (sW - dW)/2; const sY = dY - (sH - dH)/2;
        
        ctx.clearRect(0,0,cW,cH); ctx.drawImage(img, sX, sY, sW, sH);
    }

    let introStarted = false;
    for (let i=0; i<TOTAL_FRAMES; i++) {
        const img = new Image(); img.crossOrigin = "anonymous"; img.src = getFrameUrl(i);
        img.onload = () => { 
          loadedCount++; 
          if(i===0) drawFrame(img); 
          if(loadedCount >= 12 && !introStarted) { 
            introStarted = true; 
            initIntro(); 
          } 
        };
        frames.push(img);
    }

    const obj = { frame: 0 };
    function initIntro() {
      const tl = gsap.timeline({ onComplete: () => { 
        document.body.classList.remove('loading'); 
        initWebflowAnimations(); 
      }});
      
      tl.to('#lLine', { height: '30vh', duration: 1.2, ease: 'power3.inOut' }, 0.2);
      tl.to('#lText', { opacity: 1, duration: 1, ease: 'power2.out' }, 0.5);
      tl.to('#lLine', { height: '100vh', opacity: 0, duration: 1, ease: 'expo.in' }, 1.8);
      tl.to('#lText', { opacity: 0, scale: 1.1, duration: 0.8, ease: 'expo.out' }, 1.8);
      
      tl.to('.loader-mask.top', { scaleY: 0, duration: 1.2, ease: 'expo.inOut' }, 2.3);
      tl.to('.loader-mask.bottom', { scaleY: 0, duration: 1.2, ease: 'expo.inOut' }, 2.3);
      
      // Expand the canvas from Webflow style pill to 100vw
      tl.to('.hero-canvas-wrap', { width: '100vw', height: '100vh', borderRadius: '0px', duration: 1.5, ease: 'expo.inOut' }, 2.3);
      
      // Bring in Text
      tl.from('.hero-h1', { y: 100, opacity: 0, duration: 1.2, ease: 'power4.out', stagger: 0.1 }, 2.6);
      tl.from('.hero-sub span', { y: 50, opacity: 0, duration: 1, ease: 'power3.out' }, 3.0);
      tl.to('.s-fill', { y: '0%', duration: 1.5, ease: 'expo.out' }, 3.2);

      // Scroll Engine Setup
      setupScrollEngine();
    }

    function setupScrollEngine() {
        // Scrub video while hero is pinned
        gsap.to(obj, {
            frame: TOTAL_FRAMES - 1, snap: "frame", ease: "none",
            scrollTrigger: { trigger: "#hero", start: "top top", end: "+=400%", pin: true, scrub: 0.5, onUpdate: () => drawFrame(frames[Math.round(obj.frame)]) }
        });
        
        // Dissolve text elements offscreen
        gsap.to('.hero-type-layer', {
            y: -150, opacity: 0, ease: 'none',
            scrollTrigger: { trigger: "#hero", start: "top top", end: "+=150%", scrub: 1 }
        });
    }
}

// ── ADVANCED WEBFLOW / AWWWARDS SCROLL ANIMATIONS 
function initWebflowAnimations() {
  
  // High-End Text Color Fill (Huge Text)
  ScrollTrigger.create({
    trigger: '.text-section', start: 'top 70%',
    onEnter: () => {
      gsap.to('.huge-text .line', { y: '0%', opacity: 1, duration: 1.5, stagger: 0.1, ease: 'expo.out', color: '#F0EEE9' });
    }
  });

  // Image Clip Reveals (Inset Scale Down)
  gsap.utils.toArray('.reveal-img').forEach(wrap => {
    gsap.fromTo(wrap, 
      { clipPath: 'inset(20%)' },
      { clipPath: 'inset(0%)', duration: 1.5, ease: 'expo.out', scrollTrigger: { trigger: wrap, start: 'top 80%' }}
    );
  });

  // Parallax Images Y-Translation
  gsap.utils.toArray('.parallax-img').forEach(img => {
    gsap.to(img, {
      yPercent: 20, ease: 'none',
      scrollTrigger: { trigger: img.parentElement, scrub: true, start: "top bottom", end: "bottom top" }
    });
  });

  // Horizontal Scroll Setup
  const hScroll = document.getElementById('h-scroll');
  if(hScroll) {
    const panels = gsap.utils.toArray('.h-panel');
    const scrollTween = gsap.to(panels, {
      xPercent: -100 * (panels.length - 1), ease: "none",
      scrollTrigger: { trigger: hScroll, pin: true, scrub: 1, start: "top top", end: () => "+=" + hScroll.offsetWidth }
    });

    // Animate Characters inside Horizontal Scroll (.mix-diff text)
    panels.forEach(panel => {
      gsap.from(panel.querySelectorAll('.char'), {
        y: '100%', opacity: 0, duration: 1, stagger: 0.05, ease: 'expo.out',
        scrollTrigger: { trigger: panel, containerAnimation: scrollTween, start: "left center" }
      });
    });
  }

  // Data Section Reveal
  gsap.from('.d-row, .section-title, .section-desc', {
    y: 50, opacity: 0, duration: 1.2, stagger: 0.1, ease: 'power3.out',
    scrollTrigger: { trigger: '.data-section', start: 'top 75%' }
  });

  // Scroll Velocity Marquee
  let proxy = { skew: 0 }, skewSetter = gsap.quickSetter(".marquee-txt", "skewX", "deg");
  ScrollTrigger.create({
    onUpdate: (self) => {
      let skew = gsap.utils.clamp(-20, 20, self.getVelocity() / -100);
      if (Math.abs(skew) > Math.abs(proxy.skew)) {
        proxy.skew = skew;
        gsap.to(proxy, {skew: 0, duration: 0.8, ease: "power3", overwrite: true, onUpdate: () => skewSetter(proxy.skew)});
      }
    }
  });
  
  gsap.to('.marquee-txt', {
    xPercent: -50, ease: 'none',
    scrollTrigger: { trigger: '.marquee-section', scrub: 0.5, start: 'top bottom', end: 'bottom top' }
  });

  // ── NAVBAR VISIBILITY ────────────────────────────
  ScrollTrigger.create({
    trigger: '.horizontal-scroll',
    start: 'top top',
    onEnter: () => document.querySelector('.nav').classList.add('scrolled'),
    onLeaveBack: () => document.querySelector('.nav').classList.remove('scrolled')
  });
}

// ── FULLSCREEN MENU LOGIC ────────────────────────
const btnMenu = document.getElementById('btnMenu');
const btnClose = document.getElementById('btnClose');
const menuOverlay = document.getElementById('menuOverlay');

let menuOpen = false;
btnMenu.addEventListener('click', () => {
  if(!menuOpen) {
    menuOverlay.classList.add('is-active');
    lenis.stop(); // Freeze background scrolling
    menuOpen = true;
    
    // GSAP Stagger text upwards
    gsap.fromTo('.menu-link .m-text', 
      { y: 150, opacity: 0 },
      { y: 0, opacity: 1, duration: 1.2, stagger: 0.1, ease: 'expo.out', delay: 0.3 }
    );
  }
});

function closeMenu() {
  if(menuOpen) {
    menuOverlay.classList.remove('is-active');
    lenis.start(); // Restore scrolling
    menuOpen = false;
  }
}

btnClose.addEventListener('click', closeMenu);
document.querySelectorAll('.menu-link').forEach(link => {
  link.addEventListener('click', closeMenu);
});

document.getElementById('linkHome').addEventListener('click', (e) => {
  e.preventDefault();
  lenis.scrollTo(0, { duration: 1.5 });
});
