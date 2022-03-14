/**
*	Prud'homme
*	Marie-Anne
*	1054064
*/

import * as THREE from './build/three.module.js';

import Stats from './jsm/libs/stats.module.js';

import {
    ColladaLoader
}
from './jsm/loaders/ColladaLoader.js';

import {
    OrbitControls
}
from './jsm/controls/OrbitControls.js'

var gDegreesRotated = 0.0;

//SPECIAL IMPORT
// THREEx.KeyboardState.js keep the current state of the keyboard.
// It is possible to query it at any time. No need of an event.
// This is particularly convenient in loop driven case, like in
// 3D demos or games.
//
// # Usage
//
// **Step 1**: Create the object
//
// ```var keyboard	= new THREEx.KeyboardState();```
//
// **Step 2**: Query the keyboard state
//
// This will return true if shift and A are pressed, false otherwise
//
// ```keyboard.pressed("shift+A")```
//
// **Step 3**: Stop listening to the keyboard
//
// ```keyboard.destroy()```
//
// NOTE: this library may be nice as standaline. independant from three.js
// - rename it keyboardForGame
//
// # Code
//

/** @namespace */
var THREEx = THREEx || {};

/**
 * - NOTE: it would be quite easy to push event-driven too
 *   - microevent.js for events handling
 *   - in this._onkeyChange, generate a string from the DOM event
 *   - use this as event name
 */
THREEx.KeyboardState = function (domElement) {
    this.domElement = domElement || document;
    // to store the current state
    this.keyCodes = {};
    this.modifiers = {};

    // create callback to bind/unbind keyboard events
    var _this = this;
    this._onKeyDown = function (event) {
        _this._onKeyChange(event)
    }
    this._onKeyUp = function (event) {
        _this._onKeyChange(event)
    }

    // bind keyEvents
    this.domElement.addEventListener("keydown", this._onKeyDown, false);
    this.domElement.addEventListener("keyup", this._onKeyUp, false);

    // create callback to bind/unbind window blur event
    this._onBlur = function () {
        for (var prop in _this.keyCodes)
            _this.keyCodes[prop] = false;
        for (var prop in _this.modifiers)
            _this.modifiers[prop] = false;
    }

    // bind window blur
    window.addEventListener("blur", this._onBlur, false);
}

/**
 * To stop listening of the keyboard events
 */
THREEx.KeyboardState.prototype.destroy = function () {
    // unbind keyEvents
    this.domElement.removeEventListener("keydown", this._onKeyDown, false);
    this.domElement.removeEventListener("keyup", this._onKeyUp, false);

    // unbind window blur event
    window.removeEventListener("blur", this._onBlur, false);
}

THREEx.KeyboardState.MODIFIERS = ['shift', 'ctrl', 'alt', 'meta'];
THREEx.KeyboardState.ALIAS = {
    'left': 37,
    'up': 38,
    'right': 39,
    'down': 40,
    'space': 32,
    'pageup': 33,
    'pagedown': 34,
    'tab': 9,
    'escape': 27
};

/**
 * to process the keyboard dom event
 */
THREEx.KeyboardState.prototype._onKeyChange = function (event) {
    // log to debug
    //console.log("onKeyChange", event, event.keyCode, event.shiftKey, event.ctrlKey, event.altKey, event.metaKey)

    // update this.keyCodes
    var keyCode = event.keyCode
        var pressed = event.type === 'keydown' ? true : false
        this.keyCodes[keyCode] = pressed
        // update this.modifiers
        this.modifiers['shift'] = event.shiftKey
        this.modifiers['ctrl'] = event.ctrlKey
        this.modifiers['alt'] = event.altKey
        this.modifiers['meta'] = event.metaKey
}

/**
 * query keyboard state to know if a key is pressed of not
 *
 * @param {String} keyDesc the description of the key. format : modifiers+key e.g shift+A
 * @returns {Boolean} true if the key is pressed, false otherwise
 */
THREEx.KeyboardState.prototype.pressed = function (keyDesc) {
    var keys = keyDesc.split("+");
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i]
            var pressed = false
            if (THREEx.KeyboardState.MODIFIERS.indexOf(key) !== -1) {
                pressed = this.modifiers[key];
            } else if (Object.keys(THREEx.KeyboardState.ALIAS).indexOf(key) != -1) {
                pressed = this.keyCodes[THREEx.KeyboardState.ALIAS[key]];
            } else {
                pressed = this.keyCodes[key.toUpperCase().charCodeAt(0)]
            }
            if (!pressed)
                return false;
    };
    return true;
}

/**
 * return true if an event match a keyDesc
 * @param  {KeyboardEvent} event   keyboard event
 * @param  {String} keyDesc string description of the key
 * @return {Boolean}         true if the event match keyDesc, false otherwise
 */
THREEx.KeyboardState.prototype.eventMatches = function (event, keyDesc) {
    var aliases = THREEx.KeyboardState.ALIAS
        var aliasKeys = Object.keys(aliases)
        var keys = keyDesc.split("+")
        // log to debug
        // console.log("eventMatches", event, event.keyCode, event.shiftKey, event.ctrlKey, event.altKey, event.metaKey)
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            var pressed = false;
            if (key === 'shift') {
                pressed = (event.shiftKey ? true : false)
            } else if (key === 'ctrl') {
                pressed = (event.ctrlKey ? true : false)
            } else if (key === 'alt') {
                pressed = (event.altKey ? true : false)
            } else if (key === 'meta') {
                pressed = (event.metaKey ? true : false)
            } else if (aliasKeys.indexOf(key) !== -1) {
                pressed = (event.keyCode === aliases[key] ? true : false);
            } else if (event.keyCode === key.toUpperCase().charCodeAt(0)) {
                pressed = true;
            }
            if (!pressed)
                return false;
        }
        return true;
}

let container, stats, clock, controls;
let lights, camera, scene, renderer, human, humanGeometry, humanMaterial, humanMesh, robot, cloud, cloudMaterial;
let bed, phone, robot2, robot3, robot4, robot5, robot6;
let skinWeight, skinIndices, boneArray, realBones, boneDict, centerOfMass;

THREE.Cache.enabled = true;


THREE.Object3D.prototype.setMatrix = function (a) {
    this.matrix = a;
    this.matrix.decompose(this.position, this.quaternion, this.scale);
};


class Cloud { 
    constructor(mat) {

        this.cloudRadius = 10;

        // Material
       // this.material = new THREE.MeshNormalMaterial();
       this.mat = mat;

        // Initial pose
        this.initialize()
    }

        initialize() {
            // Cloud
            var cloudGeometry = new THREE.CircleGeometry(this.cloudRadius, 64, 0, pi);
            if (!this.hasOwnProperty("cloud"))
                this.cloud = new THREE.Mesh(cloudGeometry, this.mat);
            
            // Phone matrix
            this.cloudMatrix = new THREE.Matrix4().set(
            1, 0, 0, 0,
            0, 1, 0, -2.5,//+this.cloudRadius,
            0, 0, 1, -8,
            0, 0, 0, 1);

            //Apply transformation
            this.cloud.setMatrix(this.cloudMatrix);
            if (scene.getObjectById(this.cloud.id) === undefined)
                scene.add(this.cloud);
        }

        hideCloud() {
            this.cloud.visible = false;
        }    

        showCloud() { 
            this.cloud.visible = true;
        }
}

class Bed { 
    constructor() {

        this.mattressHeight = 0.3;
        this.mattressWidth = 4 ;
        this.mattressDepth = 6;

        this.pillowHeight = 0.2;
        this.pillowWidth = 1.8;
        this.pillowDepth = 1;

        this.legHeight = 0.8;
        this.legRadius = 0.05;


        // Material
        this.loader = new THREE.TextureLoader();

        this.materialPillow = new THREE.MeshBasicMaterial({
          map: this.loader.load('textures/pillow.jpg'),
        });

        this.materialMattress = new THREE.MeshBasicMaterial({
            map: this.loader.load('textures/mattress.jpg'),
          });

        this.materialLeg= new THREE.MeshBasicMaterial({
            map: this.loader.load('textures/bed_leg.png'),
          });
    
        // Initial pose
        this.initialize()
    }

        initialize() {
            // Mattress
            var mattressGeometry = new THREE.BoxGeometry(this.mattressWidth, this.mattressHeight, this.mattressDepth, 64);
            if (!this.hasOwnProperty("mattress"))
                this.mattress = new THREE.Mesh(mattressGeometry, this.materialMattress);
            
            // Pillow Right
            var pillowRightGeometry = new THREE.BoxGeometry(this.pillowWidth, this.pillowHeight, this.pillowDepth, 64);
            if (!this.hasOwnProperty("pillow_right"))
                this.pillow_right = new THREE.Mesh(pillowRightGeometry, this.materialPillow);

            // Pillow Left
            var pillowLeftGeometry = new THREE.BoxGeometry(this.pillowWidth, this.pillowHeight, this.pillowDepth, 64);
            if (!this.hasOwnProperty("pillow_left"))
                this.pillow_left = new THREE.Mesh(pillowLeftGeometry, this.materialPillow);

            //  Leg Front Right
            var legFrontRightGeometry = new THREE.CylinderGeometry(this.legRadius, this.legRadius, this.legHeight, 64);
            if (!this.hasOwnProperty("leg_front_right"))
                this.leg_front_right = new THREE.Mesh(legFrontRightGeometry, this.materialLeg);

            //  Leg Front Left
            var legFrontLeftGeometry = new THREE.CylinderGeometry(this.legRadius, this.legRadius, this.legHeight, 64);
            if (!this.hasOwnProperty("leg_front_left"))
                this.leg_front_left = new THREE.Mesh(legFrontLeftGeometry, this.materialLeg);
            
            //  Leg Back Right
            var legBackRightGeometry = new THREE.CylinderGeometry(this.legRadius, this.legRadius, this.legHeight, 64);
            if (!this.hasOwnProperty("leg_back_right"))
                this.leg_back_right = new THREE.Mesh(legBackRightGeometry, this.materialLeg);    

            //  Leg Back Left
            var legBackLeftGeometry = new THREE.CylinderGeometry(this.legRadius, this.legRadius, this.legHeight, 64);
            if (!this.hasOwnProperty("leg_back_left"))
                this.leg_back_left = new THREE.Mesh(legBackLeftGeometry, this.materialLeg);

            // Mattress matrix
            this.mattressMatrix = new THREE.Matrix4().set(
            1, 0, 0, 0,
            0, 1, 0, -1.52,
            0, 0, 1, 0,
            0, 0, 0, 1);

            // Pillow Right matrix
            this.pillowRightMatrix = new THREE.Matrix4().set(
                1, 0, 0, -this.mattressWidth/2+this.pillowWidth/2,
                0, 1, 0, this.mattressHeight/2+this.pillowHeight/2,
                0, 0, 1, -this.mattressDepth/2+this.pillowDepth/2,
                0, 0, 0, 1);
            var pillowRightMatrix = new THREE.Matrix4().multiplyMatrices(this.mattressMatrix, this.pillowRightMatrix);

            // Pillow Left matrix
            this.pillowLeftMatrix = new THREE.Matrix4().set(
                1, 0, 0, this.mattressWidth/2-this.pillowWidth/2,
                0, 1, 0, this.mattressHeight/2+this.pillowHeight/2,
                0, 0, 1, -this.mattressDepth/2+this.pillowDepth/2,
                0, 0, 0, 1);
            var pillowLeftMatrix = new THREE.Matrix4().multiplyMatrices(this.mattressMatrix, this.pillowLeftMatrix);

            // Leg Front Right matrix
            this.legFrontRightMatrix = new THREE.Matrix4().set(
            1, 0, 0, -this.mattressWidth/2,
            0, 1, 0, -this.mattressHeight/2-this.legHeight/2,
            0, 0, 1, this.mattressDepth/2,
            0, 0, 0, 1);
            var legFrontRightMatrix = new THREE.Matrix4().multiplyMatrices(this.mattressMatrix, this.legFrontRightMatrix);

            // Leg Front Left matrix
            this.legFrontLeftMatrix = new THREE.Matrix4().set(
                1, 0, 0, this.mattressWidth/2,
                0, 1, 0, -this.mattressHeight/2-this.legHeight/2,
                0, 0, 1, this.mattressDepth/2,
                0, 0, 0, 1);
            var legFrontLeftMatrix = new THREE.Matrix4().multiplyMatrices(this.mattressMatrix, this.legFrontLeftMatrix);
            
            // Leg Back Right matrix
            this.legBackRightMatrix = new THREE.Matrix4().set(
            1, 0, 0, -this.mattressWidth/2,
            0, 1, 0, -this.mattressHeight/2-this.legHeight/2,
            0, 0, 1, -this.mattressDepth/2,
            0, 0, 0, 1);
            var legBackRightMatrix = new THREE.Matrix4().multiplyMatrices(this.mattressMatrix, this.legBackRightMatrix);  
            
            // Leg Back Left matrix
            this.legBackLeftMatrix = new THREE.Matrix4().set(
                1, 0, 0, this.mattressWidth/2,
                0, 1, 0, -this.mattressHeight/2-this.legHeight/2,
                0, 0, 1, -this.mattressDepth/2,
                0, 0, 0, 1);
            var legBackLeftMatrix = new THREE.Matrix4().multiplyMatrices(this.mattressMatrix, this.legBackLeftMatrix);

            //Apply transformation
            this.mattress.setMatrix(this.mattressMatrix);
            if (scene.getObjectById(this.mattress.id) === undefined)
                scene.add(this.mattress);

            this.pillow_right.setMatrix(pillowRightMatrix);
            if (scene.getObjectById(this.pillow_right.id) === undefined)
                scene.add(this.pillow_right);

            this.pillow_left.setMatrix(pillowLeftMatrix);
            if (scene.getObjectById(this.pillow_left.id) === undefined)
                scene.add(this.pillow_left);

            this.leg_front_right.setMatrix(legFrontRightMatrix);
            if (scene.getObjectById(this.leg_front_right.id) === undefined)
                scene.add(this.leg_front_right);
                
            this.leg_front_left.setMatrix(legFrontLeftMatrix);
            if (scene.getObjectById(this.leg_front_left.id) === undefined)
                scene.add(this.leg_front_left);
            
            this.leg_back_right.setMatrix(legBackRightMatrix);
            if (scene.getObjectById(this.leg_back_right.id) === undefined)
                scene.add(this.leg_back_right);
                
            this.leg_back_left.setMatrix(legBackLeftMatrix);
            if (scene.getObjectById(this.leg_back_left.id) === undefined)
                scene.add(this.leg_back_left);    
        }

