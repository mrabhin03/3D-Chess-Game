import * as THREE from "three";
import Stats from "three/addons/libs/stats.module.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { KTX2Loader } from "./jsm/loaders/KTX2Loader.js";
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { EXRLoader } from 'three/addons/loaders/EXRLoader.js';

let renderer, camera, scene, controls, pmremGenerator;
let TurnDis=[];
const Sizes = { Width: window.innerWidth, Height: window.innerHeight };
const targetObjects = [];
const ChessPieces = [];
const Squares=[];
let currentIntersects = [];
let HoveredObject = null;
let textureKey, game,links;
let  pointer;
let SocialAlert = 0;
let MainController = true;
let texturesToLoad=0 ,texturesLoaded = 0;
let gamepause=false;
let Blackout=0
let Whiteout=0
let BlackStorage=[];
let WhiteStorage=[];

let botMode=0;

function saveOriginalTransform(obj) {
    obj.userData.MainScale = obj.scale.clone();
    obj.userData.MainRotation = obj.rotation.clone();
    obj.userData.MainPosition = obj.position.clone();
  }
function initializeScene() {
  const container = document.getElementById("container");
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x7692e7);
  container.appendChild(renderer.domElement);
  const ambient = new THREE.AmbientLight(0xFFE4B6, 0.5);
  scene.add(ambient);

  const dirLight = new THREE.DirectionalLight(0xFFE4B6, 1); 
  dirLight.position.set(18.130, 15.780, 17.951);
  const isMobile = /Mobi|Android/i.test(navigator.userAgent);
  dirLight.castShadow = !isMobile;
  if (!isMobile) {
    dirLight.shadow.mapSize.width = 512;
    dirLight.shadow.mapSize.height = 512;
  }
  scene.add(dirLight);
}
function initializeCamera() {
  camera = new THREE.PerspectiveCamera(
  45,
    Sizes.Width / Sizes.Height,
    0.02,
    100
  );
  camera.position.set(0,2,-2);
  
  
}
function initializeRenderer() {
  if (!renderer) {
    renderer = new THREE.WebGLRenderer({ antialias: true });
  }
  // Detect mobile
  const isMobile = /Mobi|Android/i.test(navigator.userAgent);
  renderer.setPixelRatio(isMobile ? 2.5 : window.devicePixelRatio);
  renderer.setSize(Sizes.Width, Sizes.Height);
  renderer.toneMappingExposure = 2.5;
}


function initializeControls() {
  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0,0,0);
  controls.enableDamping = true;
  controls.minPolarAngle = 0;
  controls.maxPolarAngle = (Math.PI / 2)-0.29;
  controls.minDistance = 0;
  controls.maxDistance = 3.5;
  controls.zoomSpeed = 2;
  controls.enablePan=false
  controls.update();
}
function initializeEnvironment() {
  pmremGenerator = new THREE.PMREMGenerator(renderer);

  new EXRLoader()
    .setPath('assets/') 
    .load('TheHdr.exr', function (texture) {
      const envMap = pmremGenerator.fromEquirectangular(texture).texture;
      scene.environment = envMap;
      scene.background = envMap; 
      texture.dispose();
      pmremGenerator.dispose();
      
    });
}

function initializeLoaders() {
  textureKey = {
    Floor:"ktx2/Background.ktx2",
    Black:"ktx2/BlackPiece.ktx2",
    Others:"ktx2/Others.ktx2",
    Square:"ktx2/TheSquares.ktx2",
    Tables:"ktx2/TheWoods.ktx2",
    White:"ktx2/WhitePicese.ktx2",
    TheFlowers:"ktx2/SideItemsGrass.ktx2",
    SideItems:"ktx2/NewSideItems.ktx2"
  };

  links = {
    GitHub: "https://github.com/mrabhin03",
    Insta: "https://www.instagram.com/mr_abhin._",
    Linkedin: "https://www.linkedin.com/in/mr-abhin",
  };
}

function initializeEventListeners() {
  ["mousemove", "touchstart"].forEach((evt) =>
    window.addEventListener(evt, handlePointerMove, { passive: false })
  );

  ["click", "touchend"].forEach((evt) =>
    window.addEventListener(evt, handlePointerClick, { passive: false })
  );

  renderer.domElement.addEventListener(
    "webglcontextlost",
    handleContextLost,
    false
  );
}
function handlePointerMove(e) {
  const x = e.type === "touchstart" ? e.touches[0].clientX : e.clientX;
  const y = e.type === "touchstart" ? e.touches[0].clientY : e.clientY;
  pointer.x = (x / window.innerWidth) * 2 - 1;
  pointer.y = -(y / window.innerHeight) * 2 + 1;
}
let selectedPiece=null;
let canMoveTo=[];

