/* =========================================
   NTSA Driving Simulator – mobile.js
   Virtual joystick & touch controls
   ========================================= */

const MobileCtrl = (() => {
    let active = false;
    let startX = 0, startY = 0;
    let currentX = 0, currentY = 0;
    const maxRadius = 45;

    // Inject virtual key states into game keys
    // We share via a global 'keys' proxy — instead, we simulate keydown/keyup
    const KEYS_ACTIVE = {};

    function pressKey(k) {
        if (!KEYS_ACTIVE[k]) {
            KEYS_ACTIVE[k] = true;
            window.dispatchEvent(new KeyboardEvent('keydown', { key: k }));
        }
    }
    function releaseKey(k) {
        if (KEYS_ACTIVE[k]) {
            KEYS_ACTIVE[k] = false;
            window.dispatchEvent(new KeyboardEvent('keyup', { key: k }));
        }
    }

    function updateJoystick(dx, dy) {
        const stick = document.getElementById('joystick-stick');
        const clampedDx = Math.max(-maxRadius, Math.min(maxRadius, dx));
        const clampedDy = Math.max(-maxRadius, Math.min(maxRadius, dy));
        stick.style.transform = `translate(${clampedDx}px, ${clampedDy}px)`;

        // Threshold to avoid drift
        const threshold = 10;

        // Forward / backward
        if (dy < -threshold)       pressKey('w');  else releaseKey('w');
        if (dy >  threshold)       pressKey('s');  else releaseKey('s');

        // Steering
        if (dx < -threshold)       pressKey('a');  else releaseKey('a');
        if (dx >  threshold)       pressKey('d');  else releaseKey('d');
    }

    function resetStick() {
        const stick = document.getElementById('joystick-stick');
        stick.style.transform = 'translate(0px, 0px)';
        ['w','s','a','d'].forEach(releaseKey);
    }

    function init() {
        const zone = document.getElementById('joystick-zone');
        if (!zone) return;

        zone.addEventListener('touchstart', e => {
            e.preventDefault();
            const t = e.changedTouches[0];
            active = true;
            startX = t.clientX;
            startY = t.clientY;
        }, { passive: false });

        zone.addEventListener('touchmove', e => {
            e.preventDefault();
            if (!active) return;
            const t = e.changedTouches[0];
            const dx = t.clientX - startX;
            const dy = t.clientY - startY;
            updateJoystick(dx, dy);
        }, { passive: false });

        zone.addEventListener('touchend', e => {
            e.preventDefault();
            active = false;
            resetStick();
        }, { passive: false });

        zone.addEventListener('touchcancel', e => {
            active = false;
            resetStick();
        });
    }

    // Handbrake touch
    function hbStart() {
        pressKey(' ');
        document.getElementById('btn-handbrake').style.background = 'rgba(204,41,41,0.5)';
    }
    function hbEnd() {
        releaseKey(' ');
        document.getElementById('btn-handbrake').style.background = '';
    }

    // Auto-init when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Prevent page scroll during touch on canvas
    document.addEventListener('touchmove', e => {
        if (e.target.id === 'canvas' || e.target.closest('#joystick-zone')) {
            e.preventDefault();
        }
    }, { passive: false });

    // Detect mobile and show controls hint on welcome screen
    if (/Android|iPhone|iPad|iPod|IEMobile|Mobile/i.test(navigator.userAgent) || window.innerWidth < 768) {
        const note = document.getElementById('mobile-note');
        if (note) note.style.display = 'block';
        // Hide keyboard control guide on small screens
        const cg = document.querySelector('.control-guide');
        if (cg && window.innerWidth < 480) cg.style.display = 'none';
    }

    return { hbStart, hbEnd };
})();