        hideBed() {
            this.mattress.visible = false;
            this.pillow_right.visible = false;
            this.pillow_left.visible = false;
            this.leg_front_right.visible = false;
            this.leg_front_left.visible = false;
            this.leg_back_right.visible = false;
            this.leg_back_left.visible = false;
        }    

        showBed() { 
            this.mattress.visible = true;
            this.pillow_right.visible = true;
            this.pillow_left.visible = true;
            this.leg_front_right.visible = true;
            this.leg_front_left.visible = true;
            this.leg_back_right.visible = true;
            this.leg_back_left.visible = true;
        }
       
}

class Phone { 
    constructor() {

        this.phoneHeight = 0.32;
        this.phoneWidth = 0.02;
        this.phoneDepth = 0.17;


        // Material : https://threejsfundamentals.org/threejs/lessons/threejs-textures.html
        this.loader = new THREE.TextureLoader();

        this.materials = [
            new THREE.MeshBasicMaterial({map: this.loader.load('textures/phone_front.jpg')}),
            new THREE.MeshBasicMaterial({map: this.loader.load('textures/phone_back.jpg')}),
            new THREE.MeshBasicMaterial({map: this.loader.load('textures/phone_side.jpg')}),
            new THREE.MeshBasicMaterial({map: this.loader.load('textures/phone_side.jpg')}),
            new THREE.MeshBasicMaterial({map: this.loader.load('textures/phone_side.jpg')}),
            new THREE.MeshBasicMaterial({map: this.loader.load('textures/phone_side.jpg')}),
          ];
     
        // Initial pose
        this.initialize()
    }

        initialize() {
            // Phone
            var phoneGeometry = new THREE.BoxGeometry(this.phoneWidth, this.phoneHeight, this.phoneDepth, 64);
            if (!this.hasOwnProperty("phone"))
                this.phone = new THREE.Mesh(phoneGeometry, this.materials);
            
            // Phone matrix
            this.phoneMatrix = new THREE.Matrix4().set(
            1, 0, 0, -0.4,
            0, 1, 0, -0.5,
            0, 0, 1, 2.43,
            0, 0, 0, 1);

            //Apply transformation
            this.phone.setMatrix(this.phoneMatrix);
            if (scene.getObjectById(this.phone.id) === undefined)
                scene.add(this.phone);

        }

        hidePhone() {
            this.phone.visible = false;
        }    

        showPhone() { 
            this.phone.visible = true;
        }
}

class Robot {
    constructor(h) {
        this.spineLength = 0.65305 ;
		this.chestLength =0.46487;
		this.neckLength = 0.24523
		this.headLength = 0.39284;
		
		this.armLength = 0.72111;
		this.forearmLength = 0.61242;
		this.legLength = 1.16245;
		this.shinLength = 1.03432;
		
		this.armLeftRotation = realBones[4].rotation;
		this.forearmLeftRotation = realBones[5].rotation;
		this.armRightRotation  = realBones[6].rotation;
		this.forearmRightRotation = realBones[7].rotation;
		
		this.legLeftRotation = realBones[8].rotation;
		this.shinLeftRotation = realBones[9].rotation;
		this.legRightRotation = realBones[10].rotation;
		this.shinRightRotation = realBones[11].rotation;
		
		this.spineTranslation = realBones[0].position;
		this.chestTranslation = realBones[1].position;
		this.neckTranslation = realBones[2].position;
		this.headTranslation = realBones[3].position;
		this.armLeftTranslation = realBones[4].position;
		this.forearmLeftTranslation =  realBones[5].position;
		this.armRightTranslation  = realBones[6].position;
		this.forearmRightTranslation = realBones[7].position;
		
		this.legLeftTranslation =  realBones[8].position;
		this.shinLeftTranslation =  realBones[9].position;
		this.legRightTranslation=  realBones[10].position;
		this.shinRightTranslation =  realBones[11].position;
		
		
        this.bodyWidth = 0.2;
        this.bodyDepth = 0.2;

      
        this.neckRadius = 0.1;
        this.headRadius = 0.32;
        this.legRadius = 0.10;
        this.thighRadius = 0.1;
        this.footDepth = 0.4;
        this.footWidth = 0.25;
        this.footHeight = 0.10;

        this.armRadius = 0.10;

        this.handRadius = 0.1;

        // Material
        this.material = new THREE.MeshNormalMaterial();
        this.human = h;
        // Initial pose
        this.initialize()
    }

