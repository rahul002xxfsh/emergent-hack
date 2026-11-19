"use client";

import { useEffect, useRef, memo } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { type VoiceStatus } from "@/components/ui/voice-chat";

interface Therapist3DProps {
  status?: VoiceStatus;
  accentColor?: string;
  personaName?: string;
  modelUrl?: string;
  className?: string;
}

/**
 * Interactive 3D Therapist Character built with Three.js.
 * Features:
 * - Real-time 3D head and eye cursor tracking with smooth lerp physics.
 * - Stylized 3D Doctor/Therapist seated in a high-back leather executive chair.
 * - Sculpted stethoscope, shirt & tie, doctor's coat, and spectacles.
 * - Subtle lifelike breathing and speech nodding animations.
 * - Performance optimized: WebGL context management & IntersectionObserver.
 */
export const Therapist3D = memo(function Therapist3D({
  status = "idle",
  accentColor = "#F59E0B",
  personaName = "Dr. Therapist",
  modelUrl,
  className = "",
}: Therapist3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<VoiceStatus>(status);
  statusRef.current = status;
  const accentRef = useRef<string>(accentColor);
  accentRef.current = accentColor;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // --- Scene & Camera Setup ---
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      42,
      container.clientWidth / Math.max(container.clientHeight, 1),
      0.1,
      100
    );
    camera.position.set(0, 0.4, 3.8);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    // --- Lighting ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.6);
    keyLight.position.set(2.5, 4, 3.5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.001;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x94a3b8, 0.8);
    fillLight.position.set(-3, 2, 2);
    scene.add(fillLight);

    // Accent / Rim light (colored by persona)
    const rimLight = new THREE.PointLight(new THREE.Color(accentColor), 3.5, 8);
    rimLight.position.set(0, 2.5, -2);
    scene.add(rimLight);

    // Under-glow for dramatic studio depth
    const underLight = new THREE.PointLight(new THREE.Color(accentColor), 1.2, 5);
    underLight.position.set(0, -1.8, 1);
    scene.add(underLight);

    // --- Character & Chair Hierarchical Rig ---
    const characterGroup = new THREE.Group();
    scene.add(characterGroup);
    characterGroup.position.set(0, -0.65, 0);

    let customHeadPivot: THREE.Group | null = null;
    let customModelGroup: THREE.Group | null = null;
    let customBaseY = 0;

    if (modelUrl) {
      const loader = new GLTFLoader();
      loader.load(
        modelUrl,
        (gltf) => {
          customModelGroup = gltf.scene;
          characterGroup.visible = false; // Hide procedural when external GLTF is active
          scene.add(customModelGroup);

          const box = new THREE.Box3().setFromObject(customModelGroup);
          const size = new THREE.Vector3();
          box.getSize(size);
          const center = new THREE.Vector3();
          box.getCenter(center);

          // Normal human is ~1.8m tall. Target display height is ~2.3 units for a crisp bust portrait.
          const scale = 2.3 / (size.y || 1);
          customModelGroup.scale.setScalar(scale);

          // Center horizontally and frame chest-to-head nicely
          const targetY = -center.y * scale + 0.18;
          customBaseY = targetY;
          customModelGroup.position.set(-center.x * scale, targetY, -center.z * scale);

          // Find head node or bone
          let headNode: THREE.Object3D | null = null;
          customModelGroup.traverse((child) => {
            if (/head/i.test(child.name) && !headNode) {
              headNode = child;
            }
            if (child instanceof THREE.Mesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });

          if (headNode && (headNode as THREE.Object3D).parent) {
            const headBox = new THREE.Box3().setFromObject(headNode);
            // Pivot at bottom center of the head (neck joint)
            const neckPivot = new THREE.Vector3(
              (headBox.min.x + headBox.max.x) / 2,
              headBox.min.y + 0.04,
              (headBox.min.z + headBox.max.z) / 2
            );

            const pivotGroup = new THREE.Group();
            pivotGroup.name = "neck_pivot";
            pivotGroup.position.copy(neckPivot);
            (headNode as THREE.Object3D).parent!.add(pivotGroup);

            (headNode as THREE.Object3D).position.sub(neckPivot);
            pivotGroup.add(headNode as THREE.Object3D);
            customHeadPivot = pivotGroup;
          }
        },
        undefined,
        () => {
          characterGroup.visible = true; // Fallback to procedural model if GLTF is missing
        }
      );
    }

    // 1. Leather Executive Armchair
    const chairGroup = new THREE.Group();
    characterGroup.add(chairGroup);

    const leatherMat = new THREE.MeshStandardMaterial({
      color: 0x171717,
      roughness: 0.4,
      metalness: 0.1,
    });
    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x271910,
      roughness: 0.5,
    });
    const metalMat = new THREE.MeshStandardMaterial({
      color: 0xd4d4d8,
      metalness: 0.9,
      roughness: 0.2,
    });

    // Chair Backrest (High-back curved)
    const backGeo = new THREE.BoxGeometry(1.6, 2.2, 0.35);
    const chairBack = new THREE.Mesh(backGeo, leatherMat);
    chairBack.position.set(0, 1.1, -0.45);
    chairBack.castShadow = true;
    chairGroup.add(chairBack);

    // Chair Headrest
    const headrestGeo = new THREE.CylinderGeometry(0.7, 0.7, 0.4, 24);
    headrestGeo.rotateZ(Math.PI / 2);
    const headrest = new THREE.Mesh(headrestGeo, leatherMat);
    headrest.position.set(0, 2.25, -0.45);
    chairGroup.add(headrest);

    // Chair Seat Cushion
    const seatGeo = new THREE.BoxGeometry(1.6, 0.35, 1.4);
    const chairSeat = new THREE.Mesh(seatGeo, leatherMat);
    chairSeat.position.set(0, 0.15, 0.15);
    chairSeat.castShadow = true;
    chairGroup.add(chairSeat);

    // Armrests
    const armGeo = new THREE.BoxGeometry(0.18, 0.1, 1.1);
    const leftArm = new THREE.Mesh(armGeo, woodMat);
    leftArm.position.set(-0.85, 0.65, 0.1);
    const rightArm = new THREE.Mesh(armGeo, woodMat);
    rightArm.position.set(0.85, 0.65, 0.1);
    chairGroup.add(leftArm, rightArm);

    // Armrest vertical supports
    const supportGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.5, 12);
    const leftSupport = new THREE.Mesh(supportGeo, metalMat);
    leftSupport.position.set(-0.85, 0.4, 0.4);
    const rightSupport = new THREE.Mesh(supportGeo, metalMat);
    rightSupport.position.set(0.85, 0.4, 0.4);
    chairGroup.add(leftSupport, rightSupport);

    // Metallic Stem & Base
    const stemGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.6, 16);
    const chairStem = new THREE.Mesh(stemGeo, metalMat);
    chairStem.position.set(0, -0.25, 0);
    chairGroup.add(chairStem);

    const baseGeo = new THREE.CylinderGeometry(0.75, 0.8, 0.08, 24);
    const chairBase = new THREE.Mesh(baseGeo, metalMat);
    chairBase.position.set(0, -0.55, 0);
    chairGroup.add(chairBase);

    // 2. Therapist Body (Torso, Doctor Coat, Shirt, Tie, Stethoscope)
    const bodyGroup = new THREE.Group();
    characterGroup.add(bodyGroup);

    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xf6c8a2,
      roughness: 0.6,
      metalness: 0.05,
    });
    const coatMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc, // Doctor's crisp white coat
      roughness: 0.5,
      metalness: 0.02,
    });
    const shirtMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8, // Light blue dress shirt
      roughness: 0.45,
    });
    const tieMat = new THREE.MeshStandardMaterial({
      color: 0x991b1b, // Rich crimson tie
      roughness: 0.35,
    });
    const stethMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.3,
      metalness: 0.5,
    });

    // Torso (Doctor's coat)
    const torsoGeo = new THREE.CylinderGeometry(0.55, 0.48, 1.1, 24);
    const torso = new THREE.Mesh(torsoGeo, coatMat);
    torso.position.set(0, 0.85, 0);
    torso.castShadow = true;
    bodyGroup.add(torso);

    // Inner Shirt V-neck
    const shirtGeo = new THREE.BoxGeometry(0.35, 0.55, 0.2);
    const shirt = new THREE.Mesh(shirtGeo, shirtMat);
    shirt.position.set(0, 1.15, 0.32);
    bodyGroup.add(shirt);

    // Tie
    const tieGeo = new THREE.BoxGeometry(0.12, 0.6, 0.05);
    const tie = new THREE.Mesh(tieGeo, tieMat);
    tie.position.set(0, 0.95, 0.43);
    tie.rotation.x = -0.05;
    bodyGroup.add(tie);

    // Doctor Coat Lapels
    const lapelGeo = new THREE.BoxGeometry(0.16, 0.65, 0.08);
    const leftLapel = new THREE.Mesh(lapelGeo, coatMat);
    leftLapel.position.set(-0.25, 1.05, 0.41);
    leftLapel.rotation.z = -0.22;
    const rightLapel = new THREE.Mesh(lapelGeo, coatMat);
    rightLapel.position.set(0.25, 1.05, 0.41);
    rightLapel.rotation.z = 0.22;
    bodyGroup.add(leftLapel, rightLapel);

    // Stethoscope around neck
    const stethCurve = new THREE.TorusGeometry(0.36, 0.035, 12, 32, Math.PI * 1.1);
    const stethoscope = new THREE.Mesh(stethCurve, stethMat);
    stethoscope.position.set(0, 1.25, 0.22);
    stethoscope.rotation.x = Math.PI * 0.45;
    stethoscope.rotation.z = -Math.PI * 0.05;
    bodyGroup.add(stethoscope);

    // Stethoscope chest piece (bell)
    const bellGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.03, 16);
    const bell = new THREE.Mesh(bellGeo, metalMat);
    bell.position.set(0.18, 0.85, 0.45);
    bell.rotation.x = Math.PI / 2;
    bodyGroup.add(bell);

    // Shoulders
    const shoulderGeo = new THREE.SphereGeometry(0.24, 16, 16);
    const leftShoulder = new THREE.Mesh(shoulderGeo, coatMat);
    leftShoulder.position.set(-0.62, 1.2, 0);
    const rightShoulder = new THREE.Mesh(shoulderGeo, coatMat);
    rightShoulder.position.set(0.62, 1.2, 0);
    bodyGroup.add(leftShoulder, rightShoulder);

    // 3. Head, Neck & Face (The Tracking Rig)
    const neckGroup = new THREE.Group();
    neckGroup.position.set(0, 1.4, 0);
    bodyGroup.add(neckGroup);

    const neckGeo = new THREE.CylinderGeometry(0.18, 0.2, 0.3, 16);
    const neck = new THREE.Mesh(neckGeo, skinMat);
    neck.position.set(0, 0.08, 0);
    neckGroup.add(neck);

    // HEAD GROUP (This directly rotates with mouse cursor!)
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.32, 0);
    neckGroup.add(headGroup);

    // Head Base
    const headGeo = new THREE.SphereGeometry(0.48, 32, 32);
    headGeo.scale(1, 1.18, 1);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.set(0, 0, 0);
    head.castShadow = true;
    headGroup.add(head);

    // Stylized Combed Hair
    const hairMat = new THREE.MeshStandardMaterial({
      color: 0x3b2a20, // Dark styled hair
      roughness: 0.8,
    });
    const hairGeo = new THREE.SphereGeometry(0.51, 24, 24);
    hairGeo.scale(1.02, 1.1, 1.05);
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.set(0, 0.12, -0.06);
    headGroup.add(hair);

    // Ears
    const earGeo = new THREE.SphereGeometry(0.1, 12, 12);
    earGeo.scale(0.5, 1, 0.8);
    const leftEar = new THREE.Mesh(earGeo, skinMat);
    leftEar.position.set(-0.49, 0, 0);
    const rightEar = new THREE.Mesh(earGeo, skinMat);
    rightEar.position.set(0.49, 0, 0);
    headGroup.add(leftEar, rightEar);

    // Nose
    const noseGeo = new THREE.ConeGeometry(0.09, 0.22, 16);
    noseGeo.rotateX(-Math.PI / 2);
    const nose = new THREE.Mesh(noseGeo, skinMat);
    nose.position.set(0, -0.02, 0.49);
    headGroup.add(nose);

    // Eyeballs & Pupils (with independent tracking!)
    const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    const irisMat = new THREE.MeshBasicMaterial({ color: 0x1e3a8a });

    const createEye = (xPos: number) => {
      const eyeRig = new THREE.Group();
      eyeRig.position.set(xPos, 0.08, 0.42);

      const eyeBall = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 16), eyeWhiteMat);
      eyeRig.add(eyeBall);

      const iris = new THREE.Mesh(new THREE.SphereGeometry(0.046, 16, 16), irisMat);
      iris.position.set(0, 0, 0.06);
      eyeRig.add(iris);

      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.028, 16, 16), pupilMat);
      pupil.position.set(0, 0, 0.076);
      eyeRig.add(pupil);

      return eyeRig;
    };

    const leftEye = createEye(-0.16);
    const rightEye = createEye(0.16);
    headGroup.add(leftEye, rightEye);

    // Eyebrows
    const browMat = new THREE.MeshStandardMaterial({ color: 0x271910, roughness: 0.9 });
    const browGeo = new THREE.BoxGeometry(0.14, 0.03, 0.04);
    const leftBrow = new THREE.Mesh(browGeo, browMat);
    leftBrow.position.set(-0.17, 0.2, 0.45);
    leftBrow.rotation.z = 0.08;
    const rightBrow = new THREE.Mesh(browGeo, browMat);
    rightBrow.position.set(0.17, 0.2, 0.45);
    rightBrow.rotation.z = -0.08;
    headGroup.add(leftBrow, rightBrow);

    // Spectacles / Glasses (Classic therapist spectacles)
    const glassesGroup = new THREE.Group();
    glassesGroup.position.set(0, 0.08, 0.46);
    headGroup.add(glassesGroup);

    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x18181b, // Matte dark acetate frame
      metalness: 0.7,
      roughness: 0.2,
    });
    const lensMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.9,
      opacity: 1,
      transparent: true,
      roughness: 0.1,
      ior: 1.5,
      thickness: 0.05,
    });

    const lensRimGeo = new THREE.TorusGeometry(0.11, 0.016, 12, 24);
    const leftRim = new THREE.Mesh(lensRimGeo, frameMat);
    leftRim.position.set(-0.16, 0, 0);
    const rightRim = new THREE.Mesh(lensRimGeo, frameMat);
    rightRim.position.set(0.16, 0, 0);

    const lensGeo = new THREE.CircleGeometry(0.098, 20);
    const leftLens = new THREE.Mesh(lensGeo, lensMat);
    leftLens.position.set(-0.16, 0, 0.005);
    const rightLens = new THREE.Mesh(lensGeo, lensMat);
    rightLens.position.set(0.16, 0, 0.005);

    // Glasses Bridge
    const bridgeGeo = new THREE.BoxGeometry(0.1, 0.018, 0.018);
    const bridge = new THREE.Mesh(bridgeGeo, frameMat);
    bridge.position.set(0, 0.02, 0);

    // Glasses Temple arms
    const templeGeo = new THREE.BoxGeometry(0.016, 0.016, 0.45);
    const leftTemple = new THREE.Mesh(templeGeo, frameMat);
    leftTemple.position.set(-0.28, 0, -0.22);
    const rightTemple = new THREE.Mesh(templeGeo, frameMat);
    rightTemple.position.set(0.28, 0, -0.22);

    glassesGroup.add(leftRim, rightRim, leftLens, rightLens, bridge, leftTemple, rightTemple);

    // Mouth / Beard detail
    const mouthGeo = new THREE.BoxGeometry(0.14, 0.025, 0.02);
    const mouthMat = new THREE.MeshBasicMaterial({ color: 0x9f1239 });
    const mouth = new THREE.Mesh(mouthGeo, mouthMat);
    mouth.position.set(0, -0.2, 0.45);
    headGroup.add(mouth);

    // --- Interactive Mouse Cursor Tracking Physics ---
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

    const handleMouseMove = (e: MouseEvent) => {
      // Calculate normalized mouse coordinates (-1 to 1) relative to window
      const normX = (e.clientX / window.innerWidth) * 2 - 1;
      const normY = -(e.clientY / window.innerHeight) * 2 + 1;
      mouse.targetX = normX;
      mouse.targetY = normY;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    // --- Visibility & Render Loop ---
    let animationFrameId: number;
    let isVisible = true;
    const clock = new THREE.Clock();

    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
    });
    observer.observe(container);

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (!isVisible) return;

      const time = clock.getElapsedTime();

      // Smooth damped lerp for mouse coordinates
      mouse.x += (mouse.targetX - mouse.x) * 0.06;
      mouse.y += (mouse.targetY - mouse.y) * 0.06;

      // Update dynamic rim light from latest persona color
      const targetAccent = new THREE.Color(accentRef.current);
      rimLight.color.lerp(targetAccent, 0.05);
      underLight.color.lerp(targetAccent, 0.05);

      // 1. HEAD TRACKING (Yaw & Pitch)
      // Clamped natural range: -40deg to +40deg horizontal, -20deg to +20deg vertical
      const targetHeadYaw = mouse.x * 0.65;
      const targetHeadPitch = -mouse.y * 0.35;
      const targetHeadRoll = -mouse.x * 0.08;

      headGroup.rotation.y = targetHeadYaw;
      headGroup.rotation.x = targetHeadPitch;
      headGroup.rotation.z = targetHeadRoll;

      if (customHeadPivot) {
        (customHeadPivot as THREE.Group).rotation.y = targetHeadYaw * 0.75;
        (customHeadPivot as THREE.Group).rotation.x = targetHeadPitch * 0.55;
        (customHeadPivot as THREE.Group).rotation.z = targetHeadRoll * 0.3;
      }
      if (customModelGroup) {
        const breathing = Math.sin(time * 1.8) * 0.012;
        let speechNod = 0;
        if (statusRef.current === "speaking") {
          speechNod = Math.sin(time * 8.5) * 0.02 + Math.sin(time * 3.2) * 0.015;
          if (customHeadPivot) (customHeadPivot as THREE.Group).rotation.x += speechNod;
        }
        (customModelGroup as THREE.Group).position.y = customBaseY + breathing;
        (customModelGroup as THREE.Group).rotation.y = targetHeadYaw * 0.12;
      }

      // 2. EYE TRACKING (Pupils dart slightly faster to catch attention)
      const targetEyeX = mouse.x * 0.02;
      const targetEyeY = mouse.y * 0.02;
      leftEye.position.x = -0.16 + targetEyeX;
      leftEye.position.y = 0.08 + targetEyeY;
      rightEye.position.x = 0.16 + targetEyeX;
      rightEye.position.y = 0.08 + targetEyeY;

      // 3. LIFELIKE IDLE ANIMATION (Breathing chest rise/fall)
      const breathing = Math.sin(time * 1.8) * 0.015;
      bodyGroup.position.y = breathing;
      neckGroup.position.y = 1.4 + breathing * 0.5;

      // 4. SPEECH NODDING (When persona is talking)
      if (statusRef.current === "speaking") {
        const speechNod = Math.sin(time * 8.5) * 0.035 + Math.sin(time * 3.2) * 0.02;
        headGroup.rotation.x += speechNod;
        mouth.scale.y = 1 + Math.abs(Math.sin(time * 10)) * 1.8;
      } else {
        mouth.scale.y = 1;
      }

      // Subtle chair tilt with mouse
      chairGroup.rotation.y = mouse.x * 0.12;

      renderer.render(scene, camera);
    };

    animate();

    // --- Resize Handler ---
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / Math.max(h, 1);
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    // --- Cleanup ---
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      observer.disconnect();
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative h-full w-full overflow-hidden select-none ${className}`}
      aria-label={`3D Parody Therapist: ${personaName}`}
    >
      {/* Subtle Studio Backdrop Gradient */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40 transition-colors duration-700"
        style={{
          background: `radial-gradient(circle at 50% 45%, ${accentColor}25 0%, transparent 70%)`,
        }}
      />
    </div>
  );
});
