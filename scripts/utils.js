async function injectDemoVisuals(page) {
  await page.addStyleTag({
    content: `
      #__demo_cursor {
        position: fixed;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: rgba(255, 59, 48, 0.55);
        border: 2px solid rgba(255, 59, 48, 0.9);
        z-index: 2147483647;
        pointer-events: none;
        transform: translate(-50%, -50%);
        transition: left 0.35s cubic-bezier(0.22, 1, 0.36, 1), top 0.35s cubic-bezier(0.22, 1, 0.36, 1);
      }

      #__demo_zoom_wrapper {
        transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
        transform-origin: 0 0;
        will-change: transform;
      }

      #__demo_click_ring {
        position: fixed;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        border: 2px solid rgba(255, 59, 48, 0.9);
        z-index: 2147483646;
        pointer-events: none;
        transform: translate(-50%, -50%) scale(0);
        opacity: 0;
      }

      #__demo_click_ring.pulse {
        animation: __demo_pulse 0.5s ease-out;
      }

      @keyframes __demo_pulse {
        0% { transform: translate(-50%, -50%) scale(0.4); opacity: 0.9; }
        100% { transform: translate(-50%, -50%) scale(1.8); opacity: 0; }
      }

      #__demo_caption_box {
        position: fixed;
        bottom: 80px;
        left: 50%;
        transform: translateX(-50%) translateY(20px);
        background: #ffffff;
        color: #000000;
        padding: 16px 36px;
        border-radius: 8px;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 22px;
        font-weight: 600;
        box-shadow: 0 10px 30px rgba(0,0,0,0.15);
        z-index: 2147483647;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.4s ease, transform 0.4s ease;
        text-align: center;
        max-width: 80%;
        white-space: nowrap;
      }

      #__demo_caption_box.visible {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }
    `,
  });

  await page.evaluate(() => {
    const cursor = document.createElement('div');
    cursor.id = '__demo_cursor';
    document.body.appendChild(cursor);

    const ring = document.createElement('div');
    ring.id = '__demo_click_ring';
    document.body.appendChild(ring);

    const caption = document.createElement('div');
    caption.id = '__demo_caption_box';
    document.body.appendChild(caption);

    const wrapper = document.createElement('div');
    wrapper.id = '__demo_zoom_wrapper';

    while (document.body.firstChild) {
      if (
        document.body.firstChild === cursor ||
        document.body.firstChild === ring ||
        document.body.firstChild === caption
      ) {
        break;
      }

      wrapper.appendChild(document.body.firstChild);
    }

    document.body.insertBefore(wrapper, cursor);
  });
}

async function announce(page, text, durationMs = 3000) {
  await page.evaluate(
    ({ msg, duration }) => {
      const box = document.getElementById('__demo_caption_box');

      if (!box) return;

      if (window.__demo_caption_timeout) {
        clearTimeout(window.__demo_caption_timeout);
      }

      box.innerHTML = `
        <svg style="position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; border-radius:8px;">
          <rect id="__demo_caption_rect" x="0" y="0" width="100%" height="100%" rx="8" fill="none" stroke="#000000" stroke-width="8" />
        </svg>
        <span style="position:relative; z-index:1;">${msg}</span>
      `;

      box.classList.add('visible');

      requestAnimationFrame(() => {
        const rect = document.getElementById('__demo_caption_rect');

        if (!rect) return;

        const length = rect.getTotalLength();

        rect.style.strokeDasharray = length;
        rect.style.strokeDashoffset = length;
        rect.style.transition = `stroke-dashoffset ${duration}ms linear`;

        void rect.getBoundingClientRect();

        rect.style.strokeDashoffset = '0';
      });

      window.__demo_caption_timeout = setTimeout(() => {
        box.classList.remove('visible');
      }, duration);
    },
    { msg: text, duration: durationMs }
  );

  await page.waitForTimeout(200);
}

async function moveCursorTo(page, x, y, steps = 30) {
  await page.evaluate(
    ({ x, y }) => {
      const cursor = document.getElementById('__demo_cursor');

      if (cursor) {
        cursor.style.left = `${x}px`;
        cursor.style.top = `${y}px`;
      }
    },
    { x, y }
  );

  await page.mouse.move(x, y, { steps });
  await page.waitForTimeout(380);
}

async function clickWithFlourish(page, locator) {
  const box = await locator.boundingBox();

  if (!box) {
    throw new Error('Element not visible for clickWithFlourish');
  }

  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;

  await moveCursorTo(page, x, y);

  await page.evaluate(
    ({ x, y }) => {
      const ring = document.getElementById('__demo_click_ring');

      if (ring) {
        ring.style.left = `${x}px`;
        ring.style.top = `${y}px`;
        ring.classList.remove('pulse');
        void ring.offsetWidth;
        ring.classList.add('pulse');
      }
    },
    { x, y }
  );

  await page.waitForTimeout(150);
  await locator.click();
}

async function typeSlowly(page, locator, text, minDelay = 55, maxDelay = 130) {
  const box = await locator.boundingBox();

  if (box) {
    await moveCursorTo(page, box.x + box.width / 2, box.y + box.height / 2);
  }

  await locator.click();

  for (const char of text) {
    await locator.pressSequentially(char, { delay: 0 });
    const delay = minDelay + Math.random() * (maxDelay - minDelay);
    await page.waitForTimeout(delay);
  }
}

async function zoomToElement(page, locator, scale = 1.6) {
  const box = await locator.boundingBox();

  if (!box) {
    throw new Error('Element not visible for zoomToElement');
  }

  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;

  await page.evaluate(
    ({ x, y, scale }) => {
      const wrapper = document.getElementById('__demo_zoom_wrapper');

      if (wrapper) {
        wrapper.style.transformOrigin = `${x}px ${y}px`;
        wrapper.style.transform = `scale(${scale})`;
      }
    },
    { x, y, scale }
  );

  await page.waitForTimeout(650);
}

async function resetZoom(page) {
  await page.evaluate(() => {
    const wrapper = document.getElementById('__demo_zoom_wrapper');

    if (wrapper) {
      wrapper.style.transform = 'scale(1)';
    }
  });

  await page.waitForTimeout(650);
}

async function pause(page, ms = 1200) {
  await page.waitForTimeout(ms);
}

module.exports = {
  injectDemoVisuals,
  announce,
  moveCursorTo,
  clickWithFlourish,
  typeSlowly,
  zoomToElement,
  resetZoom,
  pause,
};