    initialize() {
        // Spine geomerty
        var spineGeometry = new THREE.CylinderGeometry(0.5*this.bodyWidth / 2, this.bodyWidth / 2,this.spineLength, 64);
        if (!this.hasOwnProperty("spine"))
            this.spine = new THREE.Mesh(spineGeometry, this.material);
		
		var chestGeometry = new THREE.CylinderGeometry(0.5*this.bodyWidth / 2, this.bodyWidth / 2, this.chestLength, 64);
		 if (!this.hasOwnProperty("chest"))
            this.chest = new THREE.Mesh(chestGeometry, this.material);
		
        // Neck geomerty
        var neckGeometry = new THREE.CylinderGeometry(0.5*this.neckRadius, this.neckRadius, this.neckLength, 64);
        if (!this.hasOwnProperty("neck"))
            this.neck = new THREE.Mesh(neckGeometry, this.material);

        // Head geomerty
        var headGeometry = new THREE.SphereGeometry(this.headLength/2, 64, 3);
        if (!this.hasOwnProperty("head"))
            this.head = new THREE.Mesh(headGeometry, this.material);

        // Left Arm Geometry
        var leftArmGeometry = new THREE.CylinderGeometry(this.armRadius/ 2, this.armRadius , this.armLength, 64);
        if (!this.hasOwnProperty("arm_l"))
            this.arm_l = new THREE.Mesh(leftArmGeometry, this.material);
        
        // Left Forearm Geometry
        var leftForearmGeometry = new THREE.CylinderGeometry(this.armRadius/ 2, this.armRadius , this.forearmLength, 64);
        if (!this.hasOwnProperty("forearm_l"))
            this.forearm_l = new THREE.Mesh(leftForearmGeometry, this.material);
        
        // Left Hand Geometry
        var leftHandGeometry = new THREE.SphereGeometry(this.handRadius, 64, 3);
        if (!this.hasOwnProperty("hand_l"))
            this.hand_l = new THREE.Mesh(leftHandGeometry, this.material);

        // Right Arm Geometry
        var rightArmGeometry = new THREE.CylinderGeometry(this.armRadius/ 2, this.armRadius , this.armLength, 64);
        if (!this.hasOwnProperty("arm_r"))
            this.arm_r = new THREE.Mesh(rightArmGeometry, this.material);
        
        // Right Forearm Geometry
        var rightForearmGeometry = new THREE.CylinderGeometry(this.armRadius/ 2, this.armRadius , this.forearmLength, 64);
        if (!this.hasOwnProperty("forearm_r"))
            this.forearm_r = new THREE.Mesh(rightForearmGeometry, this.material);
        
        // Right Hand Geometry
        var rightHandGeometry = new THREE.SphereGeometry(this.handRadius, 64, 3);
        if (!this.hasOwnProperty("hand_r"))
            this.hand_r = new THREE.Mesh(rightHandGeometry, this.material);

        // Left Leg Geometry
        var leftLegGeometry = new THREE.CylinderGeometry(this.thighRadius/2, this.legRadius, this.legLength, 64);
        if (!this.hasOwnProperty("leg_l"))
            this.leg_l = new THREE.Mesh(leftLegGeometry, this.material);
        
        // Left Shin Geometry
        var leftShinGeometry = new THREE.CylinderGeometry(this.legRadius/2, this.legRadius, this.shinLength, 64);
        if (!this.hasOwnProperty("shin_l"))
            this.shin_l = new THREE.Mesh(leftShinGeometry, this.material);

        // Left Foot Geometry
        var leftFootGeometry = new THREE.BoxGeometry(this.footWidth, this.footHeight, this.footDepth, 64);
        if (!this.hasOwnProperty("foot_l"))
            this.foot_l = new THREE.Mesh(leftFootGeometry, this.material);

        // Right Leg Geometry
        var rightLegGeometry = new THREE.CylinderGeometry(this.thighRadius/2, this.legRadius, this.legLength, 64);
        if (!this.hasOwnProperty("leg_r"))
            this.leg_r = new THREE.Mesh(rightLegGeometry, this.material);
        
        // Right Shin Geometry
        var rightShinGeometry = new THREE.CylinderGeometry(this.legRadius/2, this.legRadius, this.shinLength, 64);
        if (!this.hasOwnProperty("shin_r"))
            this.shin_r = new THREE.Mesh(rightShinGeometry, this.material);

        // Right Foot Geometry
        var rightFootGeometry = new THREE.BoxGeometry(this.footWidth, this.footHeight, this.footDepth, 64);
        if (!this.hasOwnProperty("foot_r"))
            this.foot_r = new THREE.Mesh(rightFootGeometry, this.material);

        // Spine matrix
        this.spineMatrix = new THREE.Matrix4().set(
                1, 0, 0, 0,
                0, 1, 0, this.spineTranslation.y+this.spineLength/2,
                0, 0, 1, 0,
                0, 0, 0, 1);
		
        this.chestMatrix = new THREE.Matrix4().set(
                1, 0, 0, 0,
                0, 1, 0, this.chestTranslation.y-this.spineLength/2+this.chestLength/2,
                0, 0, 1, 0,
                0, 0, 0, 1);
		var chestMatrix =  new THREE.Matrix4().multiplyMatrices(this.spineMatrix, this.chestMatrix);

        // Neck matrix
        this.neckMatrix = new THREE.Matrix4().set(
                1, 0, 0, 0,
                0, 1, 0, this.neckTranslation.y-this.chestLength/2+this.neckLength/2,
                0, 0, 1, 0,
                0, 0, 0, 1);
        var neckMatrix = new THREE.Matrix4().multiplyMatrices(chestMatrix, this.neckMatrix);

        // Head matrix
        this.headMatrix = new THREE.Matrix4().set(
                1, 0, 0, 0,
                0, 1, 0, this.headTranslation.y-this.neckLength/2+this.headLength/2,
                0, 0, 1, 0,
                0, 0, 0, 1);
        var headMatrix = new THREE.Matrix4().multiplyMatrices(neckMatrix, this.headMatrix);

        // Left Arm Matrix
        this.armLeftMatrix = new THREE.Matrix4().set(
            1, 0, 0, this.armLeftTranslation.x,
            0, 1, 0, this.armLeftTranslation.y-this.chestLength/2, // augmente d'un demi chest
            0, 0, 1, this.armLeftTranslation.z,
            0, 0, 0, 1); 
        this.armLeftMatrix = matMul( this.armLeftMatrix, rotZ(this.armLeftRotation.z) );
        this.armLeftMatrix = matMul( this.armLeftMatrix, rotY(this.armLeftRotation.y) );
        this.armLeftMatrix = matMul( this.armLeftMatrix, rotX(this.armLeftRotation.x) );
        this.armLeftMatrix = matMul( this.armLeftMatrix, translation(0, this.armLength/2 , 0) );
        var armLeftMatrix = new THREE.Matrix4().multiplyMatrices(chestMatrix, this.armLeftMatrix);

        // Left Forearm Matrix 
        this.forearmLeftMatrix = new THREE.Matrix4().set(
            1, 0, 0, this.forearmLeftTranslation.x,
            0, 1, 0, this.forearmLeftTranslation.y-this.armLength/2+this.forearmLength/2,
            0, 0, 1, this.forearmLeftTranslation.z,
            0, 0, 0, 1);
        this.forearmLeftMatrix = matMul( this.forearmLeftMatrix, translation(0,-this.forearmLength/2,0) );
        this.forearmLeftMatrix = matMul( this.forearmLeftMatrix, rotZ(this.forearmLeftRotation.z) );
        this.forearmLeftMatrix = matMul( this.forearmLeftMatrix, rotY(this.forearmLeftRotation.y) );
        this.forearmLeftMatrix = matMul( this.forearmLeftMatrix, rotX(this.forearmLeftRotation.x) );    
        this.forearmLeftMatrix = matMul( this.forearmLeftMatrix, translation(0, this.forearmLength/2,0) ); 
        var forearmLeftMatrix = new THREE.Matrix4().multiplyMatrices(armLeftMatrix, this.forearmLeftMatrix);

        // Left Hand Matrix
        this.handLeftMatrix = new THREE.Matrix4().set(
            1, 0, 0, this.forearmLeftTranslation.x,
            0, 1, 0, this.forearmLength/2+this.handRadius,
            0, 0, 1, 0,
            0, 0, 0, 1);
        var handLeftMatrix = new THREE.Matrix4().multiplyMatrices(forearmLeftMatrix, this.handLeftMatrix);

        // Right Arm Matrix
        this.armRightMatrix = new THREE.Matrix4().set(
            1, 0, 0, this.armRightTranslation.x,
            0, 1, 0, this.armRightTranslation.y-this.chestLength/2, 
            0, 0, 1, this.armRightTranslation.z,
            0, 0, 0, 1);
        this.armRightMatrix = matMul( this.armRightMatrix, rotZ(this.armRightRotation.z) );
        this.armRightMatrix = matMul( this.armRightMatrix, rotY(this.armRightRotation.y) );
        this.armRightMatrix = matMul( this.armRightMatrix, rotX(this.armRightRotation.x) );
        this.armRightMatrix = matMul( this.armRightMatrix, translation(0, this.armLength/2, 0) );
        var armRightMatrix = new THREE.Matrix4().multiplyMatrices(chestMatrix, this.armRightMatrix);

        // Right Forearm Matrix 
        this.forearmRightMatrix = new THREE.Matrix4().set(
            1, 0, 0, this.forearmRightTranslation.x,
            0, 1, 0, this.forearmRightTranslation.y-this.armLength/2+this.forearmLength/2,
            0, 0, 1, this.forearmRightTranslation.z,
            0, 0, 0, 1);
        this.forearmRightMatrix = matMul( this.forearmRightMatrix, translation(0,-this.forearmLength/2,0) );
        this.forearmRightMatrix = matMul( this.forearmRightMatrix, rotZ(this.forearmRightRotation.z) );
        this.forearmRightMatrix = matMul( this.forearmRightMatrix, rotY(this.forearmRightRotation.y) );
        this.forearmRightMatrix = matMul( this.forearmRightMatrix, rotX(this.forearmRightRotation.x) );
        this.forearmRightMatrix = matMul( this.forearmRightMatrix, translation(0,this.forearmLength/2,0) );
        var forearmRightMatrix = new THREE.Matrix4().multiplyMatrices(armRightMatrix, this.forearmRightMatrix);

        // Right Hand Matrix
        this.handRightMatrix = new THREE.Matrix4().set(
            1, 0, 0, this.forearmRightTranslation.x,
            0, 1, 0, this.forearmLength/2+this.handRadius,
            0, 0, 1, 0,
            0, 0, 0, 1);
        var handRightMatrix = new THREE.Matrix4().multiplyMatrices(forearmRightMatrix, this.handRightMatrix);

        //Left Leg Matrix
        this.legLeftMatrix = new THREE.Matrix4().set(
            1, 0, 0, this.legLeftTranslation.x,
            0, 1, 0, this.legLeftTranslation.y-this.spineLength/2,
            0, 0, 1, this.legLeftTranslation.z,
            0, 0, 0, 1);
        this.legLeftMatrix=matMul(this.legLeftMatrix, rotX(this.legLeftRotation.x));
        this.legLeftMatrix=matMul(this.legLeftMatrix, rotY(this.legLeftRotation.y));
        this.legLeftMatrix=matMul(this.legLeftMatrix, rotZ(this.legLeftRotation.z));
        this.legLeftMatrix=matMul(this.legLeftMatrix, translation(0,this.legLength/2,0));
        var legLeftMatrix = new THREE.Matrix4().multiplyMatrices(this.spineMatrix, this.legLeftMatrix);

        // Left Shin Matrix
        this.shinLeftMatrix = new THREE.Matrix4().set(
            1, 0, 0, this.shinLeftTranslation.x,
            0, 1, 0, this.shinLeftTranslation.y-this.legLength/2+this.shinLength/2,
            0, 0, 1, this.shinLeftTranslation.z,
            0, 0, 0, 1);
        this.shinLeftMatrix  = matMul( this.shinLeftMatrix, translation(0,-this.shinLength/2,0) );
        this.shinLeftMatrix = matMul( this.shinLeftMatrix, rotZ(this.shinLeftRotation.z) );
        this.shinLeftMatrix = matMul( this.shinLeftMatrix, rotY(this.shinLeftRotation.y) );
        this.shinLeftMatrix = matMul( this.shinLeftMatrix, rotX(this.shinLeftRotation.x) );
        this.shinLeftMatrix  = matMul( this.shinLeftMatrix, translation(0,this.shinLength/2,0) );
        var shinLeftMatrix = new THREE.Matrix4().multiplyMatrices(legLeftMatrix, this.shinLeftMatrix);
        
        // Left Foot Matrix
        this.footLeftMatrix = new THREE.Matrix4().set(
            1, 0, 0, this.shinLeftTranslation.x,
            0, 1, 0, this.shinLength/2+this.footHeight/2,
            0, 0, 1, this.footDepth/4,
            0, 0, 0, 1);
        var footLeftMatrix = new THREE.Matrix4().multiplyMatrices(shinLeftMatrix, this.footLeftMatrix);

        //Right Leg Matrix
        this.legRightMatrix = new THREE.Matrix4().set(
            1, 0, 0, this.legRightTranslation.x,
            0, 1, 0, this.legRightTranslation.y-this.spineLength/2,
            0, 0, 1, this.legRightTranslation.z,
            0, 0, 0, 1);
        this.legRightMatrix=matMul(this.legRightMatrix, rotX(this.legRightRotation.x));
        this.legRightMatrix=matMul(this.legRightMatrix, rotY(this.legRightRotation.y));
        this.legRightMatrix=matMul(this.legRightMatrix, rotZ(this.legRightRotation.z));
        this.legRightMatrix=matMul(this.legRightMatrix, translation(0,this.legLength/2,0));
        var legRightMatrix = new THREE.Matrix4().multiplyMatrices(this.spineMatrix, this.legRightMatrix);
        
        // Right Shin Matrix
        this.shinRightMatrix = new THREE.Matrix4().set(
            1, 0, 0, this.shinRightTranslation.x,
            0, 1, 0, this.shinRightTranslation.y-this.legLength/2+this.shinLength/2,
            0, 0, 1, this.shinRightTranslation.z,
            0, 0, 0, 1);
            this.shinRightMatrix  = matMul( this.shinRightMatrix, translation(0,-this.shinLength/2,0) );
            this.shinRightMatrix = matMul( this.shinRightMatrix, rotX(this.shinRightRotation.x) );     
            this.shinRightMatrix = matMul( this.shinRightMatrix, rotY(this.shinRightRotation.y) );
            this.shinRightMatrix = matMul( this.shinRightMatrix, rotZ(this.shinRightRotation.z) );
            this.shinRightMatrix  = matMul( this.shinRightMatrix, translation(0,this.shinLength/2,0) );
        var shinRightMatrix = new THREE.Matrix4().multiplyMatrices(legRightMatrix, this.shinRightMatrix);

        // Right Foot Matrix
        this.footRightMatrix = new THREE.Matrix4().set(
            1, 0, 0, this.shinRightTranslation.x,
            0, 1, 0, this.shinLength/2+this.footHeight/2,
            0, 0, 1, this.footDepth/4,
            0, 0, 0, 1);
        var footRightMatrix = new THREE.Matrix4().multiplyMatrices(shinRightMatrix, this.footRightMatrix);

        //Apply transformation
        this.spine.setMatrix(this.spineMatrix);
        if (scene.getObjectById(this.spine.id) === undefined)
            scene.add(this.spine);
		
		this.chest.setMatrix(chestMatrix);
        if (scene.getObjectById(this.chest.id) === undefined)
            scene.add(this.chest);
		
        this.neck.setMatrix(neckMatrix);
        if (scene.getObjectById(this.neck.id) === undefined)
            scene.add(this.neck);

        this.head.setMatrix(headMatrix);
        if (scene.getObjectById(this.head.id) === undefined)
            scene.add(this.head);

       this.arm_l.setMatrix(armLeftMatrix);
       if (scene.getObjectById(this.arm_l.id) === undefined)
           scene.add(this.arm_l);

       this.forearm_l.setMatrix(forearmLeftMatrix);
       if (scene.getObjectById(this.forearm_l.id) === undefined)
           scene.add(this.forearm_l);

       this.hand_l.setMatrix(handLeftMatrix);
       if (scene.getObjectById(this.hand_l.id) === undefined)
           scene.add(this.hand_l);
        
       this.arm_r.setMatrix(armRightMatrix);
       if (scene.getObjectById(this.arm_r.id) === undefined)
           scene.add(this.arm_r);

       this.forearm_r.setMatrix(forearmRightMatrix);
       if (scene.getObjectById(this.forearm_r.id) === undefined)
           scene.add(this.forearm_r);

       this.hand_r.setMatrix(handRightMatrix);
       if (scene.getObjectById(this.hand_r.id) === undefined)
           scene.add(this.hand_r);

       this.leg_l.setMatrix(legLeftMatrix);
       if (scene.getObjectById(this.leg_l.id) === undefined)
           scene.add(this.leg_l);
        
       this.shin_l.setMatrix(shinLeftMatrix);
       if (scene.getObjectById(this.shin_l.id) === undefined)
           scene.add(this.shin_l);
        
       this.foot_l.setMatrix(footLeftMatrix);
       if (scene.getObjectById(this.foot_l.id) === undefined)
           scene.add(this.foot_l);

       this.leg_r.setMatrix(legRightMatrix);
       if (scene.getObjectById(this.leg_r.id) === undefined)
           scene.add(this.leg_r);
        
       this.shin_r.setMatrix(shinRightMatrix);
       if (scene.getObjectById(this.shin_r.id) === undefined)
           scene.add(this.shin_r);
        
       this.foot_r.setMatrix(footRightMatrix);
       if (scene.getObjectById(this.foot_r.id) === undefined)
           scene.add(this.foot_r);
    }
    hideRobot() {
        this.spine.visible = false;
        this.chest.visible = false;
        this.neck.visible = false;
        this.head.visible = false;
        this.arm_l.visible = false;
        this.forearm_l.visible = false;
        this.hand_l.visible = false;
        this.arm_r.visible = false;
        this.forearm_r.visible = false;
        this.hand_r.visible = false;
        this.leg_l.visible = false;
        this.shin_l.visible = false;
        this.foot_l.visible = false;
        this.leg_r.visible = false;
        this.shin_r.visible = false;
        this.foot_r.visible = false;
    }
    hideHuman() {
        this.human.visible = false;
    }