function smallBotMove() {
  if (game.game_over()) {
    alert('Game Over!');
    return;
  }
  let moves = game.moves({ verbose: true });
  let move = moves[Math.floor(Math.random() * moves.length)];
  MoveTo(move.from,move.to)
}
// const drawMoves = [
//   { from: "g1", to: "f3" }, // 1. Nf3
//   { from: "g8", to: "f6" }, // 1... Nf6
//   { from: "f3", to: "g1" }, // 2. Ng1
//   { from: "f6", to: "g8" }, // 2... Ng8
//   { from: "g1", to: "f3" }, // 3. Nf3
//   { from: "g8", to: "f6" }, // 3... Nf6
//   { from: "f3", to: "g1" }, // 4. Ng1
//   { from: "f6", to: "g8" }, // 4... Ng8
//   { from: "g1", to: "f3" }, // 5. Nf3
//   { from: "g8", to: "f6" }, // 5... Nf6
//   { from: "f3", to: "g1" }, // 6. Ng1
//   { from: "f6", to: "g8" }
// ];
// let ro0=0
// function smallBotMove2() {
//   if (game.game_over()) {
//     alert('Game Over!');
//     return;
//   }
//   if(gamepause){
//     return
//   }
//   MoveTo(drawMoves[ro0].from,drawMoves[ro0].to)
//   ro0++
// }

function TurnDisplay(turn){
  if(turn==-1 || botMode==3){
    TurnDis[0].position.y=TurnDis[0].userData.MainPosition.y;
    TurnDis[1].position.y=TurnDis[1].userData.MainPosition.y;
    return;
  }
  gsap.to(TurnDis[(turn)%2].position, {
    y: TurnDis[(turn)%2].userData.MainPosition.y+0.01,
    duration: .2,
    ease: "power2.inOut"
  });
  gsap.to(TurnDis[(turn+1)%2].position, {
    y: TurnDis[(turn+1)%2].userData.MainPosition.y,
    duration: .2,
    ease: "power2.inOut"
  });
}
function colorCheck(obj,color){
  let Theobj=null
  if(obj.name.includes("shadowPlane")){
    obj=obj.parent;
  }
  if(obj.name.includes("Piece")){
    Theobj=obj
    
  }else if(obj.name.includes("Square")){
    let temp=obj.name.split("_")
    let Post = temp[temp.length - 1];
    Theobj=ChessPieces.find(p => p.userData.NowAt == Post); 
    if(Theobj==null){
      return false
    }
  }
  return Theobj.name.includes(color)
}
function handlePointerClick(e) {
  
  if (e.target.closest("#container")) {
    e.preventDefault();

    if (currentIntersects.length > 0) {
      const obj = (currentIntersects[0].object.name.includes("shadowPlane"))?currentIntersects[0].object.parent:currentIntersects[0].object;
      for (const [key, url] of Object.entries(links)) {
        if (obj.name.includes(key)) {
          const win = window.open();
          win.opener = null;
          win.location = url;
          return
        }
      }

      let currentMover=(game.turn()=='w')?"White":"Black";
      if (game.game_over()) {
        return
      };
      if(gamepause){
        return
      }
      if(obj.name.includes("Square") || obj.name.includes("Piece")){
        if(botMode==3){
          return
        }else if(botMode==1 && (game.turn()=='w')){
          return
        }else if(botMode==2 && (game.turn()=='b')){
          return
        }
      }
      if(selectedPiece && !colorCheck(obj,currentMover)){
        let nextMove=null;
        if (obj.name.includes("Piece")) {
          nextMove=obj.userData.NowAt;
        }else if(obj.name.includes("Square")){
          let temp=obj.name.split("_")
          nextMove = temp[temp.length - 1];
        }
        if (!canMoveTo.some(move => move.to === nextMove)) {
          return;
        }
        MoveTo(selectedPiece.userData.NowAt,nextMove)
        return;
      }else{
        clearSelectPiece();
        if (obj.name.includes("Piece")) {
          selectedPiece=obj;
        }else if(obj.name.includes("Square")){
          let temp=obj.name.split("_")
          for(let i=0;i<ChessPieces.length;i++){
            if(temp[temp.length - 1]==ChessPieces[i].userData.NowAt){
              selectedPiece=ChessPieces[i];
              break;
            }
          }
        }

        if(!selectedPiece || !selectedPiece.name.includes(currentMover)){
          return
        }
        gsap.to(selectedPiece.scale, {
            x: 1.3,
            y: 1.3,
            z: 1.3,
            duration: 0.2,
            ease: "power4",
        });
        ShadowAnimation(selectedPiece,1,{r:1,g:1,b:1},1.1,0.5,0)
        
        canMoveTo = game.moves({ square: selectedPiece.userData.NowAt, verbose: true });
        highlightMove()
        return;
      }
    }
    else{
        clearSelectPiece()
      }
  }
}
function highlightMove(){
  for(let j=0;j<canMoveTo.length;j++){
    let ele=canMoveTo[j]
    gsap.to(Squares[ele.to].position, {
      y: Squares[ele.to].userData.MainPosition.y+0.01,
      duration: .3,
      ease: "power4",
    });
    if (Squares[ele.to].isMesh && Squares[ele.to].material && Squares[ele.to].material.color) {
      Squares[ele.to].material.color.set(0x00ff00);
      document.body.style.cursor = "pointer";
    }
    const piece = ChessPieces.find(p => p.userData.NowAt == ele.to); 
    if (piece) {
      Squares[ele.to].material.color.set(0xca1313);
      gsap.to(piece.position, {
        y: piece.userData.MainPosition.y+0.01,
        duration: .3,
        ease: "power4",
      });
    }
  }
}

