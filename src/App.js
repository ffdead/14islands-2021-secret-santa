import * as THREE from "three";
import React, { Suspense, useRef, useEffect, useLayoutEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Sphere,
  PositionalAudio,
  OrbitControls,
  MeshReflectorMaterial,
  Environment,
  useTexture,
  useDepthBuffer,
  SpotLight,
  Text,
  Stats,
  CameraShake,
  Html,
  Loader,
  Billboard
} from "@react-three/drei";
import lerp from "@14islands/lerp";
import { useControls, Leva } from "leva";
import { a, useSpring } from "@react-spring/three";

import Effects from "./Effects";

let max = 0;

function Analyzer({ started, onStartRequest, sound, shakeController }) {
  // <Analyzer /> will not run before everything else in the suspense block is resolved.
  // That means <PositionalAudio/>, which executes async, is ready by the time we're here.
  // The next frame (useEffect) is guaranteed(!) to access positional-audios ref.
  const mesh = useRef();
  const mesh2 = useRef();
  const mesh3 = useRef();
  const analyser = useRef();
  const eq = useRef();
  // const [hasStarted, setStarted] = React.useState(false);
  const [hover, setHover] = React.useState(false);

  const { shake } = useControls("camera", {
    shake: true
  });

  const onClick = React.useCallback(() => {
    // introBackdrop.current.visible = false;
    //setStarted(true);
    //started && shakeController.current.setIntensity(0.7);
    onStartRequest && onStartRequest();
  }, [started, shakeController]);

  useEffect(() => {
    analyser.current = new THREE.AudioAnalyser(sound.current, 32);
    eq.current = document.querySelector(".eq");
  }, [sound]);

  useFrame((_, delta) => {
    const data = analyser.current.getAverageFrequency();
    const data2 = analyser.current.getFrequencyData();
    /*
      mesh.current.material.color.setRGB(
        Math.min(1, (data2[1] / 255) * 1),
        Math.min(1, (data2[6] / 255) * 2),
        Math.min(1, (data2[10] / 255) * 15)
      );
      */

    const avg = data / 255;
    const pulse = Math.pow(data * 0.01, 2);

    if (shake) {
      shakeController.current.setIntensity(pulse * 0.2);
    }
    eq.current.style.transform = `scaleY(${Math.min(1, pulse * avg)})`;

    if (analyser.current && started) {
      mesh.current.material.color.setRGB(avg * 1, 0, 0);

      mesh.current.material.roughness = avg;
      mesh.current.material.metalness = 0 + avg;

      // mesh.current.scale.setScalar(avg2 * 1.2);
      // mesh.current.scale.setScalar(1 + pulse * pulse);
      if (mesh.current.scale.x > 1.9) {
        mesh.current.scale.setScalar(2 + pulse * 0.14);
      }

      window.intensity = avg;

      // shakeController.current.setIntensity(avg2 * 0.1);

      // console.log('data2', data2)
      // console.log("base", data);

      // mesh.current.scale.setScalar(
      //   lerp(mesh.current.scale.x, (data / 255) * 5, 0.01, delta)
      // );

      mesh2.current.position.x = lerp(
        mesh2.current.position.x,
        (data2[2] / 255) * 3 + 1,
        0.02,
        delta
      );
      mesh2.current.position.z = lerp(
        mesh2.current.position.z,
        (data2[6] / 255) * 2 - 1,
        0.02,
        delta
      );

      mesh3.current.position.x = lerp(
        mesh3.current.position.x,
        (data2[7] / 255) * -2 - 1,
        0.045,
        delta
      );
      mesh3.current.position.z = lerp(
        mesh3.current.position.z,
        (data2[11] / 255) * 2 + 0.5,
        0.03,
        delta
      );

      // 7 snare

      if (data > max) {
        max = data;
        // console.log("data", data, analyser.current.getFrequencyData());
      }
    }
  });

  const sphereSpring = useSpring({
    "position-y": started ? 2.5 : 0.5,
    "position-z": started ? -1 : -0.5,
    scale: started ? 2 : 1,
    config: { tension: 5, friction: 10 },
    delay: 3000
  });

  const colorSpring = useSpring({
    "material-color": hover ? "#55ff99" : "#C6DA20",
    config: { tension: 200, friction: 100 }
  });

  useEffect(() => {
    document.body.style.cursor = hover && !started ? "pointer" : "auto";
  }, [hover]);

  return (
    <>
      {/* <Sphere
        ref={introBackdrop}
        args={[4, 64, 64]}
        position-y={2.5}
        position-x={1}
        position-z={2}
        scale-y={0.6}
        material-color="#202020"
        material-side={THREE.BackSide}
      /> */}
      <a.mesh ref={mesh} castShadow {...sphereSpring}>
        <sphereGeometry args={[0.5, 64, 64]} />
        <meshPhysicalMaterial
          color="black"
          roughness={0.2}
          metalness={0.2}
          envMapIntensity={0.14}
        />
        {/* <Html center style={{ color: "white" }}>
          Click to open
        </Html> */}
      </a.mesh>
      <Sphere
        ref={mesh2}
        args={[0.2, 64, 64]}
        position={[3, 0.2, 0]}
        castShadow
        receiveShadow
      >
        <meshPhysicalMaterial
          roughness={0.3}
          metalness={0.8}
          envMapIntensity={0.1}
          color="#aa6c39"
        />
      </Sphere>
      <a.mesh
        ref={mesh3}
        position={[-7, 0.2, 0.5]}
        castShadow
        onClick={onClick}
        onPointerOver={(h) => setHover(true)}
        onPointerOut={(h) => setHover(false)}
        {...colorSpring}
      >
        <sphereGeometry args={[0.2, 64, 64]} />
        <meshPhysicalMaterial
          roughness={0.3}
          metalness={0.8}
          color="#C6DA20"
          envMapIntensity={0.1}
        />
      </a.mesh>
    </>
  );
}

