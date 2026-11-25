/* Hero WebGL: logo 3D do Baianão + moedas com o logo.
   Qualidade adaptativa: mede o FPS real do aparelho e reduz bloom, resolução e moedas até ficar liso. */
import * as THREE from 'three';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/examples/jsm/postprocessing/OutputPass.js';

const host=document.getElementById('gl');
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;

async function start(){
  const logo=new Image();logo.src='img/logo.webp';
  await Promise.all([logo.decode(),document.fonts.ready]);
  const LW=logo.naturalWidth,LH=logo.naturalHeight;
  const small=innerWidth<760;

  const renderer=new THREE.WebGLRenderer({antialias:!small,alpha:false,powerPreference:'high-performance',stencil:false});
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1;
  host.appendChild(renderer.domElement);

  /* nível inicial pelo aparelho */
  let gpu='';try{const gl=renderer.getContext();const ext=gl.getExtension('WEBGL_debug_renderer_info');gpu=ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):''}catch(e){}
  const weak=small||/intel|mali|adreno|powervr|apple gpu|swiftshader|llvmpipe/i.test(gpu)||(navigator.hardwareConcurrency||8)<=4||(navigator.deviceMemory||8)<=4;
  let tier=weak?1:0;
  const TIERS=[{dpr:1.5,bloom:true,coins:1},{dpr:1.25,bloom:false,coins:1},{dpr:1,bloom:false,coins:.6},{dpr:.8,bloom:false,coins:.35}];

  const scene=new THREE.Scene();
  {const bc=document.createElement('canvas');bc.width=bc.height=512;const bg=bc.getContext('2d');const gx=small?256:360,gy=small?150:215;
    const rg=bg.createRadialGradient(gx,gy,0,gx,gy,380);rg.addColorStop(0,'#1f72ff');rg.addColorStop(.28,'#0050d0');rg.addColorStop(.55,'#00388A');rg.addColorStop(1,'#001A4D');
    bg.fillStyle=rg;bg.fillRect(0,0,512,512);
    bg.save();bg.translate(gx,gy);for(let i=0;i<30;i++){bg.rotate(Math.PI*2/30);bg.fillStyle='rgba(255,255,255,.045)';bg.beginPath();bg.moveTo(0,0);bg.lineTo(520,-28);bg.lineTo(520,28);bg.fill()}bg.restore();
    const bt=new THREE.CanvasTexture(bc);bt.colorSpace=THREE.SRGBColorSpace;scene.background=bt}
  const pm=new THREE.PMREMGenerator(renderer);scene.environment=pm.fromScene(new RoomEnvironment(),0.04).texture;pm.dispose();
  const cam=new THREE.PerspectiveCamera(35,1,.1,100);cam.position.set(0,0,15);
  const aniso=Math.min(8,renderer.capabilities.getMaxAnisotropy());
  const tex=c=>{const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=aniso;return t};

  /* ---- marca 3D do Sócio Baianão (imagem + camadas de espessura) ---- */
  const mark=new Image();mark.src='img/socio-baianao.webp';await mark.decode();
  const MW=6.4,MH=MW*mark.naturalHeight/mark.naturalWidth;
  const markTex=new THREE.Texture(mark);markTex.colorSpace=THREE.SRGBColorSpace;markTex.anisotropy=aniso;markTex.needsUpdate=true;
  const sil=document.createElement('canvas');sil.width=mark.naturalWidth;sil.height=mark.naturalHeight;const sg=sil.getContext('2d');sg.drawImage(mark,0,0);sg.globalCompositeOperation='source-in';sg.fillStyle='#fff';sg.fillRect(0,0,sil.width,sil.height);
  const silTex=tex(sil);
  const planeG=new THREE.PlaneGeometry(MW,MH);
  const L=new THREE.Group();
  const face=new THREE.Mesh(planeG,new THREE.MeshStandardMaterial({map:markTex,alphaTest:.5,roughness:.32,metalness:.05}));face.position.z=.001;face.renderOrder=2;L.add(face);
  const DEP=8;for(let k=1;k<=DEP;k++){const c=new THREE.Color().lerpColors(new THREE.Color(0x0d2a8a),new THREE.Color(0x050f3a),k/DEP);
    const pl=new THREE.Mesh(planeG,new THREE.MeshStandardMaterial({map:silTex,alphaTest:.5,color:c,roughness:.45,metalness:.2,side:k===DEP?THREE.DoubleSide:THREE.FrontSide}));pl.position.z=-k*.03;L.add(pl)}
  scene.add(L);

  /* ---- moedas ---- */
  const fc=document.createElement('canvas');fc.width=fc.height=512;const g=fc.getContext('2d');
  const gr=g.createRadialGradient(200,170,30,256,256,280);gr.addColorStop(0,'#FFF4C8');gr.addColorStop(.5,'#E6C866');gr.addColorStop(1,'#8E6E1C');
  g.fillStyle=gr;g.fillRect(0,0,512,512);
  g.strokeStyle='rgba(92,62,6,.5)';g.lineWidth=16;g.beginPath();g.arc(256,256,224,0,7);g.stroke();
  g.lineWidth=4;g.beginPath();g.arc(256,256,196,0,7);g.stroke();
  for(let i=0;i<72;i++){const a=i/72*Math.PI*2;g.save();g.translate(256+Math.cos(a)*240,256+Math.sin(a)*240);g.rotate(a);g.fillStyle='rgba(92,62,6,.35)';g.fillRect(-2,-7,4,14);g.restore()}
  const lw=330,lh=lw*LH/LW;g.shadowColor='rgba(60,40,0,.45)';g.shadowBlur=14;g.shadowOffsetY=6;g.drawImage(logo,256-lw/2,262-lh/2,lw,lh);g.shadowColor='transparent';
  g.fillStyle='rgba(78,52,4,.82)';g.textAlign='center';g.textBaseline='middle';g.font='800 44px Poppins, Arial';g.fillText('SÓCIO',256,140);
  g.font='700 30px Poppins, Arial';g.fillText('★  100 CRÉDITOS  ★',256,382);
  const coinFace=tex(fc);
  const cg=new THREE.CylinderGeometry(1,1,.16,40,1);cg.rotateX(Math.PI/2);
  const faceM=new THREE.MeshStandardMaterial({map:coinFace,metalness:.85,roughness:.28});
  const mats=[new THREE.MeshStandardMaterial({color:0xD7BB5A,metalness:1,roughness:.3}),faceM,faceM];
  const N=small?30:76;
  const inst=new THREE.InstancedMesh(cg,mats,N);inst.instanceMatrix.setUsage(THREE.DynamicDrawUsage);inst.frustumCulled=false;scene.add(inst);
  const P=[];for(let i=0;i<N;i++)P.push({r:(small?2.6:3.6)+Math.random()*(small?2.6:4.4),a:Math.random()*6.28,y:(Math.random()-.5)*14,sp:(.15+Math.random()*.25)*(Math.random()<.5?1:-1),f:.3+Math.random()*.6,s:(small?.22:.3)+Math.random()*.38,rx:Math.random()*6,ry:Math.random()*6,vx:.4+Math.random()*1.4,vy:.3+Math.random()*1.2});

  const key=new THREE.DirectionalLight(0xffffff,3);key.position.set(3,6,9);scene.add(key);
  const rim=new THREE.DirectionalLight(0xff3040,2);rim.position.set(-7,-3,-3);scene.add(rim);
  const rim2=new THREE.DirectionalLight(0x5aa0ff,3);rim2.position.set(7,4,-4);scene.add(rim2);
  scene.add(new THREE.AmbientLight(0x3050a0,.5));

  let comp=null,bloom=null;
  function ensureComposer(){if(comp)return;comp=new EffectComposer(renderer);comp.addPass(new RenderPass(scene,cam));bloom=new UnrealBloomPass(new THREE.Vector2(256,256),.22,.4,1.05);comp.addPass(bloom);comp.addPass(new OutputPass())}

  let cx=0,cy=0,ls=1,W=1,H=1;
  function applyTier(){const t=TIERS[tier];renderer.setPixelRatio(Math.min(devicePixelRatio,t.dpr));renderer.setSize(W,H,false);
    if(t.bloom){ensureComposer();comp.setPixelRatio(Math.min(devicePixelRatio,t.dpr));comp.setSize(W,H);bloom.resolution.set(W/2,H/2)}
    inst.count=Math.max(8,Math.round(N*t.coins));host.dataset.q=tier}
  function size(){W=host.clientWidth;H=host.clientHeight;cam.aspect=W/H;cam.updateProjectionMatrix();
    const wide=W>760;cx=wide?Math.min(5.8,(W/H)*2.95):0;cy=wide?.2:3.1;
    const visW=2*Math.tan(cam.fov*Math.PI/360)*15*cam.aspect,visH=visW/cam.aspect;ls=wide?Math.min(1,visW*.32/6.4,visH*.58/4):Math.min(.95,visW*.7/6.4);if(!wide)cy=visH*.5-2.4*ls-.55;applyTier()}
  new ResizeObserver(size).observe(host);size();

  let mx=0,my=0,tx=0,ty=0,sy=0;
  addEventListener('pointermove',e=>{mx=e.clientX/innerWidth-.5;my=e.clientY/innerHeight-.5},{passive:true});
  addEventListener('scroll',()=>{sy=scrollY/innerHeight},{passive:true});
  let vis=true,running=false;
  new IntersectionObserver(([e])=>{vis=e.isIntersecting;wake()}).observe(host);
  document.addEventListener('visibilitychange',wake);

  const m=new THREE.Matrix4(),q=new THREE.Quaternion(),eu=new THREE.Euler(),v=new THREE.Vector3(),sc=new THREE.Vector3();
  let T=0,last=0;const INTRO=reduce?0:2.2;
  const easeOutBack=x=>{const c1=1.5,c3=c1+1;return 1+c3*Math.pow(x-1,3)+c1*Math.pow(x-1,2)};
  const easeOut=x=>1-Math.pow(1-x,4);
  /* medidor de FPS: janela de 45 quadros; se a média passar de 21 ms, desce um nível */
  let acc=0,cnt=0,settle=0;
  function frame(now){
    if(!vis||document.hidden){running=false;return}
    requestAnimationFrame(frame);
    const raw=last?now-last:16.7;last=now;const dt=Math.min(raw/1000,.05);T+=dt;const mt=reduce?0:T;
    if(T>INTRO+.4&&tier<3){if(settle>0)settle--;else{acc+=raw;cnt++;if(cnt>=45){if(acc/cnt>21){tier++;applyTier();settle=30}acc=0;cnt=0}}}
    tx+=(mx-tx)*.06;ty+=(my-ty)*.06;
    cam.position.set(tx*1.2,-ty*.9-sy*1.4,15+sy*3);cam.lookAt(cx*.3,cy*.25-sy*1.4,0);
    const k=INTRO?Math.min(1,T/INTRO):1;
    L.scale.setScalar(Math.max(.001,ls*easeOutBack(Math.min(1,k*1.15))));
    L.position.set(cx,cy+Math.sin(mt*1.1)*.12+(1-easeOut(k))*-3,0);
    L.rotation.set(-ty*.45+Math.sin(mt*.8)*.05+sy*.4,(1-easeOut(k))*Math.PI*2.5+tx*.9+Math.sin(mt*.5)*.12,(1-easeOut(k))*-.4+Math.sin(mt*.6)*.03);
    const burst=easeOut(Math.min(1,T/(INTRO+.6||1)));const n=inst.count;const mv=reduce?0:1;
    for(let i=0;i<n;i++){const p=P[i];p.a+=p.sp*dt*mv;p.y-=p.f*dt*mv;if(p.y<-8)p.y=8;
      const r=p.r*(.15+.85*burst);
      v.set(cx+Math.cos(p.a)*r,cy+p.y*burst,-1.6-Math.abs(Math.sin(p.a))*r*.55);
      eu.set(p.rx+mt*p.vx,p.ry+mt*p.vy,0);q.setFromEuler(eu);sc.setScalar(p.s*Math.min(1,burst*1.4));m.compose(v,q,sc);inst.setMatrixAt(i,m)}
    inst.instanceMatrix.needsUpdate=true;
    if(TIERS[tier].bloom)comp.render();else renderer.render(scene,cam);
  }
  function wake(){if(vis&&!document.hidden&&!running){running=true;last=0;requestAnimationFrame(frame)}}
  wake();
  host.classList.add('on');
}
start().catch(err=>{console.warn(err);host.classList.add('nogl')});
