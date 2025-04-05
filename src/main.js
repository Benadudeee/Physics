import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/Addons.js";

//Testing if ammo import works!
Ammo().then( start )

let physicsWorld, renderer, scene, camera, orbitControls,
    clock, tmpTrans, rigidBodies = [], hoveredObj; // Help transform objects



const canvas = document.querySelector(".three-canvas");

function setupPhysicsWorld(){
  let collisionConfig         =   new Ammo.btDefaultCollisionConfiguration();
  let dispatcher              =   new Ammo.btCollisionDispatcher(collisionConfig);
  let overlappingPairCache    =   new Ammo.btDbvtBroadphase();
  let solver                  =   new Ammo.btSequentialImpulseConstraintSolver();
  
  physicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfig);
  physicsWorld.setGravity(new Ammo.btVector3(0, -30, 0));
}

const raycaster = new THREE.Raycaster();

// Updates the mouse position inside three engine
const pointer = new THREE.Vector2();
function onPointerMove( event ) {

	// calculate pointer position in normalized device coordinates
	// (-1 to +1) for both components

	pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}


function onClickEvent(e){
  if(hoveredObj === undefined){
    console.log(hoveredObj)
    return;
  }
  const impulseVector = new Ammo.btVector3(0, 100, 0);
  const body = hoveredObj.object.userData.physicsBody;
  
  body.activate();
  body.applyImpulse(impulseVector, new Ammo.btVector3(0, 0, 0));

  // const velocity = body.getLinearVelocity();
  // console.log('Velocity after impulse:', velocity.x(), velocity.y(), velocity.z());

  // console.log(`Positioning after impulse: (${hoveredObj.object.position.x}, ${hoveredObj.object.position.y}, ${hoveredObj.object.position.z})`);
  // hoveredObj.object.userData.isHovered = false;

  // Ammo.destroy(impulseVector);
  // hoveredObj = undefined;
}

window.addEventListener( 'pointermove', onPointerMove );
window.addEventListener( 'click', onClickEvent);


function setupGraphics(){
  clock = new THREE.Clock();
  
  scene = new THREE.Scene();
  scene.background = new THREE.Color( 0xbdd1e5 );
  
  camera = new THREE.PerspectiveCamera(60, innerWidth/innerHeight, 0.2, 1000);
  camera.position.set(0, 30, 70);
  camera.lookAt(new THREE.Vector3(0, 0, 0 ));

  
  
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.1);
  hemiLight.color.setHSL( 0.6, 0.6, 0.6 );
  hemiLight.groundColor.setHSL( 0.1, 1, 0.4 );
  hemiLight.position.set( 0, 50, 0 );
  scene.add( hemiLight );
  
  let dirLight = new THREE.DirectionalLight( 0xffffff , 1);
  dirLight.color.setHSL( 0.1, 1, 0.95 );
  dirLight.position.set( -1, 1.75, 1 );
  dirLight.position.multiplyScalar( 100 );
  scene.add( dirLight );
  
  dirLight.castShadow = true;
  
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  
  let d = 50;
  
  dirLight.shadow.camera.left = -d;
  dirLight.shadow.camera.right = d;
  dirLight.shadow.camera.top = d;
  dirLight.shadow.camera.bottom = -d;
  
  dirLight.shadow.camera.far = 13500;
  
  
  renderer = new THREE.WebGLRenderer( {antialias: true, canvas} );
  renderer.setClearColor( 0xbd1f5 );
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(innerWidth, innerHeight);
  document.body.appendChild(renderer.domElement);
  
  renderer.gammaInput = true;
  renderer.gammaOutput = true;
  
  renderer.shadowMap.enabled = true;

  orbitControls = new OrbitControls(camera, renderer.domElement);
  orbitControls.enablePan = false;
  orbitControls.update();
  
  renderer.setAnimationLoop(animate);
  console.log("Graphics Done!");
}

function getNotHoveredObjs(bodies, hoveredObj){
  const notHoveredObjs = [];
    for(let i = 0; i < bodies.length; i++){
        // If the rigid body is inside the hovered state

      if(bodies[i] !== hoveredObj.object){
          notHoveredObjs.push(bodies[i]);
      }
    }

    return notHoveredObjs;
}

function checkHoverState(){
  raycaster.setFromCamera( pointer, camera );

	// Get the closest object from the list of many ray casted objects
	hoveredObj = raycaster.intersectObjects( rigidBodies )[0];

  let notHoveredObjs = (hoveredObj === undefined)? [...rigidBodies] : getNotHoveredObjs(rigidBodies, hoveredObj);
  
  // Filter if there's a hovered object (I'll probably need to use a different algorithm)}
  
  if(hoveredObj !== undefined){
    hoveredObj.object.userData.isHovered = true;
    // console.log(hoveredObj.object.userData.isHovered, hoveredObj.object);
  }
  for (let j = 0; j < notHoveredObjs.length; j++){
    notHoveredObjs[j].userData.isHovered = false;
  }
}

function animate(){
  let deltaTime = clock.getDelta();
  
  checkHoverState();
  updatePhysics( deltaTime );
  renderer.render(scene, camera);
}