function PlaySound({
  onStartRequest,
  seek = 0,
  started,
  shakeController,
  url
}) {
  // This component creates a suspense block, blocking execution until
  // all async tasks (in this case PositionAudio) have been resolved.
  const sound = useRef();

  useLayoutEffect(() => {
    if (!started) return;
    console.log("started!");
    sound.current.play();
  }, [started]);

  useEffect(() => {
    // not a real seek - just jumping forward a bit
    if (!sound.current || !started) return;
    // console.log("seek", seek, sound.current);
    sound.current.pause();
    sound.current.offset = seek;
    sound.current.play();
  }, [seek]);

  return (
    <>
      <PositionalAudio distance={10} url={url} ref={sound} />
      <Analyzer
        started={started}
        onStartRequest={onStartRequest}
        sound={sound}
        shakeController={shakeController}
      />
      <Lights started={started} />
    </>
  );
}

function Ground(props) {
  const t = useTexture("water-rough1.jpeg");
  const f = useTexture("floor.jpeg");

  const groundProps = useControls("ground", {
    color: "#fff",
    roughness: { value: 1, min: 0, max: 1, steps: 0.01 },
    metalness: { value: 0.9, min: 0, max: 1, steps: 0.01 },
    envMapIntensity: { value: 0.01, min: 0, max: 1, steps: 0.01 },
    blur: { value: 512, min: 0, max: 1024, steps: 16 },
    mixBlur: { value: 4, min: 0, max: 100, steps: 0.1 },
    mixStrength: { value: 2, min: 0, max: 10, steps: 0.1 },
    mixContrast: { value: 1.0, min: 0, max: 10, steps: 0.1 },
    mirror: { value: 0.33, min: 0, max: 1, steps: 0.1 }
  });

  useLayoutEffect(() => {
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(5, 5);
    t.needsUpdate = true;
  }, [t]);

  return (
    <mesh rotation-x={Math.PI * -0.5} position-y={0} receiveShadow {...props}>
      <circleGeometry args={[17, 64]} />
      {/* <planeGeometry args={[20, 10]} /> */}
      {/* <meshStandardMaterial
        color="#fff"
        roughnessMap={f}
        roughness={1}
        metalness={0.2}
        envMapIntensity={0.05}
      /> */}
      <MeshReflectorMaterial
        roughnessMap={t}
        resolution={2048}
        {...groundProps}
        // color="#fff"
        // roughnessMap={t}
        // roughness={1}
        // metalness={0.9}
        // envMapIntensity={0.01}
        // blur={512} // Blur ground reflections (width, heigt), 0 skips blur
        // mixBlur={10} // How much blur mixes with surface roughness (default = 1)
        // mixStrength={0.5} // Strength of the reflections
        // mixContrast={1} // Contrast of the reflections
        // resolution={2048} // Off-buffer resolution, lower=faster, higher=better quality, slower
        // mirror={0.5} // Mirror environment, 0 = texture colors, 1 = pick up env colors
        // depthScale={0} // Scale the depth factor (0 = no depth, default = 0)
        // minDepthThreshold={0.9} // Lower edge for the depthTexture interpolation (default = 0)
        // maxDepthThreshold={1} // Upper edge for the depthTexture interpolation (default = 0)
        // depthToBlurRatioBias={0} // Adds a bias factor to the depthTexture before calculating the blur amount [blurFactor = blurTexture * (depthTexture + bias)]. It accepts values between 0 and 1, default is 0.25. An amount > 0 of bias makes sure that the blurTexture is not too sharp because of the multiplication with the depthTexture
        //distortion={1} // Amount of distortion based on the distortionMap texture
        //distortionMap={distortionTexture} // The red channel of this texture is used as the distortion map. Default is null
        debug={0}
      />
    </mesh>
  );
}

