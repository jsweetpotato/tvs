import * as THREE from "three";
import * as dat from "dat.gui";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import fragment from "./shaders/fragment.glsl";
import vertex from "./shaders/vertex.glsl";

const tv = require("url:./assets/tv.fbx");
const screen = require("url:./assets/screen.fbx");

class App {
  constructor() {
    this._container = document.querySelector("div");

    // renderer setting
    this._renderer = new THREE.WebGL1Renderer({ antialias: true });
    this._renderer.setPixelRatio(window.devicePixelRatio);
    this._renderer.setSize(window.innerWidth, window.innerHeight);
    this._container.appendChild(this._renderer.domElement);

    // create scene
    this._scene = new THREE.Scene();
    this.center = new THREE.Vector3();
    this.center.z = 5;
    this.mouse = new THREE.Vector3(0, 0, 1);

    // utils
    this._setCamera();
    this._setLight();
    this._setObject();
    this._setting();

    // event
    window.addEventListener("resize", this.onWindowResize.bind(this));
    window.addEventListener("mousemove", this.onDocumentMouseMove.bind(this));

    // rendering
    this.render();
  }

  //

  _setting() {
    this.settings = {
      progress: 0,
    };
    const gui = new dat.GUI();
    gui.add(this.settings, "progress", 0, 1, 0.01);
  }

  _setLight() {
    const light1 = new THREE.AmbientLight(0x2fafdf, 1);
    this._scene.add(light1);

    const pointLight = new THREE.PointLight(0xffaf00, 3, 100);
    pointLight.position.set(1, 4, 3);
    this._scene.add(pointLight);

    const sphereSize = 1;
    const pointLightHelper = new THREE.PointLightHelper(pointLight, sphereSize);
    this._scene.add(pointLightHelper);
  }

  _setCamera() {
    this._camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 1000);
    this._camera.position.z = 30;
  }

  _setObject() {
    // material
    const screenMat = new THREE.ShaderMaterial({
      // extensions: {
      //   derivatives:"#extension GL_OES_standard_derivatives : enable"
      // },
      // side: THREE.DoubleSide,
      uniforms: {
        time: { type: "f", value: 1 },
        progress: { type: "f", value: 0 },
        texture: { value: "none" },
        resolution: { type: "v4", value: new THREE.Vector4() },
      },
      vertexShader: vertex,
      fragmentShader: fragment,
    });

    this.screenMat = screenMat;

    const TV_FBX = new FBXLoader();
    const SCREEN_FBX = new FBXLoader();

    TV_FBX.load(tv, (obj) => {
      obj.scale.multiplyScalar(0.2);
      this._scene.add(obj);
    });

    SCREEN_FBX.load(screen, (obj) => {
      obj.traverse((child) => {
        if (child instanceof THREE.Mesh) child.material = screenMat;
      });

      obj.scale.multiplyScalar(0.2);
      obj.position.set(0, 0, 0.2);

      this._scene.add(obj);
    });
  }

  //

  onDocumentMouseMove({ clientX, clientY }) {
    this.mouse.x = (clientX - window.innerWidth / 2) * 0.02;
    this.mouse.y = (clientY - window.innerHeight) * 0.02;
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
    this.update();

    // shader time update
    this.screenMat.uniforms.time.value = performance.now();
    this.screenMat.uniforms.progress.value = this.settings.progress;

    // camera conrols
    this._camera.position.x += (this.mouse.x - this._camera.position.x) / 20;
    this._camera.position.y += (-this.mouse.y - this._camera.position.y) / 20;
    this._camera.lookAt(this.center);
    this._renderer.render(this._scene, this._camera);
  }

  update() {
    // this.controls.update();
  }
}

window.onload = new App();