function RemovehighlightMove(){
  canMoveTo.forEach((ele)=>{
    gsap.to(Squares[ele.to].position, {
      y: Squares[ele.to].userData.MainPosition.y,
      duration: .3,
      ease: "power4",
  });
    if (Squares[ele.to].isMesh && Squares[ele.to].material && Squares[ele.to].material.color && Squares[ele.to].userData.originalColor) {
      Squares[ele.to].material.color.copy(Squares[ele.to].userData.originalColor);
      document.body.style.cursor = "default";
    }
    const piece = ChessPieces.find(p => p.userData.NowAt == ele.to); 
    if (piece) {
      gsap.to(piece.position, {
        y: piece.userData.MainPosition.y,
        duration: .3,
        ease: "power4",
      });
    }
  })
}
function clearSelectPiece(){
  if(selectedPiece){
    gsap.to(selectedPiece.scale, {
        x: 1,
        y: 1,
        z: 1,
        duration: 0.2,
        ease: "power4",
    });
    ShadowAnimation(selectedPiece,1,{r:0,g:0,b:0},-1,0.5,0)

    selectedPiece=null;
  }
  RemovehighlightMove()
  canMoveTo=[];
}
function ShadowAnimation(obj,opacity,color,scale,duration,delay){
  const shadow = obj.getObjectByName("shadowPlane", true);
  if (shadow && shadow.material.uniforms) {
    if(scale>=0){
      gsap.to(shadow.scale, {
        x:scale,
        y:scale,
        duration: duration,
        delay:delay
      });
    }else{
      gsap.to(shadow.scale, {
        x:1,
        y:1,
        duration: duration,
        delay:delay
      });
    }
    gsap.to(shadow.material.uniforms.uOpacity, {
      value: opacity, 
      duration: duration,
      delay:delay
    });

    const colorObj = { 
      r: shadow.material.uniforms.uColor.value.r, 
      g: shadow.material.uniforms.uColor.value.g, 
      b: shadow.material.uniforms.uColor.value.b 
    };

    gsap.to(colorObj, {
      r: color.r, g: color.g, b: color.b,
      duration: duration,
      delay:delay,
      onUpdate: () => {
        shadow.material.uniforms.uColor.value.setRGB(colorObj.r, colorObj.g, colorObj.b);
      }
    });
  }
}



