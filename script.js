'use strict';

/* =================================================================
   F1 Racing Car – script.js
   Handles: start lights, accelerate/brake, wheel rotation, the
   scrolling track, and the optional live color picker.

   Note: the car's color is NOT set here. It lives in style.css
   (--car-color). JavaScript only reads it for the color picker.
   ================================================================= */

// -----------------------------------------------------------------
// 1. SETTINGS – tweak these to change how the car drives
// -----------------------------------------------------------------
const MAX_SPEED = 340;        // km/h
const ACCELERATION = 120;     // km/h gained per second (at low speed)
const BRAKING = 200;          // km/h lost per second while braking
const DRAG = 12;              // km/h lost per second while coasting
const LAUNCH_TIME = 3000;     // ms of automatic throttle after lights out
const WHEEL_RADIUS_EM = 3.7;  // half of the .wheel size in style.css (7.4em)
const UPSHIFT_SPEEDS = [80, 120, 160, 200, 240, 275, 310]; // gear changes

// -----------------------------------------------------------------
// 2. PAGE ELEMENTS
// -----------------------------------------------------------------
const root = document.documentElement;
const scene = document.getElementById('scene');
const car = document.getElementById('car');
const carWrap = document.getElementById('carWrap');
const speedValue = document.getElementById('speedValue');
const gearValue = document.getElementById('gearValue');
const statusText = document.getElementById('status');
const startBtn = document.getElementById('startBtn');
const gasBtn = document.getElementById('gasBtn');
const brakeBtn = document.getElementById('brakeBtn');
const liveryPicker = document.getElementById('liveryPicker');
const resetColorBtn = document.getElementById('resetColorBtn');
const lights = document.querySelectorAll('.light');

// -----------------------------------------------------------------
// 3. STATE – everything the animation needs to remember
// -----------------------------------------------------------------
const state = {
  speed: 0,           // km/h
  throttle: false,    // is Accelerate held?
  brake: false,       // is Brake held?
  launchUntil: 0,     // timestamp until which the launch throttle is on
  offset: 0,          // total distance travelled, in screen pixels
  wheelAngle: 0,      // degrees
  lightsRunning: false,
};

// The car is sized in "em", so we need its font-size in pixels to
// convert speed into on-screen movement. Re-measured on resize.
let carFontPx = 12;
function measureCar() {
  carFontPx = parseFloat(getComputedStyle(car).fontSize) || 12;
}

// -----------------------------------------------------------------
// 4. PHYSICS – runs every frame
// -----------------------------------------------------------------
function update(dt, now) {
  const throttleOn = state.throttle || now < state.launchUntil;

  // Work out acceleration (km/h per second)
  let accel;
  if (state.brake) {
    accel = -BRAKING;
  } else if (throttleOn) {
    // Less push as we approach top speed, like air resistance
    accel = ACCELERATION * (1 - state.speed / MAX_SPEED);
  } else {
    accel = -(DRAG + state.speed * 0.04);
  }

  // Apply it, keeping speed between 0 and MAX_SPEED
  state.speed = Math.min(MAX_SPEED, Math.max(0, state.speed + accel * dt));

  // Turn km/h into pixels per second. Scaling by the car size keeps
  // the motion looking the same on a phone and on a big monitor.
  const pixelsPerSecond = state.speed * carFontPx * 0.32;
  const distance = pixelsPerSecond * dt;
  state.offset += distance;

  // A wheel rolling a distance d turns by d / radius (in radians).
  // This keeps the wheel rotation perfectly in sync with the road.
  const wheelRadiusPx = carFontPx * WHEEL_RADIUS_EM;
  const degrees = (distance / wheelRadiusPx) * (180 / Math.PI);
  state.wheelAngle = (state.wheelAngle + degrees) % 360;

  return throttleOn;
}

// -----------------------------------------------------------------
// 5. RENDER – push the state into CSS variables and classes
// -----------------------------------------------------------------
function render(throttleOn) {
  const moving = state.speed > 0.5;

  // CSS reads these variables to move the track and turn the wheels
  scene.style.setProperty('--offset', `${state.offset.toFixed(1)}px`);
  scene.style.setProperty('--speed-ratio', (state.speed / MAX_SPEED).toFixed(3));
  car.style.setProperty('--wheel-angle', `${state.wheelAngle.toFixed(1)}deg`);

  // CSS classes switch visual effects on and off
  car.classList.toggle('is-moving', moving);
  car.classList.toggle('is-braking', state.brake && moving);
  car.classList.toggle('is-accelerating', throttleOn && !state.brake && state.speed < MAX_SPEED - 5);
  car.classList.toggle('drs-open', throttleOn && !state.brake && state.speed > 280);
  scene.classList.toggle('is-fast', state.speed > 220);

  // Telemetry
  speedValue.textContent = Math.round(state.speed);
  gearValue.textContent = gearFor(state.speed);
}

function gearFor(speed) {
  if (speed < 1) return 'N';
  let gear = 1;
  for (const shiftPoint of UPSHIFT_SPEEDS) {
    if (speed >= shiftPoint) gear++;
  }
  return gear;
}

// -----------------------------------------------------------------
// 6. ANIMATION LOOP – requestAnimationFrame syncs with the screen
// -----------------------------------------------------------------
let lastTime = performance.now();

