// Keep single-finger scrolling and normal taps; reject only mobile zoom gestures.
export function installMobileZoomGuard() {
  const mobile = () =>
    matchMedia("(pointer: coarse), (max-width: 700px)").matches;
  const blockGesture = (event: Event) => {
    if (mobile() && event.cancelable) event.preventDefault();
  };
  const blockMultitouch = (event: TouchEvent) => {
    if (event.touches.length > 1) blockGesture(event);
  };
  for (const type of ["gesturestart", "gesturechange"])
    document.addEventListener(type, blockGesture, { passive: false });
  document.addEventListener("touchstart", blockMultitouch, { passive: false });
  document.addEventListener("touchmove", blockMultitouch, { passive: false });
}
