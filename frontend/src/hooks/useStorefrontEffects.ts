import { useEffect } from "react";

/**
 * Intro playback state for this page load. Module-scoped on purpose: React
 * StrictMode double-invokes effects in development, and the intro is a one-shot
 * driven by a flag the effect itself writes. Previously pass 1 set `introShown`
 * and armed the timer, the cleanup cancelled that timer, then pass 2 read back
 * the flag it had just written and hid the intro immediately — so it never
 * played in dev. Holding the state outside the effect makes a re-run a no-op.
 */
let introState: "idle" | "playing" | "done" = "idle";

/**
 * Ports the ambient storefront behaviors from the original scriptforyou.js:
 * the one-per-tab intro, scroll reveal, marquee sizing, magnetic buttons, and
 * hero parallax. Runs once after the storefront DOM is mounted.
 */
export function useStorefrontEffects(ready: boolean): void {
  useEffect(() => {
    if (!ready) return;
    const cleanups: Array<() => void> = [];

    // INTRO — plays once per browser tab, then curtains up.
    const intro = document.getElementById("intro");
    if (intro) {
      if (introState === "idle") {
        if (sessionStorage.getItem("introShown")) {
          intro.classList.add("gone");
          introState = "done";
        } else {
          introState = "playing";
          sessionStorage.setItem("introShown", "true");
          // These timers are deliberately NOT added to `cleanups`. StrictMode's
          // simulated unmount would cancel them and freeze the intro on screen.
          // If Home really does unmount mid-intro the callbacks land on a
          // detached node, which is a harmless no-op.
          window.setTimeout(() => {
            intro.classList.add("leaving");
            window.setTimeout(() => {
              intro.classList.add("gone");
              introState = "done";
            }, 1500);
          }, 3300);
        }
      } else if (introState === "done") {
        // Returning to the storefront later in the same tab — no replay.
        intro.classList.add("gone");
      }
      // "playing" — a re-run must neither restart the intro nor hide it.
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