    showRobot() { 
        this.spine.visible = true;
        this.chest.visible = true;
        this.neck.visible = true;
        this.head.visible = true;
        this.arm_l.visible = true;
        this.forearm_l.visible = true;
        this.hand_l.visible = true;
        this.arm_r.visible = true;
        this.forearm_r.visible = true;
        this.hand_r.visible = true;
        this.leg_l.visible = true;
        this.shin_l.visible = true;
        this.foot_l.visible = true;
        this.leg_r.visible = true;
        this.shin_r.visible = true;
        this.foot_r.visible = true;
    }
    showHuman() {
        this.human.visible = true;
    }
	
    // Transformation values found with Blender!
	pose1(){ // The boy is crying : https://assets.mubicdn.net/images/notebook/post_images/28772/images-w1400.png?1565208419

        // Spine 
        this.spine.setMatrix(matMul(  this.spineMatrix, translation(0,-2.25,0) )); //The boy is on the floor
       
        // Chest 
        this.chest.setMatrix(matMul(  this.chestMatrix, translation(0,-this.chestLength/2, 0)));
        this.chest.setMatrix(matMul(  this.chest.matrix, rotX(0.31415926536)));
        this.chest.setMatrix(matMul(  this.chest.matrix, translation(0,this.chestLength/2, 0)));
        this.chest.setMatrix(matMul(  this.spine.matrix, this.chest.matrix));
      
        // Neck
        this.neck.setMatrix(matMul(  this.chest.matrix, this.neckMatrix));
      
        // Head
        this.head.setMatrix(matMul(  this.neck.matrix, this.headMatrix));
    
        //Right Arm  
        this.arm_r.setMatrix(matMul(  this.armRightMatrix, translation(0,-this.armLength/2, 0) ));
        this.arm_r.setMatrix(matMul(  this.arm_r.matrix, rotZ(0.6806784083)));
        this.arm_r.setMatrix(matMul(  this.arm_r.matrix, rotY(0.01745329252)));
        this.arm_r.setMatrix(matMul(  this.arm_r.matrix, rotX(1.483529864)));
        this.arm_r.setMatrix(matMul(  this.arm_r.matrix,translation(0,this.armLength/2, 0) ));
        this.arm_r.setMatrix(matMul(  this.chest.matrix, this.arm_r.matrix ));
      
        this.forearm_r.setMatrix(matMul(  this.forearmRightMatrix,translation(0,-this.forearmLength/2, 0) ));
        this.forearm_r.setMatrix(matMul(  this.forearm_r.matrix, rotZ(1.8325957146)));
        this.forearm_r.setMatrix(matMul(  this.forearm_r.matrix, rotY(-0.59341194568)));
        this.forearm_r.setMatrix(matMul(  this.forearm_r.matrix, rotX(-0.3141592654)));
        this.forearm_r.setMatrix(matMul(  this.forearm_r.matrix,translation(0,this.forearmLength/2, 0) ));
        this.forearm_r.setMatrix(matMul(  this.arm_r.matrix, this.forearm_r.matrix));
        
        this.hand_r.setMatrix(matMul( this.forearm_r.matrix, this.handRightMatrix ));
        
        //Left Arm  
        var armLWorldInit = new THREE.Matrix4().getInverse(this.arm_l.matrix);
        this.arm_l.setMatrix(matMul(  this.armLeftMatrix,translation(0,-this.armLength/2, 0) ));
        this.arm_l.setMatrix(matMul(  this.arm_l.matrix, rotZ(-0.6806784083)));
        this.arm_l.setMatrix(matMul(  this.arm_l.matrix, rotY(-0.01745329252)));
        this.arm_l.setMatrix(matMul(  this.arm_l.matrix, rotX(1.483529864)));
        this.arm_l.setMatrix(matMul(  this.arm_l.matrix,translation(0,this.armLength/2, 0) ));
        this.arm_l.setMatrix(matMul(  this.chest.matrix, this.arm_l.matrix ));
         
        this.forearm_l.setMatrix(matMul(  this.forearmLeftMatrix,translation(0,-this.forearmLength/2, 0) ));
        this.forearm_l.setMatrix(matMul(  this.forearm_l.matrix, rotZ(-1.692969374)));
        this.forearm_l.setMatrix(matMul(  this.forearm_l.matrix, rotY(0.29670597284)));
        this.forearm_l.setMatrix(matMul(  this.forearm_l.matrix, rotX(1.33161255788)));
        this.forearm_l.setMatrix(matMul(  this.forearm_l.matrix,translation(0,this.forearmLength/2, 0) ));
        this.forearm_l.setMatrix(matMul(  this.arm_l.matrix, this.forearm_l.matrix));
     
        this.hand_l.setMatrix(new THREE.Matrix4().multiplyMatrices( this.forearm_l.matrix, this.handLeftMatrix ));

        // Right Leg
        this.leg_r.setMatrix(matMul(  this.legRightMatrix, translation(0,-this.legLength/2, 0)));
        this.leg_r.setMatrix(matMul(  this.leg_r.matrix, rotZ(0.03490658504)));
        this.leg_r.setMatrix(matMul(  this.leg_r.matrix, rotY(0)));
        this.leg_r.setMatrix(matMul(  this.leg_r.matrix, rotX(2.75507)));
        this.leg_r.setMatrix(matMul(  this.leg_r.matrix, translation(0,this.legLength/2,0 )));
        this.leg_r.setMatrix(matMul( this.spine.matrix, this.leg_r.matrix));
    
        this.shin_r.setMatrix(matMul( this.shinRightMatrix , translation(0,-this.shinLength/2,0 ) ));
        this.shin_r.setMatrix(matMul( this.shin_r.matrix, rotZ(0.01745329252)));
        this.shin_r.setMatrix(matMul( this.shin_r.matrix, rotY(0)));
        this.shin_r.setMatrix(matMul( this.shin_r.matrix, rotX(-2.40855) ));
        this.shin_r.setMatrix(matMul( this.shin_r.matrix , translation(0,this.shinLength/2,0 ) ));
        this.shin_r.setMatrix(matMul( this.leg_r.matrix, this.shin_r.matrix ));
 
        this.foot_r.setMatrix(new THREE.Matrix4().multiplyMatrices( this.shin_r.matrix, this.footRightMatrix ));
        
        // Left Leg
        this.leg_l.setMatrix(matMul(  this.legLeftMatrix, translation(0,-this.legLength/2, 0)));
        this.leg_l.setMatrix(matMul(  this.leg_l.matrix, rotZ(-0.03490658504)));
        this.leg_l.setMatrix(matMul(  this.leg_l.matrix, rotY(0)));
        this.leg_l.setMatrix(matMul(  this.leg_l.matrix, rotX(2.75507)));
        this.leg_l.setMatrix(matMul(  this.leg_l.matrix, translation(0,this.legLength/2,0 )));
        this.leg_l.setMatrix(matMul( this.spine.matrix, this.leg_l.matrix));
    
        this.shin_l.setMatrix(matMul( this.shinLeftMatrix , translation(0,-this.shinLength/2,0 ) ));
        this.shin_l.setMatrix(matMul( this.shin_l.matrix, rotZ(-0.01745329252) ));
        this.shin_l.setMatrix(matMul( this.shin_l.matrix, rotY(0) ));
        this.shin_l.setMatrix(matMul( this.shin_l.matrix, rotX(-2.40855) ));
        this.shin_l.setMatrix(matMul( this.shin_l.matrix , translation(0,this.shinLength/2,0 ) ));
        this.shin_l.setMatrix(matMul( this.leg_l.matrix, this.shin_l.matrix ));
        
        this.foot_l.setMatrix(new THREE.Matrix4().multiplyMatrices( this.shin_l.matrix, this.footLeftMatrix ));

        // Update bone dict for skinning
        boneDict["Spine"].setMatrix(matMul(matMul(this.spine.matrix, translation(0,-this.spineLength/2,0)), new THREE.Matrix4().getInverse(boneDict["Spine"].matrixWorld)));
        boneDict["Chest"].setMatrix(matMul(matMul(this.chest.matrix, translation(0,-this.chestLength/2,0)), new THREE.Matrix4().getInverse(boneDict["Chest"].matrixWorld))); 
        boneDict["Neck"].setMatrix(matMul(matMul(this.neck.matrix,translation(0, -this.neckLength/2,0)), new THREE.Matrix4().getInverse(boneDict["Neck"].matrixWorld))); 
        boneDict["Head"].setMatrix(matMul(matMul(this.head.matrix, translation(0,-this.headLength/2,0)), new THREE.Matrix4().getInverse(boneDict["Head"].matrixWorld))); 
        boneDict["Arm_R"].setMatrix(matMul(matMul(this.arm_r.matrix, translation(0,-this.armLength/2,0)), new THREE.Matrix4().getInverse( boneDict["Arm_R"].matrixWorld))); 
        boneDict["Forearm_R"].setMatrix(matMul(matMul(this.forearm_r.matrix, translation(0,-this.forearmLength/2,0)), new THREE.Matrix4().getInverse( boneDict["Forearm_R"].matrixWorld))); 
        boneDict["Arm_L"].setMatrix(matMul(matMul(this.arm_l.matrix, translation(0,-this.armLength/2,0)), new THREE.Matrix4().getInverse( boneDict["Arm_L"].matrixWorld)));    
        boneDict["Forearm_L"].setMatrix(matMul(matMul(this.forearm_l.matrix, translation(0,-this.forearmLength/2,0)), new THREE.Matrix4().getInverse( boneDict["Forearm_L"].matrixWorld))); 
        boneDict["Leg_R"].setMatrix(matMul(matMul(this.leg_r.matrix, translation(0,-this.legLength/2,0)),new THREE.Matrix4().getInverse( boneDict["Leg_R"].matrixWorld ))); 
        boneDict["Shin_R"].setMatrix(matMul(matMul(this.shin_r.matrix, translation(0,-this.shinLength/2,0)),new THREE.Matrix4().getInverse( boneDict["Shin_R"].matrixWorld))); 
        boneDict["Leg_L"].setMatrix(matMul(matMul(this.leg_l.matrix, translation(0,-this.legLength/2,0)),new THREE.Matrix4().getInverse( boneDict["Leg_L"].matrixWorld)));
        boneDict["Shin_L"].setMatrix(matMul(matMul(this.shin_l.matrix, translation(0,-this.shinLength/2,0)), new THREE.Matrix4().getInverse(boneDict["Shin_L"].matrixWorld))); // Update bone dict for skinning
           
        buildShaderBoneMatrix();
        
    }
	