function MoveTo(from,To){
  if(gamepause){
    return
  }
  gamepause=true;
  
  
  let PieceToMove=null,ToSquare=Squares[To];
  for(let i=0;i<ChessPieces.length;i++){
    if(from==ChessPieces[i].userData.NowAt){
      PieceToMove=ChessPieces[i];
      break;
    }
  }
  if(PieceToMove && ToSquare){
    clearSelectPiece();
    let move = game.move({ from: from, to: To, promotion: 'q' });
    if(move==null){
      gamepause=false
      return
    }
    let delay=CapturePiece(To)?.1:0;
    PieceToMove.userData.NowAt=To
    const fromWorld = new THREE.Vector3();
    const toWorld   = new THREE.Vector3();

    Squares[from].getWorldPosition(fromWorld);
    ToSquare.getWorldPosition(toWorld);

    let distance = fromWorld.distanceTo(toWorld);
    const baseSpeed = 4;
    
    if(distance>0.3){
      distance=0.3
    }
    if(distance<0.15){
      distance=.15;
    }
    const duration = distance *baseSpeed;
    

    if(PieceToMove.name.includes("Knight")){

      gsap.to(PieceToMove.position, {
        x: ToSquare.userData.MainPosition.x,
        z: ToSquare.userData.MainPosition.z,
        duration: duration,
        delay: delay,
        ease: "power2.inOut"
      });

      gsap.to(PieceToMove.position, {
        y: ToSquare.userData.MainPosition.y + 0.06,
        duration: duration/2,
        delay: delay+.1,
        yoyo: true,
        repeat: 1,
        ease: "power1.out"
      });

    }else{
      ShadowAnimation(PieceToMove,0,{r:0,g:0,b:0},0,0,0)
      ShadowAnimation(PieceToMove,1,{r:0,g:0,b:0},1.01,duration,delay)
      

      gsap.to(PieceToMove.position, {
          x: ToSquare.userData.MainPosition.x,
          z: ToSquare.userData.MainPosition.z,
          duration: duration,
          delay:delay,
          ease: "power4",
      });
      gsap.to(PieceToMove.position, {
        y: ToSquare.userData.MainPosition.y + 0.02,
        duration: duration/3.5,
        yoyo: true,
        repeat: 1,
        ease: "power1"
      });
    }
    if(move.promotion){
      let thecolor=(move.color=='w')?"White":"Black";
     for(let i=0;i<ChessPieces.length;i++){
        if(ChessPieces[i].name.includes("Queen")&&ChessPieces[i].userData.color==thecolor){
          const queenClone = duplicatePiece(ChessPieces[i]);
          queenClone.position.copy(ToSquare.userData.MainPosition);
          ChessPieces.push(queenClone);
          targetObjects.push(queenClone);
          queenClone.userData.NowAt=To
          saveOriginalTransform(queenClone)
          gsap.to(queenClone.scale, {
            x: 0,
            y: 0,
            z: 0,
            duration: 0.0,
            ease: "back.inOut",
          });
          gsap.to(queenClone.scale, {
            x: 1,
            y: 1,
            z: 1,
            delay: delay+duration-0.2,
            duration: 0.5,
            ease: "back.inOut",
          });
          break
        }
      }
    
      
      gsap.to(PieceToMove.scale, {
        x: 0,
        y: 0,
        z: 0,
        delay: delay+duration-0.2,
        duration: 0.5,
        ease: "back.inOut",
      });
      
      removePiece(PieceToMove,(delay+duration+0.2)*900)
        
    }
    if(!game.game_over()){
      setTimeout(()=>{
        TurnDisplay((game.turn()=='w')?0:1)
        gamepause=false;
        botChecker()
      },(delay+duration+0.2)*600)
    }else{
      TurnDisplay(-1)
    }
  }else{
    gamepause=false
  }
  if (game.game_over()) {
    setTimeout(()=>{
      WinnerShowCase(game.in_checkmate())
    },1000)
    
    return;
  }
  
  isCheck()
  
}

function botChecker(){
  if(botMode==3){
    setTimeout(smallBotMove,2000)
  }else if(botMode==1 && (game.turn()=='w')){
    setTimeout(smallBotMove,1000)
  }else if(botMode==2 && (game.turn()=='b')){
    setTimeout(smallBotMove,1000)
  }
}
function WinnerShowCase(checkmate){
  
  if(checkmate){
    console.log((game.turn()=='w')?"Black":"White")
    let Winner=(game.turn()=='w')?"Black":"White";
    alert(Winner+" won the match")
    ChessPieces.forEach((ele)=>{
      if(!ele.name.includes(Winner)){
        gsap.to(ele.scale, {
            x: 0,
            y: 0,
            z: 0,
            duration: 0.7,
            ease: "back.inOut",
          });
        removePiece(ele,800)
      }
    })
    setTimeout(()=>{
      SingleWinner(ChessPieces,Squares)
    },1000)
  }else{
    alert("Its a draw")
    drawShowCase(ChessPieces,Squares)
  }
}
function SingleWinner(WinnerPieces, Squares) {
  if (WinnerPieces.length === 0) return;

  WinnerPieces.forEach((ele)=>{
    gsap.to(ele.position, {
      x: ele.userData.MainPosition.x,
      y: ele.userData.MainPosition.y,
      z: ele.userData.MainPosition.z,
      duration: 1,
      ease: "back.inOut",
    });
  })
  const king = WinnerPieces.find(p => p.userData.Name === "King");
  
  const center = new THREE.Vector3()
      .addVectors(Squares['d4'].position, Squares['e5'].position)
      .multiplyScalar(0.5);
  if (king) {
    

    gsap.to(king.position, {
      x: center.x,
      y: center.y,
      z: center.z,
      duration: 1,
      ease: "back.inOut",
    });
  }

  const others = WinnerPieces.filter(p => p !== king);
  const radius = 0.15; 
  const step = (Math.PI * 2) / others.length;

  others.forEach((piece, i) => {
    if(piece.Color==king.Color){
      const angle = i * step;
      gsap.to(piece.position, {
        x: center.x + Math.cos(angle) * radius,
        y: center.y,
        z: center.z + Math.sin(angle) * radius,
        duration: 1,
        delay:.6,
        ease: "back.inOut",
      });
      setTimeout(()=>{
        let angle = i * step;       

        gsap.to({}, {
          duration: 5,       
          repeat: -1,       
          ease: "linear",
          onUpdate: function() {
            angle += 0.02;   
            piece.position.x = center.x + Math.cos(angle) * radius;
            piece.position.z = center.z + Math.sin(angle) * radius;
            piece.position.y = center.y;
          }
        });
      },1500)
    }
  });
  gsap.to(king.rotation, {
    y: "+=" + Math.PI * 2, 
    duration: 1,
    repeat: -1,            
    ease: "linear"          
  });
  gsap.to(king.position, {
    y: king.userData.MainPosition.y+0.03, 
    duration: 2,
    yoyo:true,
    repeat: -1,            
    ease: "ease.inOut"          
  });
}