function Lights({ started }) {
  // This is a super cheap depth buffer that only renders once (frames: 1 is optional!), which works well for static scenes
  // Spots can optionally use that for realism, learn about soft particles here: http://john-chapman-graphics.blogspot.com/2013/01/good-enough-volumetrics-for-spotlights.html
  const depthBuffer = useDepthBuffer({ size: 512 });
  return (
    <>
      <MovingSpot
        depthBuffer={depthBuffer}
        color="#0c8cbf"
        position={[4, 5, 2]}
        started={true}
      />
      <MovingSpot
        depthBuffer={depthBuffer}
        color="#DE356A"
        position={[-4, 5, 2]}
        started={started}
      />
    </>
  );
}

function MovingSpot({ started, vec = new THREE.Vector3(), ...props }) {
  const light = useRef();
  const viewport = useThree((state) => state.viewport);
  useFrame((state) => {
    light.current.target.position.lerp(
      vec.set(
        !started ? -8 : (state.mouse.x * viewport.width) / 2,
        (state.mouse.y * viewport.height) / 2,
        -1
      ),
      0.02
    );
    light.current.target.updateMatrixWorld();
  });
  return (
    <SpotLight
      castShadow
      ref={light}
      penumbra={1}
      // distance={5}
      distance={10}
      // decay={0}
      decay={0.5}
      angle={0.25}
      attenuation={6}
      anglePower={5}
      intensity={5}
      // shadow-camera-far={100}
      // shadow-camera-fov={80}
      {...props}
    />
  );
}

function Background({ color = "#202020" }) {
  const gl = useThree((s) => s.gl);
  const bgColor = React.useMemo(() => {
    const c = new THREE.Color(color).convertSRGBToLinear();
    gl.setClearColor(c, 1.0);
    return c;
  }, [color, gl]);
  return (
    <>
      <color attach="background" args={[bgColor]} />
      <fog attach="fog" args={[bgColor, 5, 10]} />
    </>
  );
}

function CameraParallax({ started, controls, parallax = 1 }) {
  const camera = useThree((s) => s.camera);
  // const controls = useThree((s) => s.controls);
  const get = useThree(({ get }) => get);
  // console.log("controls", controls, get().controls);

  useFrame((state, delta) => {
    // console.log("c", controls.current);
    if (parallax && controls.current) {
      controls.current.target.x = lerp(
        controls.current.target.x,
        !started ? -8 : 0,
        0.02,
        delta
      );

      camera.position.x = lerp(
        camera.position.x,
        !started ? -5 : state.mouse.x * parallax + 2,
        0.02,
        delta
      );
      camera.position.y = lerp(
        camera.position.y,
        3 + state.mouse.y * parallax,
        0.02,
        delta
      );
      // controls.current.update();
    }
  });

  return null;
}

function Dpr() {
  const { setDpr } = useThree()
  const { dpr } = useControls({
    dpr: { value: 1.2, min: 0.5, max: 2 }
  });

  useEffect(() => {
    setDpr(dpr)
  }, [dpr])

  return null
}

