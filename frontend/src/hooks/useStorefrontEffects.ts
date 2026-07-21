import { useEffect } from "react";

/**
 * Ports the ambient storefront behaviors from the original scriptforyou.js:
 * the one-per-tab intro, scroll reveal, marquee sizing, magnetic buttons, and
 * hero parallax. Runs once after the storefront DOM is mounted.
 */
export function useStorefrontEffects(ready: boolean): void {
  useEffect(() => {
    if (!ready) return;
    const cleanups: Array<() => void> = [];

    // INTRO — show only once per browser tab.
    const intro = document.getElementById("intro");
    if (intro) {
      if (sessionStorage.getItem("introShown")) {
        intro.classList.add("gone");
      } else {
        sessionStorage.setItem("introShown", "true");
        const t1 = window.setTimeout(() => {
          intro.classList.add("leaving");
          const t2 = window.setTimeout(() => intro.classList.add("gone"), 1500);
          cleanups.push(() => clearTimeout(t2));
        }, 3300);
        cleanups.push(() => clearTimeout(t1));
      }
    }

    // SCROLL REVEAL.
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("vis");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );
    document.querySelectorAll(".reveal,.reveal-left,.reveal-right").forEach((el) => io.observe(el));
    cleanups.push(() => io.disconnect());

    // MARQUEE — measure exact half-width for a seamless loop.
    const track = document.querySelector<HTMLElement>(".mqtrack");
    if (track) {
      requestAnimationFrame(() => {
        const halfW = track.scrollWidth / 2;
        track.style.setProperty("--mq-shift", "-" + halfW + "px");
        const dur = (halfW / 90).toFixed(2);
        track.style.animationDuration = dur + "s";
      });
    }

    // MAGNETIC BUTTONS.
    const magnetics = document.querySelectorAll<HTMLElement>(".npill,.ibtn,.bgold,.boutline,.pbtn");
    const magHandlers: Array<[HTMLElement, (e: MouseEvent) => void, () => void]> = [];
    magnetics.forEach((el) => {
      const move = (e: MouseEvent) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.25;
        const y = (e.clientY - r.top - r.height / 2) * 0.25;
        el.style.transform = "translate(" + x + "px," + y + "px)";
      };
      const leave = () => { el.style.transform = ""; };
      el.addEventListener("mousemove", move);
      el.addEventListener("mouseleave", leave);
      magHandlers.push([el, move, leave]);
    });
    cleanups.push(() => magHandlers.forEach(([el, m, l]) => {
      el.removeEventListener("mousemove", m);
      el.removeEventListener("mouseleave", l);
    }));

    // HERO PARALLAX.
    const himg = document.querySelector<HTMLElement>(".hero-img");
    if (himg) {
      himg.style.animation = "none";
      himg.style.transform = "scale(1.08)";
      const onScroll = () => {
        const st = window.pageYOffset;
        if (st < window.innerHeight + 100) {
          himg.style.transform = "scale(1.08) translateY(" + st * 0.25 + "px)";
        }
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      cleanups.push(() => window.removeEventListener("scroll", onScroll));
    }

    return () => cleanups.forEach((fn) => fn());
  }, [ready]);
}