    // Transformation values found with Blender!
	pose2(){ // The boy is talking on the phone
		
        // Spine 
        this.spine.setMatrix(matMul(  this.spineMatrix, translation(0,-1,1)));
        this.spine.setMatrix(matMul(  this.spine.matrix, translation(0,-this.spineLength/2,0) )); 
        this.spine.setMatrix(matMul(  this.spine.matrix, rotX(degToRad(90)))); 
        this.spine.setMatrix(matMul(  this.spine.matrix, translation(0,this.spineLength/2,0) )); 
        
        // Chest 
        this.chest.setMatrix(matMul(  this.chestMatrix, translation(0,-this.chestLength/2, 0)));
        this.chest.setMatrix(matMul(  this.chest.matrix, rotZ(degToRad(2.17))));
        this.chest.setMatrix(matMul(  this.chest.matrix, rotY(degToRad(2.69))));
        this.chest.setMatrix(matMul(  this.chest.matrix, rotX(degToRad(-29.1579))));
        this.chest.setMatrix(matMul(  this.chest.matrix, translation(0,this.chestLength/2, 0)));
        this.chest.setMatrix(matMul(  this.spine.matrix, this.chest.matrix));
      
        // Neck
        this.neck.setMatrix(matMul(  this.neckMatrix, translation(0,-this.neckLength/2, 0)));
        this.neck.setMatrix(matMul(  this.neck.matrix, rotZ(degToRad(-6.8332))));
        this.neck.setMatrix(matMul(  this.neck.matrix, rotY(degToRad(3.06121))));
        this.neck.setMatrix(matMul(  this.neck.matrix, rotX(degToRad(-46.1123))));
        this.neck.setMatrix(matMul(  this.neck.matrix, translation(0,this.neckLength/2, 0)));        
        this.neck.setMatrix(matMul(  this.chest.matrix, this.neck.matrix));
      
        // Head
        this.head.setMatrix(matMul(  this.neck.matrix, this.headMatrix));
    
        //Right Arm  
        this.arm_r.setMatrix(matMul(  this.armRightMatrix, translation(0,-this.armLength/2, 0) ));
        this.arm_r.setMatrix(matMul(  this.arm_r.matrix, rotZ(degToRad(51.3161))));
        this.arm_r.setMatrix(matMul(  this.arm_r.matrix, rotY(degToRad(9.71556))));
        this.arm_r.setMatrix(matMul(  this.arm_r.matrix, rotX(degToRad(97.9469))));
        this.arm_r.setMatrix(matMul(  this.arm_r.matrix,translation(0,this.armLength/2, 0) ));
        this.arm_r.setMatrix(matMul(  this.chest.matrix, this.arm_r.matrix ));
      
        this.forearm_r.setMatrix(matMul(  this.forearmRightMatrix,translation(0,-this.forearmLength/2, 0) ));
        this.forearm_r.setMatrix(matMul(  this.forearm_r.matrix, rotZ(degToRad(1.00088))));
        this.forearm_r.setMatrix(matMul(  this.forearm_r.matrix, rotY(degToRad(11.6758))));
        this.forearm_r.setMatrix(matMul(  this.forearm_r.matrix, rotX(degToRad(135.394))));
        this.forearm_r.setMatrix(matMul(  this.forearm_r.matrix,translation(0,this.forearmLength/2, 0) ));
        this.forearm_r.setMatrix(matMul(  this.arm_r.matrix, this.forearm_r.matrix));
        
        this.hand_r.setMatrix(matMul( this.forearm_r.matrix, this.handRightMatrix ));
        
        //Left Arm  
        this.arm_l.setMatrix(matMul(  this.armLeftMatrix,translation(0,-this.armLength/2, 0) ));
        this.arm_l.setMatrix(matMul(  this.arm_l.matrix, rotZ(degToRad(-1.80657))));
        this.arm_l.setMatrix(matMul(  this.arm_l.matrix, rotY(degToRad(-16.75689))));
        this.arm_l.setMatrix(matMul(  this.arm_l.matrix, rotX(degToRad(58.8548))));
        this.arm_l.setMatrix(matMul(  this.arm_l.matrix,translation(0,this.armLength/2, 0) ));
        this.arm_l.setMatrix(matMul(  this.chest.matrix, this.arm_l.matrix ));
         
        this.forearm_l.setMatrix(matMul(  this.forearmLeftMatrix,translation(0,-this.forearmLength/2, 0) ));
        this.forearm_l.setMatrix(matMul(  this.forearm_l.matrix, rotZ(degToRad(-35.8))));
        this.forearm_l.setMatrix(matMul(  this.forearm_l.matrix, rotY(degToRad(18.2))));
        this.forearm_l.setMatrix(matMul(  this.forearm_l.matrix, rotX(degToRad(98.2))));
        this.forearm_l.setMatrix(matMul(  this.forearm_l.matrix,translation(0,this.forearmLength/2, 0) ));
        this.forearm_l.setMatrix(matMul(  this.arm_l.matrix, this.forearm_l.matrix));
     
        this.hand_l.setMatrix(new THREE.Matrix4().multiplyMatrices( this.forearm_l.matrix, this.handLeftMatrix ));

        // Right Leg
        this.leg_r.setMatrix(matMul( this.legRightMatrix , translation(0,-this.legLength/2,0 ) ));
        this.leg_r.setMatrix(matMul( this.leg_r.matrix, rotX(degToRad(8.93993))));
        this.leg_r.setMatrix(matMul( this.leg_r.matrix , translation(0,this.legLength/2,0 ) ));
        this.leg_r.setMatrix(matMul( this.spine.matrix, this.leg_r.matrix));
    
        this.shin_r.setMatrix(matMul( this.shinRightMatrix , translation(0,-this.shinLength/2,0 ) ));
        this.shin_r.setMatrix(matMul( this.shin_r.matrix, rotZ(degToRad(0.736118))));
        this.shin_r.setMatrix(matMul( this.shin_r.matrix, rotY(degToRad(4.40973))));
        this.shin_r.setMatrix(matMul( this.shin_r.matrix, rotX(degToRad(-24.5707))));
        this.shin_r.setMatrix(matMul( this.shin_r.matrix , translation(0,this.shinLength/2,0 ) ));
        this.shin_r.setMatrix(matMul( this.leg_r.matrix, this.shin_r.matrix ));
 
        this.foot_r.setMatrix(matMul( this.shin_r.matrix, this.footRightMatrix ));
        
        // Left Leg
        this.leg_l.setMatrix(matMul( this.legLeftMatrix , translation(0,-this.legLength/2,0 ) ));
        this.leg_l.setMatrix(matMul( this.leg_l.matrix, rotX(degToRad(8.93993))));
        this.leg_l.setMatrix(matMul( this.leg_l.matrix , translation(0,this.legLength/2,0 ) ));
        this.leg_l.setMatrix(matMul( this.spine.matrix, this.leg_l.matrix));
    
        this.shin_l.setMatrix(matMul( this.shinLeftMatrix , translation(0,-this.shinLength/2,0 ) ));
        this.shin_l.setMatrix(matMul( this.shin_l.matrix, rotZ(degToRad(-8.64773))));
        this.shin_l.setMatrix(matMul( this.shin_l.matrix, rotY(degToRad(3.004))));
        this.shin_l.setMatrix(matMul( this.shin_l.matrix, rotX(degToRad(-65.0197))));
        this.shin_l.setMatrix(matMul( this.shin_l.matrix , translation(0,this.shinLength/2,0 ) ));
        this.shin_l.setMatrix(matMul( this.leg_l.matrix, this.shin_l.matrix ));
        
        this.foot_l.setMatrix(matMul( this.shin_l.matrix, this.footLeftMatrix ));
        
        // Update bone dict for skinning
     boneDict["Spine"].setMatrix(matMul(matMul(this.spine.matrix, translation(0,-this.spineLength/2,0)), new THREE.Matrix4().getInverse(boneDict["Spine"].matrixWorld)));
     boneDict["Chest"].setMatrix(matMul(matMul(this.chest.matrix, translation(0,-this.chestLength/2,0)), new THREE.Matrix4().getInverse(boneDict["Chest"].matrixWorld))); 
     boneDict["Neck"].setMatrix(matMul(matMul(this.neck.matrix,translation(0, -this.neckLength/2,0)), new THREE.Matrix4().getInverse(boneDict["Neck"].matrixWorld))); 
     boneDict["Head"].setMatrix(matMul(matMul(this.head.matrix, translation(0,-this.headLength/2,0)), new THREE.Matrix4().getInverse(boneDict["Head"].matrixWorld))); 
     boneDict["Arm_R"].setMatrix(matMul(matMul(this.arm_r.matrix, translation(0,-this.armLength/2,0)), new THREE.Matrix4().getInverse( boneDict["Arm_R"].matrixWorld))); 
     boneDict["Forearm_R"].setMatrix(matMul(matMul(this.forearm_r.matrix, translation(0,-this.forearmLength/2,0)), new THREE.Matrix4().getInverse( boneDict["Forearm_R"].matrixWorld))); 
     boneDict["Arm_L"].setMatrix(matMul(matMul(this.arm_l.matrix, translation(0,-this.armLength/2,0)), new THREE.Matrix4().getInverse( boneDict["Arm_L"].matrixWorld)));    
     boneDict["Forearm_L"].setMatrix(matMul(matMul(this.forearm_l.matrix, translation(0,-this.forearmLength/2,0)), new THREE.Matrix4().getInverse( boneDict["Forearm_L"].matrixWorld))); 
     boneDict["Leg_R"].setMatrix(matMul(matMul(this.leg_r.matrix, translation(0,-this.legLength/2,0)),new THREE.Matrix4().getInverse( boneDict["Leg_R"].matrixWorld ))); 
     boneDict["Shin_R"].setMatrix(matMul(matMul(this.shin_r.matrix, translation(0,-this.shinLength/2,0)),new THREE.Matrix4().getInverse( boneDict["Shin_R"].matrixWorld))); 
     boneDict["Leg_L"].setMatrix(matMul(matMul(this.leg_l.matrix, translation(0,-this.legLength/2,0)),new THREE.Matrix4().getInverse( boneDict["Leg_L"].matrixWorld)));
     boneDict["Shin_L"].setMatrix(matMul(matMul(this.shin_l.matrix, translation(0,-this.shinLength/2,0)), new THREE.Matrix4().getInverse(boneDict["Shin_L"].matrixWorld)));
        
        buildShaderBoneMatrix();
	}

