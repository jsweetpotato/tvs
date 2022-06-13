import * as THREE from "three";
import * as dat from "dat.gui";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import { TGALoader } from "three/examples/jsm/loaders/TGALoader";
import fragment from "./shaders/fragment.glsl";
import vertex from "./shaders/vertex.glsl";

const tv = require("url:./assets/tv.fbx");
const screen = require("url:./assets/screen.fbx");
const TV_COLOR_URL = require("url:./assets/textures/TV_Color.tga");
const TV_METALLIC_URL = require("url:./assets/textures/TV_Metallic.tga");
const TV_NORMAL_URL = require("url:./assets/textures/TV_Normal_G+.tga");
const TV_OCCULSION_URL = require("url:./assets/textures/TV_Occlusion.tga");
const TV_ROUGHNESS_URL = require("url:./assets/textures/TV_Roughness.tga");

const TV_COLOR = new TGALoader().load(TV_COLOR_URL);
const TV_METALLIC = new TGALoader().load(TV_METALLIC_URL);
const TV_NORMAL = new TGALoader().load(TV_NORMAL_URL);
const TV_OCCULSION = new TGALoader().load(TV_OCCULSION_URL);
const TV_ROUGHNESS = new TGALoader().load(TV_ROUGHNESS_URL);

class App {
  constructor() {
    this._container = document.querySelector("div");

    // renderer setting
    this._renderer = new THREE.WebGL1Renderer({ antialias: true });
    this._renderer.setPixelRatio(window.devicePixelRatio);
    this._renderer.setSize(window.innerWidth, window.innerHeight);
    this._renderer.shadowMap.enabled = true;
    this._renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this._container.appendChild(this._renderer.domElement);

    // create scene
    this._scene = new THREE.Scene();
    this.center = new THREE.Vector3();
    this.center.z = 5;
    this.center.y = 5;
    this.mouse = new THREE.Vector3(0, 0, 1);

    // utils
    this._setCamera();
    this._setLight();
    this._setObject();
    this._setting();

    // event
    window.addEventListener("resize", this.onWindowResize.bind(this));
    window.addEventListener("mousemove", this.onMouseMove.bind(this));

    // rendering
    this.render();
  }

  //

  _setting() {
    this.settings = {
      progress: 5,
    };
    const gui = new dat.GUI();
    gui.add(this.settings, "progress", 1, 10, 0.5);
  }

  _setLight() {
    const light = new THREE.AmbientLight(0xffffff, 0.2);

    const pointLight = new THREE.PointLight(0xffffff, 4, 40);
    pointLight.position.set(2, 14, 10);
    pointLight.shadow.bias = -0.01;
    // prevent receive shadow wave phenomenon
    // https://stackoverflow.com/questions/48938170/three-js-odd-striped-shadows
    pointLight.castShadow = true;

    const pointLight2 = new THREE.PointLight(0xfa1faf, 0.5, 60);
    pointLight2.position.set(6, 6, 7);
    const pointLight3 = new THREE.PointLight(0x11afdf, 1, 1000);
    pointLight3.position.set(-10, 10, 10);

    const sphereSize = 1;
    const pointLightHelper = new THREE.PointLightHelper(pointLight, sphereSize);
    const pointLightHelper2 = new THREE.PointLightHelper(pointLight2, sphereSize);
    const pointLightHelper3 = new THREE.PointLightHelper(pointLight3, sphereSize);

    this._scene.add(
      light,
      pointLight,
      // pointLight2,
      // pointLight3,
      pointLightHelper,
      // pointLightHelper2,
      // pointLightHelper3
    );

    this.pointLight = pointLight;
  }

  _setCamera() {
    this._camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 1000);
    this._camera.position.z = 30;
  }

  _setObject() {
    // tv material
    const tvMat = new THREE.MeshStandardMaterial({
      map: TV_COLOR,
      normalMap: TV_NORMAL,
      roughnessMap: TV_ROUGHNESS,
      roughness: 0.9,
      metalnessMap: TV_METALLIC,
      metalness: 0.2,
      aoMap: TV_OCCULSION,
      aoMapIntensity: 0.5,
      side: THREE.DoubleSide,
    });

    // screen material
    const screenMat = new THREE.ShaderMaterial({
      extensions: {
        derivatives: "#extension GL_OES_standard_derivatives : enable",
      },
      uniforms: {
        time: { type: "f", value: 1 },
        progress: { type: "f", value: 2 },
        texture: { value: "none" },
        resolution: { type: "v4", value: new THREE.Vector4() },
      },
      fog: true,
      vertexShader: vertex,
      fragmentShader: fragment,
    });
    this.screenMat = screenMat;

    // geometry
    const TV_FBX_LOADER = new FBXLoader();
    const SCREEN_FBX_LOADER = new FBXLoader();
    this.tv = new THREE.Group();

    TV_FBX_LOADER.load(tv, (obj) => {
      obj.scale.multiplyScalar(0.2);
      obj.traverse((child) => {
        if (child.isMesh) {
          child.material = tvMat;
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      this.tv.add(obj);
    });

    SCREEN_FBX_LOADER.load(screen, (obj) => {
      obj.traverse((child) => {
        if (child.isMesh) child.material = screenMat;
      });
      obj.scale.multiplyScalar(0.2);
      obj.position.set(0, 0, 0.2);
      this.tv.add(obj);
    });

    this._scene.add(this.tv);

    setTimeout(() => {
      const newTV = this.tv.clone();
      const newTV2 = this.tv.clone();
      newTV.position.set(6, 2, 6);
      newTV2.position.set(-12, 1, -20);
      this._scene.add(newTV, newTV2);
      console.log(newTV2.children[1].children[0].material === newTV.children[1].children[0].material);

      // shader 객체 공유.. 따라서 각각 shader material을 만들어 줘야할 것 같음..
      // newTV2.children[1].children[0].material.uniforms.progress.value = 0;
      // newTV2.children[1].children[0].material = this.screenMat2
    }, 400);

    const box = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), new THREE.MeshStandardMaterial({ color: 0x0000ff }));
    box.position.set(-10, 4, 0);
    box.castShadow = true;
    this._scene.add(box);

    const plane = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.MeshStandardMaterial({ color: 0xff111 }));
    plane.castShadow = true;
    plane.receiveShadow = true;
    plane.rotateX(-Math.PI/2);
    this._scene.add(plane);
  }

  //

  onMouseMove(event) {
    event.preventDefault();
    event.stopPropagation();
    this.mouse.x = (event.clientX - window.innerWidth / 2) * 0.02;
    this.mouse.y = (event.clientY  - window.innerHeight) * 0.02;
  }

  onWindowResize() {
    this._camera.aspect = window.innerWidth / window.innerHeight;
    this._camera.updateProjectionMatrix();
    this._renderer.setSize(window.innerWidth, window.innerHeight);
  }

  //

  render() {
    this._renderer.render(this._scene, this._camera);
    window.requestAnimationFrame(this.render.bind(this));
    // this.update();

    // shader time update
    this.screenMat.uniforms.time.value = performance.now();
    this.screenMat.uniforms.progress.value = this.settings.progress;

    // camera conrols
    this._camera.position.x += (this.mouse.x - this._camera.position.x) / 20;
    this._camera.position.y += (-this.mouse.y - this._camera.position.y + 2) / 20;
    this._camera.lookAt(this.center);
    this._renderer.render(this._scene, this._camera);
  }

  update() {}
}

window.onload = new App();
