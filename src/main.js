import * as THREE from "three";
import * as dat from "dat.gui";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import { TGALoader } from "three/examples/jsm/loaders/TGALoader";
import { RectAreaLightHelper } from "three/examples/jsm/helpers/RectAreaLightHelper";
import vertex from "./shaders/vertex.glsl";
import fragment from "./shaders/fragment.glsl";
import { lerp } from "three/src/math/mathutils";

const tv = require("url:./assets/tv.fbx");
const screen = require("url:./assets/screen.fbx");
const TV_COLOR_URL = require("url:./assets/textures/TV_Color.tga");
const TV_COLOR2_URL = require("url:./assets/textures/TV_Color2.tga");
const TV_METALLIC_URL = require("url:./assets/textures/TV_Metallic.tga");
const TV_NORMAL_URL = require("url:./assets/textures/TV_Normal_G+.tga");
const TV_OCCULSION_URL = require("url:./assets/textures/TV_Occlusion.tga");
const TV_ROUGHNESS_URL = require("url:./assets/textures/TV_Roughness.tga");

const BG = "./assets/textures/background.jpg";

class App {
  constructor() {
    this._container = document.querySelector(".canvas");

    // renderer setting
    this._renderer = new THREE.WebGL1Renderer({ antialias: true });
    this._renderer.setPixelRatio(window.devicePixelRatio);
    this._renderer.setSize(window.innerWidth, window.innerHeight);
    this._renderer.setClearColor(0x000000, 0);
    this._renderer.shadowMap.enabled = true;
    this._renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // this._renderer.toneMapping = THREE.ACESFilmicToneMapping;
    // this._renderer.toneMappingExposure = 0.1;
    // this._renderer.outputEncoding = THREE.sRGBEncoding;
    this._container.appendChild(this._renderer.domElement);

    // create scene
    this._scene = new THREE.Scene();
    // this._scene.fog = new THREE.Fog(0x1d1d1d, 0.0, 2000.0);

    // utils
    this._setupVideo();
    this._setCamera();
    this._setLight();
    this._setManager();

    this._isVideo;
    this._uniformsUpdate;
    this._isControls = true;
    this.mouse = new THREE.Vector3(0, 0, 1);
    this.speed;

    // event
    window.addEventListener("resize", this.onWindowResize.bind(this));
    window.addEventListener("mousemove", this.onMouseMove.bind(this));
    document.querySelector(".view-demo").addEventListener("click", this.onButtonClick.bind(this));

    // rendering
    this.render();
  }

  //

  _setLight() {
    const light = new THREE.AmbientLight(0xffffff, 0.2);

    const pointLight = new THREE.PointLight(0xbfcfff, 2, 40);
    const rectAriaLight = new THREE.RectAreaLight(0xffffff, 1, 6, 4.5);
    const pointLight3 = new THREE.PointLight(0xffdf11, 1, 1000);
    const direcLight = new THREE.DirectionalLight(0xffffff);

    pointLight.position.set(2, 14, 10);
    rectAriaLight.position.set(-0.5, 3, 4);
    rectAriaLight.rotateZ(Math.PI);
    pointLight3.position.set(-10, 10, 10);
    direcLight.position.set(0, 14, 5);
    direcLight.rotateZ(-Math.PI);

    // prevent receive shadow wave phenomenon
    // https://stackoverflow.com/questions/48938170/three-js-odd-striped-shadows
    pointLight.shadow.bias = -0.01;
    pointLight.castShadow = true;

    const sphereSize = 1;
    const pointLightHelper = new THREE.PointLightHelper(pointLight, sphereSize);
    const rectAriaLightHelper = new RectAreaLightHelper(rectAriaLight, 0xfffff);
    const pointLightHelper3 = new THREE.PointLightHelper(pointLight3, sphereSize);
    const direcLightHelper = new THREE.DirectionalLightHelper(direcLight, sphereSize);

    this._scene.add(
      light,
      pointLight,
      // rectAriaLight,
      // pointLight3,
      // direcLight,
      pointLightHelper
      // rectAriaLightHelper
      // pointLightHelper3
      // direcLightHelper,
    );

    this.pointLight = pointLight;
  }