function loop(now) {
  // dt = seconds since last frame (capped so a background tab
  // doesn't make the car teleport when you come back)
  const dt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;

  const throttleOn = update(dt, now);
  render(throttleOn);

  requestAnimationFrame(loop);
}

// -----------------------------------------------------------------
// 7. START LIGHTS – five reds, a random pause, then lights out
// -----------------------------------------------------------------
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runStartLights() {
  if (state.lightsRunning) return;

  if (state.speed > 1) {
    statusText.textContent = 'Bring the car to a stop before starting a new race.';
    return;
  }

  state.lightsRunning = true;
  startBtn.disabled = true;
  statusText.textContent = 'Lights coming on…';
  lights.forEach((light) => light.classList.remove('on'));

  for (const light of lights) {
    await wait(800);
    light.classList.add('on');
  }

  // Real F1 starts hold the lights for a random time
  await wait(700 + Math.random() * 1800);
  lights.forEach((light) => light.classList.remove('on'));

  state.launchUntil = performance.now() + LAUNCH_TIME;
  statusText.textContent = 'Lights out! Hold Accelerate to keep pushing.';
  state.lightsRunning = false;
  startBtn.disabled = false;
}

// -----------------------------------------------------------------
// 8. CONTROLS – hold buttons, keyboard
// -----------------------------------------------------------------

// Makes a button act like a pedal: on while pressed, off when released.
// Pointer events cover mouse, touch and pen with one set of handlers.
function bindHoldButton(button, control) {
  const press = (event) => {
    event.preventDefault();
    state[control] = true;
    button.classList.add('is-held');
    if (event.pointerId !== undefined) button.setPointerCapture(event.pointerId);
  };
  const release = () => {
    state[control] = false;
    button.classList.remove('is-held');
  };

  button.addEventListener('pointerdown', press);
  button.addEventListener('pointerup', release);
  button.addEventListener('pointercancel', release);
  button.addEventListener('lostpointercapture', release);
  button.addEventListener('contextmenu', (event) => event.preventDefault());

  // Keyboard users: hold Space or Enter while the button has focus
  button.addEventListener('keydown', (event) => {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      state[control] = true;
      button.classList.add('is-held');
    }
  });
  button.addEventListener('keyup', (event) => {
    if (event.key === ' ' || event.key === 'Enter') release();
  });
}

bindHoldButton(gasBtn, 'throttle');
bindHoldButton(brakeBtn, 'brake');
startBtn.addEventListener('click', runStartLights);

// Arrow keys / W and S anywhere on the page
const KEY_CONTROLS = {
  arrowup: 'throttle',
  w: 'throttle',
  arrowdown: 'brake',
  s: 'brake',
};

document.addEventListener('keydown', (event) => {
  const control = KEY_CONTROLS[event.key.toLowerCase()];
  if (!control || event.target.matches('input')) return;
  event.preventDefault(); // stop arrow keys scrolling the page
  state[control] = true;
});

document.addEventListener('keyup', (event) => {
  const control = KEY_CONTROLS[event.key.toLowerCase()];
  if (control) state[control] = false;
});

// If the window loses focus, release the pedals so nothing gets stuck
window.addEventListener('blur', () => {
  state.throttle = false;
  state.brake = false;
  gasBtn.classList.remove('is-held');
  brakeBtn.classList.remove('is-held');
});

// -----------------------------------------------------------------
// 9. LIVE COLOR PREVIEW (optional)
// The permanent color is --car-color in style.css. The picker only
// overrides it temporarily with an inline style on <html>.
// -----------------------------------------------------------------

// Browsers may report colors as "rgb(255, 0, 0)" or "#ff0000".
// The color input needs "#rrggbb", so convert when needed.
function toHex(cssColor) {
  const value = cssColor.trim();
  if (/^#[0-9a-f]{6}$/i.test(value)) return value;
  if (/^#[0-9a-f]{3}$/i.test(value)) {
    return '#' + [...value.slice(1)].map((c) => c + c).join('');
  }
  const match = value.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i);
  if (match) {
    return '#' + match.slice(1, 4)
      .map((n) => Number(n).toString(16).padStart(2, '0'))
      .join('');
  }
  return null; // e.g. a named color the input can't show
}

function syncPickerWithStylesheet() {
  const current = getComputedStyle(root).getPropertyValue('--car-color');
  const hex = toHex(current);
  if (hex) liveryPicker.value = hex;
}

liveryPicker.addEventListener('input', () => {
  root.style.setProperty('--car-color', liveryPicker.value);
});

resetColorBtn.addEventListener('click', () => {
  root.style.removeProperty('--car-color'); // back to the style.css value
  // Wait a moment for the color transition to finish before reading it
  setTimeout(syncPickerWithStylesheet, 650);
});

// -----------------------------------------------------------------
// 10. START EVERYTHING
// -----------------------------------------------------------------

// When the drive-in entrance animation finishes, stop the CSS wheel spin
carWrap.addEventListener('animationend', (event) => {
  if (event.target === carWrap) car.classList.remove('is-arriving');
});

// With reduced motion there is no entrance, so remove the class now
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  car.classList.remove('is-arriving');
}

window.addEventListener('resize', measureCar);
measureCar();
syncPickerWithStylesheet();
requestAnimationFrame(loop);