      // Transformation values found with Blender!
	pose3(){ // The boy is watching the race
		
        // Spine 
        this.spine.setMatrix(matMul(  this.spineMatrix, translation(5,-2.2,-3)));     
        this.spine.setMatrix(matMul(  this.spine.matrix, rotY(degToRad(-40))));  
        this.spine.setMatrix(matMul(  this.spine.matrix, rotX(degToRad(-24)))); 
        
        // Chest 
        this.chest.setMatrix(matMul(  this.chestMatrix, translation(0,-this.chestLength/2, 0)));
        this.chest.setMatrix(matMul(  this.chest.matrix, rotX(degToRad(29.1579))));
        this.chest.setMatrix(matMul(  this.chest.matrix, translation(0,this.chestLength/2, 0)));
        this.chest.setMatrix(matMul(  this.spine.matrix, this.chest.matrix));
      
        // Neck
        this.neck.setMatrix(matMul(  this.neckMatrix, translation(0,-this.neckLength/2, 0)));
        this.neck.setMatrix(matMul(  this.neck.matrix, rotX(degToRad(-8))));
        this.neck.setMatrix(matMul(  this.neck.matrix, translation(0,this.neckLength/2, 0)));        
        this.neck.setMatrix(matMul(  this.chest.matrix, this.neck.matrix));
      
        // Head
        this.head.setMatrix(matMul(  this.neck.matrix, this.headMatrix));
    
        //Right Arm  
        this.arm_r.setMatrix(matMul(  this.armRightMatrix, translation(0,-this.armLength/2, 0) ));
        this.arm_r.setMatrix(matMul(  this.arm_r.matrix, rotZ(degToRad(41.3161))));
        this.arm_r.setMatrix(matMul(  this.arm_r.matrix, rotY(degToRad(-11.71556))));
        this.arm_r.setMatrix(matMul(  this.arm_r.matrix, rotX(degToRad(-37.9469))));
        this.arm_r.setMatrix(matMul(  this.arm_r.matrix,translation(0,this.armLength/2, 0) ));
        this.arm_r.setMatrix(matMul(  this.chest.matrix, this.arm_r.matrix ));
      
        this.forearm_r.setMatrix(matMul(  this.forearmRightMatrix,translation(0,-this.forearmLength/2, 0) ));
        this.forearm_r.setMatrix(matMul(  this.forearm_r.matrix, rotZ(degToRad(15.00088))));
        this.forearm_r.setMatrix(matMul(  this.forearm_r.matrix, rotY(degToRad(-1.37))));
        this.forearm_r.setMatrix(matMul(  this.forearm_r.matrix, rotX(degToRad(15.1))));
        this.forearm_r.setMatrix(matMul(  this.forearm_r.matrix,translation(0,this.forearmLength/2, 0) ));
        this.forearm_r.setMatrix(matMul(  this.arm_r.matrix, this.forearm_r.matrix));
        
        this.hand_r.setMatrix(matMul( this.forearm_r.matrix, this.handRightMatrix ));
        
        //Left Arm  
        this.arm_l.setMatrix(matMul(  this.armLeftMatrix,translation(0,-this.armLength/2, 0) ));
        this.arm_l.setMatrix(matMul(  this.arm_l.matrix, rotZ(degToRad(-41.80657))));
        this.arm_l.setMatrix(matMul(  this.arm_l.matrix, rotY(degToRad(11.75689))));
        this.arm_l.setMatrix(matMul(  this.arm_l.matrix, rotX(degToRad(-37.8548))));
        this.arm_l.setMatrix(matMul(  this.arm_l.matrix,translation(0,this.armLength/2, 0) ));
        this.arm_l.setMatrix(matMul(  this.chest.matrix, this.arm_l.matrix ));
         
        this.forearm_l.setMatrix(matMul(  this.forearmLeftMatrix,translation(0,-this.forearmLength/2, 0) ));
        this.forearm_l.setMatrix(matMul(  this.forearm_l.matrix, rotZ(degToRad(-15.00088))));
        this.forearm_l.setMatrix(matMul(  this.forearm_l.matrix, rotY(degToRad(1.37))));
        this.forearm_l.setMatrix(matMul(  this.forearm_l.matrix, rotX(degToRad(15.1))));
        this.forearm_l.setMatrix(matMul(  this.forearm_l.matrix,translation(0,this.forearmLength/2, 0) ));
        this.forearm_l.setMatrix(matMul(  this.arm_l.matrix, this.forearm_l.matrix));
     
        this.hand_l.setMatrix(new THREE.Matrix4().multiplyMatrices( this.forearm_l.matrix, this.handLeftMatrix ));

        // Right Leg
        this.leg_r.setMatrix(matMul( this.legRightMatrix , translation(0,-this.legLength/2,0 ) ));
        this.leg_r.setMatrix(matMul( this.leg_r.matrix, rotZ(degToRad(40))));
        this.leg_r.setMatrix(matMul( this.leg_r.matrix, rotY(degToRad(48.5))));
        this.leg_r.setMatrix(matMul( this.leg_r.matrix, rotX(degToRad(87.9))));
        this.leg_r.setMatrix(matMul( this.leg_r.matrix , translation(0,this.legLength/2,0 ) ));
        this.leg_r.setMatrix(matMul( this.spine.matrix, this.leg_r.matrix));
    
        this.shin_r.setMatrix(matMul( this.shinRightMatrix , translation(0,-this.shinLength/2,0 ) ));
        this.shin_r.setMatrix(matMul( this.shin_r.matrix, rotZ(degToRad(6.61))));
        this.shin_r.setMatrix(matMul( this.shin_r.matrix, rotY(degToRad(60.5))));
        this.shin_r.setMatrix(matMul( this.shin_r.matrix, rotX(degToRad(-116))));
        this.shin_r.setMatrix(matMul( this.shin_r.matrix , translation(0,this.shinLength/2,0 ) ));
        this.shin_r.setMatrix(matMul( this.leg_r.matrix, this.shin_r.matrix ));
 
        this.foot_r.setMatrix(matMul( this.shin_r.matrix, this.footRightMatrix ));
        
        // Left Leg
        this.leg_l.setMatrix(matMul( this.legLeftMatrix , translation(0,-this.legLength/2,0 ) ));
        this.leg_l.setMatrix(matMul( this.leg_l.matrix, rotX(degToRad(65))));
        this.leg_l.setMatrix(matMul( this.leg_l.matrix , translation(0,this.legLength/2,0 ) ));
        this.leg_l.setMatrix(matMul( this.spine.matrix, this.leg_l.matrix));
    
        this.shin_l.setMatrix(matMul( this.leg_l.matrix, this.shinLeftMatrix ));
        
        this.foot_l.setMatrix(matMul( this.shin_l.matrix, this.footLeftMatrix ));
        
	}
	
