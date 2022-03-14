out vec3 interpolatedNormal;
attribute vec4 skinIndex;
attribute vec4 skinWeight;

uniform mat4 bones[12];

// http://graphics.cs.cmu.edu/courses/15-466-f17/notes/skinning.html
// https://www.gamedev.net/forums/topic/167216-skin-animation-with-vertex-shaders/

void main(){

    interpolatedNormal = normal;

	gl_Position = projectionMatrix * modelViewMatrix *
        (
        skinWeight[0] * bones[int(skinIndex[0])]  +
        skinWeight[1] * bones[int(skinIndex[1])]  +
        skinWeight[2] * bones[int(skinIndex[2])]  +
        skinWeight[3] * bones[int(skinIndex[3])] 
        ) * vec4(position,1.0); 
                
}