function drawShowCase(WinnerPieces, Squares) {
  if (WinnerPieces.length === 0) return;

  WinnerPieces.forEach((ele)=>{
    gsap.to(ele.position, {
      x: ele.userData.MainPosition.x,
      y: ele.userData.MainPosition.y,
      z: ele.userData.MainPosition.z,
      duration: 1,
      ease: "back.inOut",
    });
  })
  const king1 = WinnerPieces.find(p => p.name.includes("White-Piece_King"));
  const king2 = WinnerPieces.find(p => p.name.includes("Black-Piece_King"));
  
  const center = new THREE.Vector3()
      .addVectors(Squares['d4'].position, Squares['e5'].position)
      .multiplyScalar(0.5);
  const posA1 = Squares['d4'].position.clone();
  const posA2 = Squares['d5'].position.clone();
  const center1 = new THREE.Vector3().addVectors(posA1, posA2).multiplyScalar(0.5);

  const posB1 = Squares['e4'].position.clone();
  const posB2 = Squares['e5'].position.clone();
  const center2 = new THREE.Vector3().addVectors(posB1, posB2).multiplyScalar(0.5);
  if (king1) {
  gsap.to(king1.position, {
      x: center1.x,
      y: center1.y,
      z: center1.z,
      duration: 1,
      ease: "back.inOut",
    });
  }
  if (king2) {
    gsap.to(king2.position, {
      x: center2.x,
      y: center2.y,
      z: center2.z,
      duration: 1,
      ease: "back.inOut",
    });
  }

  let others = WinnerPieces.filter(p => p !== king1);
  others = others.filter(p => p !== king2);
  const radius = 0.18; 
  const step = (Math.PI * 2) / others.length;

  others.forEach((piece, i) => {
      const angle = i * step;
      gsap.to(piece.position, {
        x: center.x + Math.cos(angle) * radius,
        y: center.y,
        z: center.z + Math.sin(angle) * radius,
        duration: 1,
        delay:.6,
        ease: "back.inOut",
      });
      setTimeout(()=>{
        let angle = i * step;       

        gsap.to({}, {
          duration: 5,       
          repeat: -1,       
          ease: "linear",
          onUpdate: function() {
            angle += 0.02;   
            piece.position.x = center.x + Math.cos(angle) * radius;
            piece.position.z = center.z + Math.sin(angle) * radius;
            piece.position.y = center.y;
          }
        });
      },1500)
  });

  gsap.to(king1.rotation, {
    y: "+=" + Math.PI * 2, 
    duration: 1,
    repeat: -1,            
    ease: "linear"          
  });
  gsap.to(king1.position, {
    y: king1.userData.MainPosition.y+0.03, 
    duration: 2,
    yoyo:true,
    repeat: -1,            
    ease: "ease.inOut"          
  });
  gsap.to(king2.rotation, {
    y: "+=" + Math.PI * 2, 
    duration: 1,
    repeat: -1,            
    ease: "linear"          
  });
  gsap.to(king2.position, {
    y: king1.userData.MainPosition.y+0.03, 
    duration: 2,
    yoyo:true,
    repeat: -1,            
    ease: "ease.inOut"          
  });
}