export default function App() {
  const controls = useRef();
  const shakeController = useRef();
  // const [hasStarted, setStarted] = React.useState(false);
  const [isUnwrapped, setUnwrap] = React.useState(false);
  const [seek, setSeek] = React.useState(0);

  const config = {
    maxYaw: 0, // Max amount camera can yaw in either direction
    maxPitch: 0.05, // Max amount camera can pitch in either direction
    maxRoll: 0.05, // Max amount camera can roll in either direction
    yawFrequency: 0, // Frequency of the the yaw rotation
    pitchFrequency: 5, // Frequency of the pitch rotation
    rollFrequency: 0.1, // Frequency of the roll rotation
    intensity: 0, // initial intensity of the shake
    decay: true, // should the intensity decay over time
    decayRate: 0.9, // if decay = true this is the rate at which intensity will reduce at
    controls // if using orbit controls, pass a ref here so we can update the rotation
  };

  // const textSpring = useSpring({
  //   "position-y": true ? 0 : 5,
  //   config: { tension: 10000, friction: 100 },
  //   delay: 3000
  // });

  const { fps } = useControls({
    fps: false
  });

  return (
    <>
      <Canvas
        shadows
        dpr={1}
        camera={{ position: [-5, 3, 6], fov: 50, near: 1, far: 20 }}
        gl={{ antialias: false, alpha: false }}
      >
        <Dpr/>
        <Background />
        <Suspense fallback={null}>
          <PlaySound
            seek={seek}
            shakeController={shakeController}
            //url="https://14islands-assets.netlify.app/assets/Kollektiv_Turmstrasse_-_Grillen_Im_Garten_Original_mix.mp3"
            url="https://14islands-assets.netlify.app/assets/Kollektiv_Turmstrasse_-_Affekt_Original_mix_(djlist.net).mp3"
            started={isUnwrapped}
            onStartRequest={() => setUnwrap(true)}
          />
          <OrbitControls
            ref={controls}
            target={[-10, 1.8, 0]}
            enableZoom={false}
            autoRotate={false}
            enableRotate={false}
            enablePan={false}
            // makeDefault
          />
          <CameraShake ref={shakeController} {...config} />
          <CameraParallax controls={controls} started={isUnwrapped} />
          <Ground />

          <a.group>
            <Text
              receiveShadow
              anchorX="center"
              anchorY="bottom"
              fontSize={1.5}
              position-z={-1}
              position-y={-0.35}
              position-x={-2}
            >
              GOD
              <meshStandardMaterial
                attach="material"
                color="#fff"
                envMapIntensity={0.04}
              />
            </Text>
            <Text
              receiveShadow
              anchorX="center"
              anchorY="bottom"
              fontSize={1.5}
              position-z={-2}
              position-y={-0.35}
              position-x={1}
            >
              HELG
              <meshStandardMaterial
                attach="material"
                color="#fff"
                envMapIntensity={0.04}
              />
            </Text>
          </a.group>

          <Billboard>
            <Text
              anchorX="left"
              anchorY="bottom"
              fontSize={0.4}
              position-z={-4}
              position-y={2}
              position-x={-8}
            >
              Dear Markus,
              <meshStandardMaterial
                attach="material"
                color="#fff"
                envMapIntensity={0.04}
              />
            </Text>
            <Text
              anchorX="left"
              anchorY="bottom"
              fontSize={0.2}
              position-z={-4}
              position-y={1.5}
              position-x={-8}
              maxWidth={3}
            >
              Relax and enjoy this alternative christmas experience...
              <meshStandardMaterial
                attach="material"
                color="#fff"
                envMapIntensity={0.04}
              />
            </Text>
          </Billboard>

          <Environment preset="warehouse" />
        </Suspense>
        {fps && <Stats />}
        <Effects />
      </Canvas>
      <Loader />
      <Leva collapsed />
      <div
        className={`playing ${isUnwrapped ? "started" : ""}`}
        onClick={() => {
          setSeek(120);
        }}
      >
        <div className="eq"></div>
        <strong>Kollektiv Turmstrasse</strong> - Affekt (Original mix)
      </div>
    </>
  );
}