    animate(t) {
        
        var animationTime = 0.2;

        // Animation cycle for the spine
        var movSpine = cos(t/animationTime*2)*0.1;

        // Animation cycle for Arms
        var aArm = degToRad(0);
        var bArm  = degToRad(45);
        var thetaArmL = (sin(t/animationTime)+1) * 0.5 * (bArm-aArm) + aArm; 
        var thetaArmR = (sin(t/animationTime)+1) * 0.5 * (aArm-bArm) + bArm; 

        // Animation cycle for Forearms
        var aForearm = degToRad(0);
        var bForearm  = degToRad(90);
        var thetaForearmL = (sin(t/animationTime)+1) * 0.5 * (bForearm-aForearm) + aForearm; 
        var thetaForearmR = (sin(t/animationTime)+1) * 0.5 * (aForearm-bForearm) + bForearm; 

        //Animation cycle for the Legs
        var aLeg = degToRad(50);
        var bLeg  = degToRad(-45);
        var thetaLegL = (sin(t/animationTime)+1) * 0.5 * (bLeg-aLeg) + aLeg; 
        var thetaLegR = (sin(t/animationTime)+1) * 0.5 * (aLeg-bLeg) + bLeg;

        // Animation cycle for Shins
        var aShin = degToRad(20);
        var bShin  = degToRad(-90);
        var thetaShinL = (sin(t/animationTime)+1) * 0.5 * (bShin-aShin) + aShin; 
        var thetaShinR = (sin(t/animationTime)+1) * 0.5 * (aShin-bShin) + bShin; 
        

        //Spine
        this.spine.setMatrix(matMul(  this.spineMatrix, rotX(pi/15) ));
        this.spine.setMatrix(matMul(  this.spine.matrix, translation(0,movSpine,0) ));
        
        //Chest
        this.chest.setMatrix(matMul(  this.spine.matrix, this.chestMatrix));

        // Neck
        this.neck.setMatrix(matMul(  this.chest.matrix, this.neckMatrix));

        // Head
        this.head.setMatrix(matMul(  this.neck.matrix, this.headMatrix));

        //Right Arm  
        this.arm_r.setMatrix(matMul(  this.armRightMatrix,translation(0,-this.armLength/2, 0) ));
        this.arm_r.setMatrix(matMul(  this.arm_r.matrix, rotZ(degToRad(28.1327))));
        this.arm_r.setMatrix(matMul(  this.arm_r.matrix, rotX(thetaArmR)));
        this.arm_r.setMatrix(matMul(  this.arm_r.matrix,translation(0,this.armLength/2, 0) ));
        this.arm_r.setMatrix(matMul(  this.chest.matrix, this.arm_r.matrix ));

        this.forearm_r.setMatrix(matMul(  this.forearmRightMatrix,translation(0,-this.forearmLength/2, 0) ));
        this.forearm_r.setMatrix(matMul(  this.forearm_r.matrix, rotX(thetaForearmR)));
        this.forearm_r.setMatrix(matMul(  this.forearm_r.matrix,translation(0,this.forearmLength/2, 0) ));
        this.forearm_r.setMatrix(matMul(  this.arm_r.matrix, this.forearm_r.matrix));

        this.hand_r.setMatrix(matMul( this.forearm_r.matrix, this.handRightMatrix ));

        //Left Arm  
        this.arm_l.setMatrix(matMul(  this.armLeftMatrix,translation(0,-this.armLength/2, 0) ));
        this.arm_l.setMatrix(matMul(  this.arm_l.matrix, rotZ(degToRad(-28.1327))));
        this.arm_l.setMatrix(matMul(  this.arm_l.matrix, rotX(thetaArmL)));
        this.arm_l.setMatrix(matMul(  this.arm_l.matrix,translation(0,this.armLength/2, 0) ));
        this.arm_l.setMatrix(matMul(  this.chest.matrix, this.arm_l.matrix ));
        
        this.forearm_l.setMatrix(matMul(  this.forearmLeftMatrix,translation(0,-this.forearmLength/2, 0) ));
        this.forearm_l.setMatrix(matMul(  this.forearm_l.matrix, rotX(thetaForearmL)));
        this.forearm_l.setMatrix(matMul(  this.forearm_l.matrix,translation(0,this.forearmLength/2, 0) ));
        this.forearm_l.setMatrix(matMul(  this.arm_l.matrix, this.forearm_l.matrix));

        this.hand_l.setMatrix(matMul( this.forearm_l.matrix, this.handLeftMatrix ));

        // Right Leg
        this.leg_r.setMatrix(matMul(  this.legRightMatrix, translation(0,-this.legLength/2, 0)));
        this.leg_r.setMatrix(matMul(  this.leg_r.matrix, rotX(thetaLegR)));
        this.leg_r.setMatrix(matMul(  this.leg_r.matrix, translation(0,this.legLength/2,0 )));
        this.leg_r.setMatrix(matMul( this.spine.matrix, this.leg_r.matrix));

        this.shin_r.setMatrix(matMul( this.shinRightMatrix , translation(0,-this.shinLength/2,0 ) ));
        this.shin_r.setMatrix(matMul( this.shin_r.matrix, rotX(thetaShinR) ));
        this.shin_r.setMatrix(matMul( this.shin_r.matrix , translation(0,this.shinLength/2,0 ) ));
        this.shin_r.setMatrix(matMul( this.leg_r.matrix, this.shin_r.matrix ));

        this.foot_r.setMatrix(matMul( this.shin_r.matrix, this.footRightMatrix ));
        
        // Left Leg
        this.leg_l.setMatrix(matMul(  this.legLeftMatrix, translation(0,-this.legLength/2, 0)));
        this.leg_l.setMatrix(matMul(  this.leg_l.matrix, rotX(thetaLegL)));
        this.leg_l.setMatrix(matMul(  this.leg_l.matrix, translation(0,this.legLength/2,0 )));
        this.leg_l.setMatrix(matMul( this.spine.matrix, this.leg_l.matrix));

        this.shin_l.setMatrix(matMul( this.shinLeftMatrix , translation(0,-this.shinLength/2,0 ) ));
        this.shin_l.setMatrix(matMul( this.shin_l.matrix, rotX(thetaShinL) ));
        this.shin_l.setMatrix(matMul( this.shin_l.matrix , translation(0,this.shinLength/2,0 ) ));
        this.shin_l.setMatrix(matMul( this.leg_l.matrix, this.shin_l.matrix ));

        this.foot_l.setMatrix(matMul( this.shin_l.matrix, this.footLeftMatrix ));

          // Update bone dict for skinning
     boneDict["Spine"].setMatrix(matMul(matMul(this.spine.matrix, translation(0,-this.spineLength/2,0)), new THREE.Matrix4().getInverse(boneDict["Spine"].matrixWorld)));
     boneDict["Chest"].setMatrix(matMul(matMul(this.chest.matrix, translation(0,-this.chestLength/2,0)), new THREE.Matrix4().getInverse(boneDict["Chest"].matrixWorld))); 
     boneDict["Neck"].setMatrix(matMul(matMul(this.neck.matrix,translation(0, -this.neckLength/2,0)), new THREE.Matrix4().getInverse(boneDict["Neck"].matrixWorld))); 
     boneDict["Head"].setMatrix(matMul(matMul(this.head.matrix, translation(0,-this.headLength/2,0)), new THREE.Matrix4().getInverse(boneDict["Head"].matrixWorld))); 
     boneDict["Arm_R"].setMatrix(matMul(matMul(this.arm_r.matrix, translation(0,-this.armLength/2,0)), new THREE.Matrix4().getInverse( boneDict["Arm_R"].matrixWorld))); 
     boneDict["Forearm_R"].setMatrix(matMul(matMul(this.forearm_r.matrix, translation(0,-this.forearmLength/2,0)), new THREE.Matrix4().getInverse( boneDict["Forearm_R"].matrixWorld))); 
     boneDict["Arm_L"].setMatrix(matMul(matMul(this.arm_l.matrix, translation(0,-this.armLength/2,0)), new THREE.Matrix4().getInverse( boneDict["Arm_L"].matrixWorld)));    
     boneDict["Forearm_L"].setMatrix(matMul(matMul(this.forearm_l.matrix, translation(0,-this.forearmLength/2,0)), new THREE.Matrix4().getInverse( boneDict["Forearm_L"].matrixWorld))); 
     boneDict["Leg_R"].setMatrix(matMul(matMul(this.leg_r.matrix, translation(0,-this.legLength/2,0)),new THREE.Matrix4().getInverse( boneDict["Leg_R"].matrixWorld ))); 
     boneDict["Shin_R"].setMatrix(matMul(matMul(this.shin_r.matrix, translation(0,-this.shinLength/2,0)),new THREE.Matrix4().getInverse( boneDict["Shin_R"].matrixWorld))); 
     boneDict["Leg_L"].setMatrix(matMul(matMul(this.leg_l.matrix, translation(0,-this.legLength/2,0)),new THREE.Matrix4().getInverse( boneDict["Leg_L"].matrixWorld)));
     boneDict["Shin_L"].setMatrix(matMul(matMul(this.shin_l.matrix, translation(0,-this.shinLength/2,0)), new THREE.Matrix4().getInverse(boneDict["Shin_L"].matrixWorld)));
        
        buildShaderBoneMatrix();
    }

    clap(t, posX, posZ, rot) { // Clapping robot!
        
        var animationTime = 0.05;

        // Animation cycle for the spine
        var movSpine = cos(t/animationTime*2)*0.1;

        // Animation cycle for Forearms 
        var aForearmZ = degToRad(0);
        var bForearmZ  = degToRad(-4.56);
        var thetaForearmZ = (sin(t/animationTime)+1) * 0.5 * (bForearmZ-aForearmZ) + aForearmZ;  
        var aForearmY = degToRad(0);
        var bForearmY  = degToRad(-34.4665);
        var thetaForearmY = (sin(t/animationTime)+1) * 0.5 * (bForearmY-aForearmY) + aForearmY;  
        var aForearmX = degToRad(90);
        var bForearmX  = degToRad(120.648);
        var thetaForearmX = (sin(t/animationTime)+1) * 0.5 * (bForearmX-aForearmX) + aForearmX; 
       

        //Spine
        this.spine.setMatrix(matMul(  this.spineMatrix, translation(posX,0,posZ) ));
        this.spine.setMatrix(matMul(  this.spine.matrix, rotY(degToRad(rot)) ));
        
        //Chest
        this.chest.setMatrix(matMul(  this.spine.matrix, this.chestMatrix));

        // Neck
        this.neck.setMatrix(matMul(  this.chest.matrix, this.neckMatrix));

        // Head
        this.head.setMatrix(matMul(  this.neck.matrix, this.headMatrix));

        //Right Arm  
        this.arm_r.setMatrix(matMul(  this.armRightMatrix,translation(0,-this.armLength/2, 0) ));
        this.arm_r.setMatrix(matMul(  this.arm_r.matrix, rotZ(degToRad(28.1327))));
        this.arm_r.setMatrix(matMul(  this.arm_r.matrix,translation(0,this.armLength/2, 0) ));
        this.arm_r.setMatrix(matMul(  this.chest.matrix, this.arm_r.matrix ));

        
        this.forearm_r.setMatrix(matMul(  this.forearmRightMatrix,translation(0,-this.forearmLength/2, 0) ));
        this.forearm_r.setMatrix(matMul(  this.forearm_r.matrix, rotZ(thetaForearmZ)));
        this.forearm_r.setMatrix(matMul(  this.forearm_r.matrix, rotY(thetaForearmY)));
        this.forearm_r.setMatrix(matMul(  this.forearm_r.matrix, rotX(thetaForearmX)));
        this.forearm_r.setMatrix(matMul(  this.forearm_r.matrix,translation(0,this.forearmLength/2, 0) ));
        this.forearm_r.setMatrix(matMul(  this.arm_r.matrix, this.forearm_r.matrix));

        this.hand_r.setMatrix(matMul( this.forearm_r.matrix, this.handRightMatrix ));

        //Left Arm  
        this.arm_l.setMatrix(matMul(  this.armLeftMatrix,translation(0,-this.armLength/2, 0) ));
        this.arm_l.setMatrix(matMul(  this.arm_l.matrix, rotZ(degToRad(-28.1327))));
        this.arm_l.setMatrix(matMul(  this.arm_l.matrix,translation(0,this.armLength/2, 0) ));
        this.arm_l.setMatrix(matMul(  this.chest.matrix, this.arm_l.matrix ));
        
        this.forearm_l.setMatrix(matMul(  this.forearmLeftMatrix,translation(0,-this.forearmLength/2, 0) ));
        this.forearm_l.setMatrix(matMul(  this.forearm_l.matrix, rotZ(-thetaForearmZ)));
        this.forearm_l.setMatrix(matMul(  this.forearm_l.matrix, rotY(-thetaForearmY)));
        this.forearm_l.setMatrix(matMul(  this.forearm_l.matrix, rotX(thetaForearmX)));
        this.forearm_l.setMatrix(matMul(  this.forearm_l.matrix,translation(0,this.forearmLength/2, 0) ));
        this.forearm_l.setMatrix(matMul(  this.arm_l.matrix, this.forearm_l.matrix));

        this.hand_l.setMatrix(matMul( this.forearm_l.matrix, this.handLeftMatrix ));

        // Right Leg
        this.leg_r.setMatrix(matMul( this.spine.matrix, this.legRightMatrix));

        this.shin_r.setMatrix(matMul( this.leg_r.matrix, this.shinRightMatrix ));

        this.foot_r.setMatrix(matMul( this.shin_r.matrix, this.footRightMatrix ));
        
        // Left Leg
        this.leg_l.setMatrix(matMul( this.spine.matrix, this.legLeftMatrix));

        this.shin_l.setMatrix(matMul( this.leg_l.matrix, this.shinLeftMatrix));

        this.foot_l.setMatrix(matMul( this.shin_l.matrix, this.footLeftMatrix ));
    }

}

var keyboard = new THREEx.KeyboardState();
var channel = 'p';
var pi = Math.PI;
 
// Fonction pour 
function degToRad(deg)
{
  return deg * (pi/180);
}

