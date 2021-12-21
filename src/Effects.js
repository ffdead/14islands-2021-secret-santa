import {
  EffectComposer,
  SSAO,
  Vignette,
  Noise,
  Bloom,
  Sepia,
  DotScreen,
  Pixelation,
  ChromaticAberration,
  ToneMapping,
  Scanline
} from "@react-three/postprocessing";
import { BlendFunction, KernelSize, Resizer } from "postprocessing";
import { HalfFloatType } from "three";
import { useThree, useFrame } from "@react-three/fiber";
import { useControls } from "leva";

export default function Effects() {
  const size = useThree((s) => s.size);
  const dpr = useThree((s) => s.viewport.dpr);

  useControls("post", {}, { collapsed: true });
  const bloomProps = useControls(
    "post.bloom",
    {
      intensity: { value: 0, min: 0, max: 2 },
      luminanceThreshold: { value: 0.4, min: 0, max: 1, label: "threshold" },
      luminanceSmoothing: { value: 0.4, min: 0, max: 1, label: "smoothing" },
      kernelSize: {
        value: KernelSize.VERY_LARGE,
        options: [
          KernelSize.HUGE,
          KernelSize.VERY_LARGE,
          KernelSize.LARGE,
          KernelSize.MEDIUM,
          KernelSize.SMALL,
          KernelSize.VERY_SMALL
        ],
        label: "bloomSize"
      }
    },
    { collapsed: true }
  );
  const noiseProps = useControls(
    "post.noise",
    {
      opacity: { value: 0.05, min: 0, max: 0.3, step: 0.01 },
      premultiply: { value: false }
    },
    { collapsed: true }
  );
  const sephiaProps = useControls(
    "post.sephia",
    {
      intensity: { value: 0, min: 0, max: 1, step: 0.01 }
    },
    { collapsed: true }
  );
  const caProps = useControls(
    "post.chromaticAberration",
    {
      offset: {
        value: { x: 0, y: 0 },
        min: -1,
        max: 1,
        step: 0.01,
        joystick: true
      }
    },
    { collapsed: true }
  );

  const pixelationProps = useControls(
    "post.pixelation",
    {
      enable: {
        value: false
      },
      granularity: { value: 5, min: 0, max: 30, step: 1 }
    },
    { collapsed: true }
  );
  const vignetteProps = useControls(
    "post.vignette",
    {
      enable: {
        value: true
      },
      darkness: { value: 0.5, min: 0, max: 1, step: 0.01 },
      eskil: false,
      offset: { value: 0.5, min: 0, max: 1, step: 0.01 }
    },
    { collapsed: true }
  );
  const scanlineProps = useControls(
    "post.scanline",
    {
      enable: {
        value: true
      },
      density: { value: 0.9, min: 0, max: 2, step: 0.01 },
      opacity: { value: 0.02, min: 0, max: 1, step: 0.01 }
    },
    { collapsed: true }
  );
  return (
    // HalfFloatType drops 5 fps but removed gradient banding
    // re-mount when fps changes to change buffer size
    <EffectComposer key={dpr} frameBufferType={HalfFloatType}>
      {bloomProps.intensity && <Bloom {...bloomProps} />}
      {noiseProps.opacity && (
        <Noise
          {...noiseProps}
          // blendFunction={BlendFunction.ADD} // blend mode
        />
      )}
      {sephiaProps.intensity && <Sepia {...sephiaProps} />}

      {caProps.offset.x && caProps.offset.y && (
        <ChromaticAberration
          blendFunction={BlendFunction.NORMAL} // blend mode
          offset={[caProps.offset.x * 0.1, caProps.offset.y * 0.1]}
        />
      )}
      {pixelationProps.enable && <Pixelation {...pixelationProps} />}
      {vignetteProps.enable && (
        <Vignette {...vignetteProps} blendFunction={BlendFunction.NORMAL} />
      )}
      {scanlineProps.enable && (
        <Scanline
          blendFunction={BlendFunction.OVERLAY} // blend mode
          {...scanlineProps}
        />
      )}
    </EffectComposer>
  );
}