let checkKing=null
let CheckMove=[]
function isCheck(){
  CheckMove.forEach((ele)=>{
    Squares[ele].material.color.copy(Squares[ele].userData.originalColor);
  })
  if(checkKing){
    checkKing.material.emissive.set(0x000000);
    checkKing.material.emissiveIntensity = 0;
    checkKing=null;
    CheckMove=[]
  }
  if(game.in_check()){
    let currentMover=(game.turn()=='w')?"White":"Black";
    for(let i=0;i<ChessPieces.length;i++){
      if(ChessPieces[i].name.includes("King")&&ChessPieces[i].userData.color==currentMover){
        ChessPieces[i].material.emissive.set(0xff1313);
        ChessPieces[i].material.emissiveIntensity = .5;
        checkKing=ChessPieces[i];
      }
    }
    const allMoves = game.moves({ verbose: true });
    CheckMove = [...new Set(allMoves.map(move => move.from))];
    CheckMove.forEach((ele)=>{
      Squares[ele].material.color.set(0xFFFF00);
    })
    console.log(currentMover+" is on check.")
  }
}

function duplicatePiece(original) {
  original.updateMatrixWorld(true);
  const copy = original.clone(true);
  copy.traverse(child => {
    if (child.isMesh) {
      child.material = Array.isArray(child.material)
        ? child.material.map(m => m.clone())
        : child.material.clone();
    }
  });
  try { 
    copy.userData = JSON.parse(JSON.stringify(original.userData)); 
  } catch { 
    copy.userData = { ...original.userData }; 
  }
  const parent = original.parent;
  parent.add(copy);
  copy.position.copy(original.position);
  copy.quaternion.copy(original.quaternion);
  copy.scale.copy(original.scale);
  return copy;
}


function CapturePiece(Square){
  for(let i=0;i<ChessPieces.length;i++){
    if(Square==ChessPieces[i].userData.NowAt){
      
      gsap.to(ChessPieces[i].scale, {
        x: 0,
        y: 0,
        z: 0,
        duration: 0.5,
        ease: "back.inOut",
      });
      removePiece(ChessPieces[i],500)
      return true
    }
  }
  return false;
}
function removePiece(theObj,delay){
  
  const index = targetObjects.indexOf(theObj);
  if (index !== -1) targetObjects.splice(index, 1);
  let newPosition=null
  if(theObj.userData.color=="Black"){
    if(BlackStorage.length<=Blackout){
      if(WhiteStorage.length<=Whiteout){
        theObj.parent.remove(theObj);
      }else{
        Whiteout++;
        newPosition=WhiteStorage[Whiteout];
      }
    }else{
      Blackout++
      newPosition=BlackStorage[Blackout];
    }
  }else{
    if(WhiteStorage.length<=Whiteout){
        if(BlackStorage.length<=Blackout){
          theObj.parent.remove(theObj);
        }else{
          Blackout++
          newPosition=BlackStorage[Blackout];
        }
    }else{
      Whiteout++;
      newPosition=WhiteStorage[Whiteout];
    }
  }
  
  // theObj.position.copy(ToSquare.userData.MainPosition);
  setTimeout(()=>{
    if(newPosition){
      theObj.position.copy(newPosition.position);
    }
    gsap.to(theObj.scale, {
        x: 1,
        y: 1,
        z: 1,
        duration: 0.5,
        ease: "back.inOut",
      });
    // theObj.parent.remove(theObj);
    ChessPieces.splice(ChessPieces.indexOf(theObj), 1);
  },delay)
}

function handleContextLost(event) {
  event.preventDefault();
  clearScene();
  window.location.reload();
}

function handleResize() {
  Sizes.Width = window.innerWidth;
  Sizes.Height = window.innerHeight;
  camera.aspect = Sizes.Width / Sizes.Height;
  camera.updateProjectionMatrix();
  renderer.setSize(Sizes.Width, Sizes.Height);
}

function clearScene() {
  if (renderer) {
    renderer.dispose();
    renderer.forceContextLoss();
    renderer.domElement = null;
  }

  if (scene) {
    scene.traverse((object) => {
      if (!object.isMesh) return;
      object.geometry.dispose();
      if (object.material.isMaterial) {
        cleanMaterial(object.material);
      } else {
        for (const material of object.material) cleanMaterial(material);
      }
    });
  }
}

function cleanMaterial(material) {
  material.dispose();
  for (const key in material) {
    const value = material[key];
    if (value && typeof value === "object" && "minFilter" in value) {
      value.dispose();
    }
  }
}