  _setCamera() {
    // controls variables
    this.center = new THREE.Vector3();
    this.center.z = 4;
    this.center.y = 7;

    this.newCenter = new THREE.Vector3();
    this.newCenter.set(-0.7, 3, 0);

    this._camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 1000);
    this._camera.position.z = 40;
  }

  _setupVideo() {
    // const video = document.createElement("video");
    const that = this;

    // test
    const video = document.querySelector("#video");
    const $button = document.querySelector(".loading button");
    $button.addEventListener("click", () => {
      $button.remove();

      video.play();

      const videoTexture = new THREE.VideoTexture(video);
      videoTexture.minFilter = THREE.NearestFilter;
      // videoTexture.format = THREE.LuminanceFormat;
      this._videoTexture = videoTexture;
      this._isVideo = true;
      this._uniformsUpdate = false;
      this._setObject();
    });

    // 웹캠 지원 확인
    // if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    //   const constraints = {
    //     //비디오 해상도 지정
    //     video: { width: 480, height: 480 },
    //   };
    //   navigator.mediaDevices
    //     .getUserMedia(constraints)
    //     .then((stream) => {
    //       video.srcObject = stream;
    //       video.play();

    //       //three.js 비디오 텍스쳐 객체 생성
    //       const videoTexture = new THREE.VideoTexture(video);
    //       videoTexture.minFilter = THREE.NearestFilter;
    //       videoTexture.format = THREE.LuminanceFormat;
    //       this._videoTexture = videoTexture;

    //       this._isVideo = true;
    //       this._uniformsUpdate = false;

    //       this._setObject();

    //       //카메라 영상에 대한 텍스쳐 맵핑 객체가 준비된 상태에서 _setupModel 메소드가 호출됨
    //     })
    //     .catch(function (error) {
    //       that._isVideo = false;
    //       that._uniformsUpdate = true;

    //       that._setObject();
    //       console.error("카메라에 접근할 수 없습니다.", error);
    //     });
    // } else {
    //   this._isVideo = false;
    //   this._uniformsUpdate = true;

    //   this._setObject();
    //   console.error("MediaDevices 인터페이스 사용 불가");
    // }
  }

  _setManager() {
    const manager = new THREE.LoadingManager();

    const $progress = document.querySelector("progress");
    const $loading_Div = document.querySelector(".loading");

    manager.onProgress = (url, loaded, total) => {
      $progress.value = (loaded / total) * 100;
    };

    manager.onLoad = () => {
      const pos = [
        -9,
        0,
        0, // row: 1, col: 1
        9,
        0,
        0, // row: 1, col: 3
        -5.2,
        5.9,
        1, // row: 2, col: 1
        4.5,
        5.9,
        0.5, // row: 2, col: 2
        -1,
        11.8,
        0.5, // row: 3, col: 1
      ];

      const rot = [
        0,
        -0.5,
        0, // row: 1, col: 1
        0,
        0.3,
        0, // row: 1, col: 3
        0,
        0.4,
        0, // row: 2, col: 1
        0,
        -0.1,
        0, // row: 2, col: 2
        0,
        -0.2,
        0, // row: 3, col: 1
      ];

      for (let i = 0; i <= 5; i++) {
        const newTV = this.tv.clone();

        // const newMat = newTV.children[0].children[0].material.clone();
        // newTV.children[0].children[0].material = newMat;
        // if (i % 2) newMat.map = this.color2;

        newTV.position.set(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]);
        newTV.rotation.set(rot[i * 3], rot[i * 3 + 1], rot[i * 3 + 2]);

        this._scene.add(newTV);
      }
      $loading_Div.classList.add("fade-out");
      $loading_Div.addEventListener("animationend", () => {
        $loading_Div.style.visibility = "hidden";
      });
    };

    this._manager = manager;
  }

  _setObject() {
    // loaders
    const FBX_LOADER = new FBXLoader(this._manager);
    const TGA_LOADER = new TGALoader(this._manager);

    const TV_COLOR = TGA_LOADER.load(TV_COLOR_URL);
    const TV_COLOR2 = TGA_LOADER.load(TV_COLOR2_URL);
    const TV_METALLIC = TGA_LOADER.load(TV_METALLIC_URL);
    const TV_NORMAL = TGA_LOADER.load(TV_NORMAL_URL);
    const TV_OCCULSION = TGA_LOADER.load(TV_OCCULSION_URL);
    const TV_ROUGHNESS = TGA_LOADER.load(TV_ROUGHNESS_URL);

    this.color2 = TV_COLOR2;

    this.tv = new THREE.Group();

    // tv material
    const tvMat = new THREE.MeshStandardMaterial({
      map: TV_COLOR,
      normalMap: TV_NORMAL,
      roughnessMap: TV_ROUGHNESS,
      roughness: 0.9,
      metalnessMap: TV_METALLIC,
      metalness: 0.9,
      aoMap: TV_OCCULSION,
      side: THREE.DoubleSide,
      fog: true,
    });

    // screen material
    const uniforms = {
      time: { type: "f", value: 1 },
      progress: { type: "f", value: 2 },
      offset: { type: "f", value: 0 },
      resolution: { type: "v4", value: new THREE.Vector4() },
      texture: { type: "t", value: this._videoTexture },
      isVideo: { value: this._isVideo },
      // fogColor: { type: "c", value: this._scene.fog.color },
      // fogNear: { type: "f", value: this._scene.fog.near },
      // fogFar: { type: "f", value: this._scene.fog.far },
    };

    const screenMat = new THREE.ShaderMaterial({
      extensions: {
        derivatives: "#extension GL_OES_standard_derivatives : enable",
      },
      uniforms: uniforms,
      fog: true,
      transparent: true,
      vertexShader: vertex,
      fragmentShader: fragment,
    });

    this.screenMat = screenMat;
    console.dir(screenMat);

    // geometry

    FBX_LOADER.load(tv, (obj) => {
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

    FBX_LOADER.load(screen, (obj) => {
      obj.traverse((child) => {
        if (child.isMesh) child.material = screenMat;
      });
      obj.scale.multiplyScalar(0.2);
      obj.position.set(0, 0, 0.01);
      this.tv.add(obj);
    });

    this.tv.position.set(0, 0, 2);
    this._scene.add(this.tv);

    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(800, 200),
      new THREE.MeshStandardMaterial({ color: 0x1a1a1a })
    );
    plane.castShadow = true;
    plane.receiveShadow = true;
    plane.position.z = -50;
    plane.rotateX(-Math.PI / 2);
    this._scene.add(plane);
  }

  //

  onMouseMove(event) {
    event.preventDefault();
    event.stopPropagation();
    this.mouse.x = (event.clientX - window.innerWidth / 2) * 0.005;
    this.mouse.y = (event.clientY - window.innerHeight) * 0.002;
  }

  onWindowResize() {
    this._camera.aspect = window.innerWidth / window.innerHeight;
    this._camera.updateProjectionMatrix();
    this._renderer.setSize(window.innerWidth, window.innerHeight);
  }

  onButtonClick() {
    this._isControls = !this._isControls;
    this.speed = 1;
  }

  //

  render() {
    this._renderer.render(this._scene, this._camera);
    window.requestAnimationFrame(this.render.bind(this));
    // this.update();

    // shader time update
    if (this._uniformsUpdate) {
      this.screenMat.uniforms.time.value = performance.now();
      this.screenMat.uniforms.progress.value = this.settings.progress;
    }

    if (this._isVideo) {
      this.screenMat.uniforms.offset.value = this.mouse.x * 0.002;
    }

    // camera conrols
    if (this._isControls) {
      this._camera.position.x += (-this.mouse.x - this._camera.position.x) * 0.1;
      this._camera.position.y += (-this.mouse.y - this._camera.position.y + 2.0) * 0.1;
      this._camera.position.z += (40 - this._camera.position.z) * 0.1;

      this._camera.lookAt(this.center);

      if (this.speed > 0) {
        this.smoothCameraLook(this.center, this.newCenter, 0.2);
        return;
      }
    }

    if (!this._isControls) {
      this._camera.position.z += (7 - this._camera.position.z) * 0.1;
      this._camera.position.y += (3 - this._camera.position.y) * 0.1;
      this._camera.position.x += (-0.7 - this._camera.position.x) * 0.1;

      if (this.speed > 0) {
        this.smoothCameraLook(this.newCenter, this.center, 0.2);
        return;
      }
    }
    this._renderer.render(this._scene, this._camera);
  }

  smoothCameraLook(newPos, oldPos, density) {
    this.speed = this.speed - this.speed * density;
    let posX = lerp(newPos.x, oldPos.x, this.speed);
    let posY = lerp(newPos.y, oldPos.y, this.speed);
    let posZ = lerp(newPos.z, oldPos.z, this.speed);
    this._camera.lookAt(posX, posY, posZ);
  }

  update() {}
}

window.onload = new App();