function init() {

    container = document.getElementById('container');

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.set(8, 10, 8);
    camera.lookAt(0, 3, 0);

    scene = new THREE.Scene();
    scene.add(camera);

    controls = new OrbitControls(camera, container);
    controls.damping = 0.2;

    clock = new THREE.Clock();

    boneDict = {}

    boneArray = new Float32Array(12 * 16);

    var time = {type: 'float', value: 0.0};

    cloudMaterial = new THREE.ShaderMaterial({
        uniforms: {
            iTime: time,
        }
    });

    humanMaterial = new THREE.ShaderMaterial({
        uniforms: {
            bones: {
                value: boneArray
            }
        }
    });

    const shaderLoader = new THREE.FileLoader();
    shaderLoader.load('glsl/cloud.vs.glsl',
        function (data) {
        cloudMaterial.vertexShader = data;
    })
    shaderLoader.load('glsl/cloud.fs.glsl',
        function (data) {
        cloudMaterial.fragmentShader = data;
    })

    shaderLoader.load('glsl/human.vs.glsl',
        function (data) {
        humanMaterial.vertexShader = data;
    })
    shaderLoader.load('glsl/human.fs.glsl',
        function (data) {
        humanMaterial.fragmentShader = data;
    })

    // loading manager

    const loadingManager = new THREE.LoadingManager(function () {
        scene.add(humanMesh);
    });

    // collada
    humanGeometry = new THREE.BufferGeometry();
    const loader = new ColladaLoader(loadingManager);
    loader.load('./model/human.dae', function (collada) {
		skinIndices = collada.library.geometries['human-mesh'].build.triangles.data.attributes.skinIndex.array;
        skinWeight = collada.library.geometries['human-mesh'].build.triangles.data.attributes.skinWeight.array;
		realBones = collada.library.nodes.human.build.skeleton.bones;

        buildSkeleton();
        buildShaderBoneMatrix();
        humanGeometry.setAttribute('position', new THREE.BufferAttribute(collada.library.geometries['human-mesh'].build.triangles.data.attributes.position.array, 3));
        humanGeometry.setAttribute('skinWeight', new THREE.BufferAttribute(skinWeight, 4));
        humanGeometry.setAttribute('skinIndex', new THREE.BufferAttribute(skinIndices, 4));
        humanGeometry.setAttribute('normal', new THREE.BufferAttribute(collada.library.geometries['human-mesh'].build.triangles.data.attributes.normal.array, 3));

        humanMesh = new THREE.Mesh(humanGeometry, humanMaterial);
        robot = new Robot(humanMesh);
        robot.hideHuman();

        //More!
        robot2 = new Robot(humanMesh);
        robot2.hideRobot();
        robot2.hideHuman();

        robot3 = new Robot(humanMesh);
        robot3.hideRobot();
        robot3.hideHuman();

        robot4 = new Robot(humanMesh);
        robot4.hideRobot();
        robot4.hideHuman();

        robot5 = new Robot(humanMesh);
        robot5.hideRobot();
        robot5.hideHuman();

        robot6 = new Robot(humanMesh);
        robot6.hideRobot();
        robot6.hideHuman();


    });

    // Init cloud
    cloud = new Cloud(cloudMaterial);
    cloud.hideCloud();

    // Init bed
    bed = new Bed();
    bed.hideBed();

    //Init phone
    phone = new Phone();
    phone.hidePhone();

    const ambientLight = new THREE.AmbientLight(0xcccccc, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 0).normalize();
    scene.add(directionalLight);

    //

    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    //

    stats = new Stats();
    container.appendChild(stats.dom);

    //

    window.addEventListener('resize', onWindowResize);
    lights = [];
    lights[0] = new THREE.PointLight(0xffffff, 1, 0);
    lights[1] = new THREE.PointLight(0xffffff, 1, 0);
    lights[2] = new THREE.PointLight(0xffffff, 1, 0);

    lights[0].position.set(0, 200, 0);
    lights[1].position.set(100, 200, 100);
    lights[2].position.set( - 100,  - 200,  - 100);

    scene.add(lights[0]);
    scene.add(lights[1]);
    scene.add(lights[2]);

    var floorTexture = new THREE.ImageUtils.loadTexture('textures/hardwood2_diffuse.jpg');
    floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(4, 4);

    var floorMaterial = new THREE.MeshBasicMaterial({
        map: floorTexture,
        side: THREE.DoubleSide
    });
    var floorGeometry = new THREE.PlaneBufferGeometry(30, 30);
    var floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = Math.PI / 2;
    floor.position.y -= 2.5;
    scene.add(floor);

}


function buildSkeleton() {
	boneDict["Spine"] = new THREE.Bone();
	boneDict["Chest"] = new THREE.Bone();
	boneDict["Neck"] = new THREE.Bone();
	boneDict["Head"] = new THREE.Bone();
	boneDict["Arm_L"] = new THREE.Bone();
	boneDict["Forearm_L"] = new THREE.Bone();
	boneDict["Arm_R"] = new THREE.Bone();
	boneDict["Forearm_R"] = new THREE.Bone();
	boneDict["Leg_L"] = new THREE.Bone();
	boneDict["Shin_L"] = new THREE.Bone();
	boneDict["Leg_R"] = new THREE.Bone();
	boneDict["Shin_R"] = new THREE.Bone();
	
 	boneDict['Chest'].matrixWorld = matMul(boneDict['Spine'].matrixWorld, realBones[1].matrix);
	boneDict['Neck'].matrixWorld = matMul(boneDict['Chest'].matrixWorld, realBones[2].matrix);
	boneDict['Head'].matrixWorld = matMul(boneDict['Neck'].matrixWorld, realBones[3].matrix);
	boneDict['Arm_L'].matrixWorld = matMul(boneDict['Chest'].matrixWorld, realBones[4].matrix);
	boneDict['Forearm_L'].matrixWorld = matMul(boneDict['Arm_L'].matrixWorld, realBones[5].matrix);
	boneDict['Arm_R'].matrixWorld = matMul(boneDict['Chest'].matrixWorld, realBones[6].matrix);
	boneDict['Forearm_R'].matrixWorld = matMul(boneDict['Arm_R'].matrixWorld, realBones[7].matrix);
	boneDict['Leg_L'].matrixWorld = matMul(boneDict['Spine'].matrixWorld, realBones[8].matrix);
	boneDict['Shin_L'].matrixWorld = matMul(boneDict['Leg_L'].matrixWorld, realBones[9].matrix);
	boneDict['Leg_R'].matrixWorld = matMul(boneDict['Spine'].matrixWorld, realBones[10].matrix);
	boneDict['Shin_R'].matrixWorld = matMul(boneDict['Leg_R'].matrixWorld, realBones[11].matrix);

}

/**
* Fills the Float32Array boneArray with the bone matrices to be passed to
* the vertex shader
*/
function buildShaderBoneMatrix() {
    var c = 0;
    for (var key in boneDict) {
        for (var i = 0; i < 16; i++) {
            boneArray[c++] = boneDict[key].matrix.elements[i];
        }
    }
}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

}

function animate() {

    checkKeyboard();

    updateBody();
    requestAnimationFrame(animate);
    render();
    stats.update();

}

function render() {

    const delta = clock.getDelta();

    renderer.render(scene, camera);

}

/**
* Returns a new Matrix4 as a multiplcation of m1 and m2
*
* @param {Matrix4} m1 The first matrix
* @param {Matrix4} m2 The second matrix
* @return {Matrix4} m1 x m2
*/
function matMul(m1, m2) {
    return new THREE.Matrix4().multiplyMatrices(m1, m2);
}

/**
* Returns a new Matrix4 as a scalar multiplcation of s and m
*
* @param {number} s The scalar
* @param {Matrix4} m The  matrix
* @return {Matrix4} s * m2
*/
function scalarMul(s, m) {
    var r = m;
    return r.multiplyScalar(s)
}

/**
* Returns an array containing the x,y and z translation component 
* of a transformation matrix
*
* @param {Matrix4} M The transformation matrix
* @return {Array} x,y,z translation components
*/
function getTranslationValues(M) {
    var elems = M.elements;
    return elems.slice(12, 15);
}

/**
* Returns a new Matrix4 as a translation matrix of [x,y,z]
*
* @param {number} x x component
* @param {number} y y component
* @param {number} z z component
* @return {Matrix4} The translation matrix of [x,y,z]
*/
function translation(x, y, z) {
	//TODO Définir cette fonction
    let mTrans = new THREE.Matrix4();

    mTrans.set( 1, 0, 0, x,
                0, 1, 0, y,
                0, 0, 1, z,
                0, 0, 0, 1 );

    return mTrans;
}

/**
* Returns a new Matrix4 as a rotation matrix of theta radians around the x-axis
*
* @param {number} theta The angle expressed in radians
* @return {Matrix4} The rotation matrix of theta rad around the x-axis
*/
function rotX(theta) {
	//TODO Définir cette fonction
    let mrotX = new THREE.Matrix4();

    mrotX.set(1, 0, 0, 0, 
              0, Math.cos(theta), -Math.sin(theta), 0, 
              0, Math.sin(theta), Math.cos(theta), 0,
              0, 0, 0, 1);

    return mrotX;
}

/**
* Returns a new Matrix4 as a rotation matrix of theta radians around the y-axis
*
* @param {number} theta The angle expressed in radians
* @return {Matrix4} The rotation matrix of theta rad around the y-axis
*/
function rotY(theta) {
	//TODO Définir cette fonction
    let mrotY = new THREE.Matrix4();

    mrotY.set(Math.cos(theta), 0, Math.sin(theta), 0, 
              0, 1, 0, 0, 
             -Math.sin(theta), 0, Math.cos(theta), 0, 
             0, 0, 0, 1);

    return mrotY;
}

/**
* Returns a new Matrix4 as a rotation matrix of theta radians around the z-axis
*
* @param {number} theta The angle expressed in radians
* @return {Matrix4} The rotation matrix of theta rad around the z-axis
*/
function rotZ(theta) {
	//TODO Définir cette fonction
    let mrotZ = new THREE.Matrix4();

    mrotZ.set(Math.cos(theta), -Math.sin(theta), 0, 0, 
              Math.sin(theta), Math.cos(theta), 0, 0, 
              0, 0, 1, 0,
              0, 0, 0, 1);

    return mrotZ;
}

/**
* Returns a new Matrix4 as a scaling matrix with factors of x,y,z
*
* @param {number} x x component
* @param {number} y y component
* @param {number} z z component
* @return {Matrix4} The scaling matrix with factors of x,y,z
*/
function scale(x, y, z) {
	//TODO Définir cette fonction
    let mScale = new THREE.Matrix4();

    mScale.set(x, 0, 0, 0,
               0, y, 0, 0,
               0, 0, z, 0,
               0, 0, 0, 1);

    return mScale;
}

function cos(angle) {
    return Math.cos(angle);
}

function sin(angle) {
    return Math.sin(angle);
}

function checkKeyboard() {
    for (var i = 0; i < 10; i++) {
        if (keyboard.pressed(i.toString())) {
            channel = i;
            break;
        }
    }
}

function resetScene() { // Remove all the extra stuff (that's not original robot/human)
    robot2.hideRobot();
    robot3.hideRobot();
    robot4.hideRobot();
    robot5.hideRobot();
    robot6.hideRobot();
    phone.hidePhone();
    bed.hideBed();
    cloud.hideCloud();
}

function updateBody() {

    switch (channel) {
    case 0:
        resetScene();
        var t = clock.getElapsedTime();   
        robot.animate(t);
        robot5.showRobot();
        robot5.pose3();
        break;

    case 1:
        resetScene();
        
        camera.position.set(0,0,10);
        camera.lookAt(0,0,0);
        scene.add(camera);

        var t = clock.getElapsedTime();

        robot2.showRobot();
        robot2.clap(t, 4, -5, -20);
        robot3.showRobot();
        robot3.clap(t, -1, -5, 15);
        robot4.showRobot();
        robot4.clap(t, 2, 7, -160 );
        robot5.showRobot();
        robot5.clap(t, -3, -0.5, 65 );

        cloud.showCloud();
        cloudMaterial.uniforms[ 'iTime' ].value =  clock.getElapsedTime();
        robot.pose1();
        break;

    case 2:
        resetScene();
        bed.showBed();
        phone.showPhone();
        robot.pose2();
        break;

    case 3:
        break;

    case 4:
        break;

    case 5:
        break;

    case 6:
        robot.hideRobot();
        cloudMaterial.uniforms[ 'iTime' ].value =  clock.getElapsedTime(); // sinon "animation" arrête
        break;
    case 7:
        robot.showRobot();
        cloudMaterial.uniforms[ 'iTime' ].value =  clock.getElapsedTime(); // sinon "animation" arrête
        break;
    case 8:
        robot.hideHuman();
        cloudMaterial.uniforms[ 'iTime' ].value =  clock.getElapsedTime(); // sinon "animation" arrête
        break;
    case 9:
        robot.showHuman();
        cloudMaterial.uniforms[ 'iTime' ].value =  clock.getElapsedTime(); // sinon "animation" arrête
        break;
    default:
        break;
    }
}

init();
animate();