function initializeChess(){
  game = new Chess();
}
function load3D() {
  initializeCamera();
  initializeRenderer();
  initializeScene();
  initializeControls();
  initializeEnvironment();
  initializeLoaders();
  initializeEventListeners();
  initializeChess()
  pointer = new THREE.Vector2();
  const Sizes = { Width: window.innerWidth, Height: window.innerHeight };

  window.addEventListener("resize", handleResize);
  window.addEventListener("beforeunload", clearScene);

  

  const manager = new THREE.LoadingManager();
  const tex = new THREE.TextureLoader(manager);

  const dracoLoader = new DRACOLoader().setDecoderPath("jsm/libs/draco/gltf/");
  const loader = new GLTFLoader(manager).setDRACOLoader(dracoLoader);

  const raycaster = new THREE.Raycaster();
  const stats = new Stats();

  const ktx2Loader = new KTX2Loader()
    .setTranscoderPath("jsm/libs/basis/")
    .detectSupport(renderer);

    loader.load(
      "assets/ChessGLB.glb",
      (gltf) => {
        const model = gltf.scene;
        model.position.set(0, -1, 0);
        scene.add(model);
        model.traverse((child) => {
          if (!child.isMesh) return;
          for (const key of Object.keys(textureKey)) {
            if (child.name.includes(key)) {
              texturesToLoad++;
              break;
            }
          }
        });
    
        model.traverse((child) => {
          if (!child.isMesh) return;
          for (const [key, path] of Object.entries(textureKey)) {
            if (child.name.includes(key)) {
              ktx2Loader.load(path, (tex) => {
                tex.encoding = THREE.sRGBEncoding;
                tex.minFilter = THREE.LinearMipmapLinearFilter;
                tex.magFilter = THREE.LinearFilter;
                // if(child.name.includes("SideItems_Walls")){
                //   child.scale.y+=.6
                //   child.position.y+=1
                // }
                if(child.name.includes("Floor") || child.name.includes("Tables_Side")){
                  child.material = new THREE.MeshStandardMaterial({
                    color: 0xffffff,
                    map: tex,      
                    clearcoat:0
                  });
                }
                else if(child.name.includes("Piece") || child.name.includes("Square")){
                  child.material = new THREE.MeshStandardMaterial({
                    color: 0xffffff,
                    map: tex,  
                    roughness:(child.name.includes("Square"))?1:0,
                    metalness:(child.name.includes("Square"))?0:.4,      
                    clearcoat:1
                  });
                  // child.material = new THREE.MeshPhysicalMaterial({
                  //   color: 0xffffff,
                  //   map: tex,  
                  //   roughness:(child.name.includes("Square"))?.5:0,
                  //   metalness:(child.name.includes("Square"))?.5:1,      
                  //   clearcoat:1
                  // });
                }else if(child.name.includes("obj")||child.name.includes("Leg")||  child.name.includes("Chair")||child.name.includes("Outer_Frame")){
                  child.material = new THREE.MeshStandardMaterial({
                    color: 0xffffff,
                    map: tex,  
                    roughness:(child.name.includes("Chair")||child.name.includes("Leg"))?.7:.05,
                    metalness:.0,      
                    clearcoat:0.05
                  });
                }else if(child.name.includes("Github")||child.name.includes("Insta")||  child.name.includes("Linkedin")){
                  child.material = new THREE.MeshStandardMaterial({
                    color: 0xffffff,
                    map: tex,  
                    roughness:.3,
                    metalness:0,      
                    clearcoat:1
                  });
                  targetObjects.push(child);
                  saveOriginalTransform(child);
                }
                else{
                  child.material = new THREE.MeshStandardMaterial({
                    color: 0xffffff,
                    map: tex,  
                    roughness:1,
                  });
                }

              
                if (child.geometry) {
                  child.geometry.computeVertexNormals();
                }

                texturesLoaded++;
                if (texturesLoaded === texturesToLoad) {
                  renderer.compile(scene, camera);
                  renderer.setAnimationLoop(animate);
                }
              });
              break;
            }
          }


          if(child.name.includes("BTurn") || child.name.includes("WTurn")){
            child.material = child.material.clone();
            child.material.color.set(0xefefef);
            TurnDis[(child.name.includes("WTurn"))?0:1]=child;
            saveOriginalTransform(child);
          }
          if(child.name.includes("ChessBack")){
            child.material = child.material.clone(); 
            child.material.color.set(0x000000);
          }else 
          if(child.name.includes('Piece')){
            
            saveOriginalTransform(child);
            ChessPieces.push(child)
            targetObjects.push(child)
            let testvar=child.name.split("_")
            child.userData.NowAt=testvar[testvar.length-1];
            child.userData.color=testvar[0].split("-")[0];
            child.userData.Name=testvar[1]
            child.userData.originalColor = child.material.color.clone();
            const shadowMaterial = new THREE.ShaderMaterial({
              transparent: true,
              uniforms: {
                uOpacity: { value: 1 },
                uColor: { value: new THREE.Color(0x000000) }
              },
              vertexShader: `
                varying vec2 vUv;
                void main() {
                  vUv = uv;
                  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
              `,
              fragmentShader: `
                varying vec2 vUv;
                uniform float uOpacity;
                uniform vec3 uColor;
                void main() {
                  float dist = distance(vUv, vec2(0.5));
                  float alpha = smoothstep(0.5, 0.0, dist); // feather
                  gl_FragColor = vec4(uColor, alpha * uOpacity);
                }
              `
            });

            const shadowPlane = new THREE.Mesh(
              new THREE.PlaneGeometry(.047, .047),
              shadowMaterial
            );
            shadowPlane.rotation.x = -Math.PI / 2;
            shadowPlane.position.y = 0.001;
            shadowPlane.name = "shadowPlane";

            child.add(shadowPlane);

          }else if(child.name.includes("Square")){
            let key=child.name.split("_")[1];
            Squares[key]=child;
            saveOriginalTransform(child);
            targetObjects.push(child);
            if (child.isMesh && child.material) {
              child.material = child.material.clone();
              child.userData.originalColor = child.material.color.clone();
            }
          }else if(child.name.includes("BStorage")){
            let index=parseInt(child.name.split("e")[1])
            BlackStorage[index]=child
          }else if(child.name.includes("WStorage")){
            let index=parseInt(child.name.split("e")[1])
            WhiteStorage[index]=child;
          }else if(child.name.includes("Flower")||child.name.includes("vaze")){
            targetObjects.push(child);
            saveOriginalTransform(child);
          }
          
        });
        // setTimeout(makeBotMove, 1000);
        setTimeout(()=>{TurnDisplay(0)}, 1000);
        if (texturesToLoad === 0) {
          renderer.compile(scene, camera);
          renderer.setAnimationLoop(animate);
          
        }
      },
      undefined,
      console.error
    );
    


  let Hoverings = false;

  function playHoverAnimation(obj, isPlaying) {
    if(obj.name.includes("Tables")){
      LogoAnimatio(obj, isPlaying)
    }else{
      otherAnimations(obj, isPlaying)
    }
  }
  function LogoAnimatio(obj, isPlaying){
    const dur=.8
    gsap.to(obj.position, {
      y: obj.userData.MainPosition.y+((isPlaying)?0.01:0),
      duration: dur,
      ease: "power4",
    });
    gsap.to(obj.scale, {
      y: (isPlaying)?3:1,
      duration: dur,
      ease: "power4",
    });
  }
  function otherAnimations(obj, isPlaying){
    const dur=.8
      gsap.to(obj.scale, {
        y: (isPlaying)?1.2:1,
        z: (isPlaying)?1.2:1,
        x: (isPlaying)?1.2:1,
        duration: dur,
        ease: "power4",
      });
  }


  let loadStart = false;
  function animate() {
    
    if (!loadStart) {
      if (SocialAlert > 30) {
        Start3DPage();
        loadStart = true;
      }
      SocialAlert++
    } else {
      
      if (MainController) {
        raycaster.setFromCamera(pointer, camera);
        currentIntersects = raycaster.intersectObjects(targetObjects);
        if (currentIntersects.length > 0) {
          const selected = currentIntersects[0].object;
          if (
            ["Linkedin", "Insta",  "Github","Others"].some(
              (k) => selected.name.includes(k)
            )
          ) {
            if (HoveredObject !== selected) {
              if (HoveredObject) playHoverAnimation(HoveredObject, false);
              playHoverAnimation(selected, true);
              HoveredObject = selected;
            }
          }
          document.body.style.cursor = (selected.name.includes("Github")||selected.name.includes("Insta")||  selected.name.includes("Linkedin")||  selected.name.includes("Piece"))
            ? "pointer"
            : "default";
        } else {
          if (HoveredObject) playHoverAnimation(HoveredObject, false);
          HoveredObject = null;
          document.body.style.cursor = "default";
        }
      }
      controls.update();
    }
    stats.update();
    renderer.render(scene, camera);
  }
  
}

function Start3DPage() {
  document.getElementById(
    "LoadInnerText"
  ).innerHTML = `<div><button class="btn" onclick="active()"><i class="animation"></i>Start<i class="animation"></i></button></div>`;
}
function setBotMode(Mode){
  botMode=Mode
  if(Mode==3){
    TurnDisplay(-1)
  }else if(Mode==1){
    camera.position.set(0,1.5,2);
  }
  setTimeout(botChecker,1000)
}
function CameraTop() {
  gsap.to(camera.position, {
    x: 0,
    y: 1.5,
    z: -0.001,
    duration: 4,
    ease: "power2.inOut",
    onUpdate: () => {
      camera.lookAt(0, 0, 0);
    }
  });
}


window.load3D = load3D;
window.CameraTop = CameraTop;
window.setBotMode = setBotMode;