function createFloor(){
  
  let pos = {x: 0, y: 0, z: 0};
  let scale = {x: 50, y: 2, z: 50};
  let quat = {x: 0, y: 0, z: 0, w: 1};
  let mass = 0;
  
  //threeJS Section
  let blockPlane = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshPhongMaterial({color: 0xa0afa4}));
  
  blockPlane.position.set(pos.x, pos.y, pos.z);
  blockPlane.scale.set(scale.x, scale.y, scale.z);
  
  blockPlane.castShadow = true;
  blockPlane.receiveShadow = true;
  
  scene.add(blockPlane);
  
  
  //Ammojs Section
  let transform = new Ammo.btTransform();
  transform.setIdentity();
  transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
  transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
  let motionState = new Ammo.btDefaultMotionState( transform );
  
  let colShape = new Ammo.btBoxShape( new Ammo.btVector3( scale.x * 0.5, scale.y * 0.5, scale.z * 0.5 ) );
  colShape.setMargin( 0.05 );
  
  let localInertia = new Ammo.btVector3( 0, 0, 0 );
  colShape.calculateLocalInertia( mass, localInertia );
  
  let rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, colShape, localInertia );
  let body = new Ammo.btRigidBody( rbInfo );
  
  
  physicsWorld.addRigidBody( body );
}

/**
 * 
 * @param {*} position { x, y, z }
 * @param {*} quaternion { x, y, z, w }
 * @param {*} properties { radius, mass color }
*/

function createSphereObj(position, quaternion, properties){
  // Three object
  const threeSphere = new THREE.Mesh(new THREE.SphereGeometry(properties.radius), new THREE.MeshPhongMaterial({color: properties.color}));
  threeSphere.position.set(position.x, position.y, position.z);
  
  threeSphere.castShadow = true;
  threeSphere.receiveShadow = true;
  
  scene.add(threeSphere);
  
  // Connect Ammo properties to three object
  let transform = new Ammo.btTransform();
  transform.setIdentity();
  transform.setOrigin(new Ammo.btVector3(position.x, position.y, position.z));
  transform.setRotation(new Ammo.btQuaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w));
  
  let motionState = new Ammo.btDefaultMotionState( transform );
  let colShape = new Ammo.btSphereShape( properties.radius );
  colShape.setMargin( 0.05 );

  let localInertia = new Ammo.btVector3(0, 0, 0);
  colShape.calculateLocalInertia(properties.mass, localInertia);

  let rbInfo = new Ammo.btRigidBodyConstructionInfo(properties.mass, motionState, colShape, localInertia);
  let body = new Ammo.btRigidBody( rbInfo );

  body.setFriction(4);
  body.setRollingFriction(10);

  physicsWorld.addRigidBody( body );
  threeSphere.userData.physicsBody = body;
  threeSphere.userData.isHovered = false;
  threeSphere.userData.defaultColor = properties.color;
  
  rigidBodies.push(threeSphere);

  // console.log(threeSphere.userData.physicsBody);
}


function updatePhysics( deltaTime ){
  // Step world
  physicsWorld.stepSimulation( deltaTime, 10 );
  
  // Update rigid bodies
  for ( let i = 0; i < rigidBodies.length; i++ ) {
    let objThree = rigidBodies[ i ];
    let objAmmo = objThree.userData.physicsBody;
    let ms = objAmmo.getMotionState();

    if(objThree.userData.isHovered){
      objThree.material.color.set("red");
    } else{
      objThree.material.color.set(objThree.userData.defaultColor);
    }
      // If object is in motion
      
      if ( ms ) {
        // Transform it, and update THREE object to match it's body
        ms.getWorldTransform( tmpTrans );
        let p = tmpTrans.getOrigin();
        let q = tmpTrans.getRotation();

        objThree.position.set( p.x(), p.y(), p.z() );
        objThree.quaternion.set( q.x(), q.y(), q.z(), q.w() );
        
      }
    }
    orbitControls.update();
    detectCollision();
  }
  
  function detectCollision(){
    
    let dispatcher = physicsWorld.getDispatcher();
    
    let numManifolds = dispatcher.getNumManifolds();
  
    for ( let i = 0; i < numManifolds; i ++ ) {
  
      let contactManifold = dispatcher.getManifoldByIndexInternal( i );
      let numContacts = contactManifold.getNumContacts();
  
      for ( let j = 0; j < numContacts; j++ ) {
  
        let contactPoint = contactManifold.getContactPoint( j );
        let distance = contactPoint.getDistance();
        
        // console.log({manifoldIndex: i, contactIndex: j, distance: distance});
      }
      
      
    }
    
  }
  
  function start(){
    tmpTrans = new Ammo.btTransform();
    
    setupPhysicsWorld();
    setupGraphics();
    createFloor();
    // createBall();
    // createJointObjects();
    
    for(let i = 0; i < 5; i++){
      createSphereObj({ x: -3 + (3*i), y:20, z:0 }, {x:0, y:0, z:0, w:1}, {radius: 1 + (i * 1), mass:2 + (i * 0.5), color:"green"});
      // rigidBodies[i].userData.physicsBody.applyImpulse(new Ammo.btVector3(0, 0, 1 + (i * 2)));
    }

    // createSphereObj({ x: 0, y:20, z:0 }, {x:0, y:0, z:0, w:1}, {radius: 3, mass:1, color:"blue"})
  }