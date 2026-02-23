
const gameHeight = innerHeight; //600
const gameWidth = innerWidth;//gameHeight/2

const pipeWidth = gameHeight/12; // gameWidth/6
const distanceBetweenPipe = gameHeight*1/3; // gameWidth*2/3

const pipeGapRatio = 0.25;
const pipeHeightMinRatio = 0.2;
const pipeHeightMaxRatio = 0.3;

const birdSizeX = gameHeight/16; // gameWidth/8
const birdSizeY = birdSizeX*3/4;

const groundTolerance = -0.1;

const FIXED_STEP = 1 / 60; //Updating physics
const pipeInitialRate = 0.8 *gameHeight/600; // 0.8 *gameWidth/300
const timeIncreasingFactor = 0.1;
const gravity = -0.2 * gameHeight/600;
const jumpStrengh = 5 * gameHeight/600;
const terminalVelocity = -5 * gameHeight/600;

let maxScore = 0;

import { GameAssets } from './assets.js';

// ---- Utilities

function loadPicture(url){
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.addEventListener("load", () => resolve(img), { once: true });
        img.addEventListener("error", () => reject(new Error("Error during loading of " + url)), { once: true });
        img.src = url;
    });
}


function loadSound(url){
    return new Promise((resolve, reject) => {
        const audio = new Audio();
        audio.src=url;
        audio.addEventListener("canplaythrough", () => resolve(audio), { once: true });
        audio.addEventListener("error", () => reject(new Error("Error during loading of " + url)), { once: true });
        audio.load();
    })
} 

// Loading assets (images and sounds)



// ---- Game display

const canvasEl = document.getElementById('game');
canvasEl.width = gameWidth;
canvasEl.height = gameHeight;
const ctx = canvasEl.getContext("2d");

// Update display of the game's canva depending on game state
function updateCanva(bird,pipes,score){

    ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);

    // Drawing background (repeating the same image to fill the width)
    
    const backgroundRatioWH = 5/7; //Depend on the background image (here:1000x1400 so 5/7)
    let repeat = gameWidth/(backgroundRatioWH *gameHeight);
    for (let i=0; i<repeat;i++){
        ctx.drawImage(GameAssets.background, i*backgroundRatioWH*gameHeight, 0, backgroundRatioWH *gameHeight, gameHeight)
    }

    // Drawing pipes

    for (const pipe of pipes){

        let pipeheadSize = 30;

        // Lower pipe
        let canvaX = gameWidth - pipe.posX - pipe.width;
        let canvaY = gameHeight - pipe.height;
        
        ctx.drawImage(GameAssets.pipebody, canvaX, canvaY, pipe.width, pipe.height)

        ctx.save();
        ctx.translate(canvaX, canvaY+pipeheadSize);
        ctx.scale(1,-1)
        ctx.drawImage(GameAssets.pipehead, 0, 0, pipe.width, pipeheadSize)
        ctx.restore();

        // Upper pipe
        canvaX = gameWidth - pipe.posX - pipe.width;
        canvaY = 0;
        let upperPipeHeight = gameHeight - pipe.height - pipe.gap;

        ctx.drawImage(GameAssets.pipebody, canvaX, canvaY, pipe.width, upperPipeHeight)
        ctx.drawImage(GameAssets.pipehead, canvaX, upperPipeHeight-pipeheadSize, pipe.width,pipeheadSize)
    }

    // Drawing bird

    let canvaX = gameWidth - bird.posX - bird.width;
    let canvaY = gameHeight - bird.posY - bird.height;
    ctx.drawImage(GameAssets.bird, canvaX, canvaY, bird.width, bird.height)

    // Drawing score

    canvaX = gameWidth/2;
    canvaY = gameHeight*1/5;

    ctx.fillStyle = "white";
    ctx.font = "50px 'Press Start 2P'";
    ctx.textAlign = "center";
    ctx.shadowColor = "black";
    ctx.shadowBlur = 0; 
    ctx.shadowOffsetX = 4;  
    ctx.shadowOffsetY = 4;

    ctx.fillStyle = "white";
    ctx.font = "50px 'Press Start 2P'";
    ctx.fillText(score, canvaX, canvaY);

    ctx.shadowColor = "transparent";
}

// ---- Physics management

// Check if bird collid with pipes using their coords
function doesBirdCollide(bird, pipes){
    let collide = false;
    for (const pipe of pipes){
        if ((pipe.posX < bird.posX + bird.width && pipe.posX + pipe.width > bird.posX) &&
            (bird.posY <= pipe.height || bird.posY + bird.height >= pipe.height + pipe.gap))
        {
            collide = true;
        }
    }
    return collide;
}

// Check if bird pass pipes, if so it increase the player's score (changing pipe passed property)
function updateScore(bird, pipes, score){
    // Check if the user scored a point and update the score
    const newScore = checkScore(bird, pipes, score);
    // Play scoring sound if score increased
    if (newScore > score){
        GameAssets.SFXscoring.play();
    }
    return newScore;
}

function checkScore(bird, pipes, score){
    for (const pipe of pipes){
        if (pipe.posX >= bird.posX && pipe.passed==false){
            score += 1;
            pipe.passed = true;
        }
    }
    return score;
}

// Update a pipe's position according to its movement and refresh it after getting out of the screen (size updated randomly) 
function updatePipe(pipeToUpdate, pipes, timeMultiplier){
    
    let pipeMovementRate = pipeInitialRate*timeMultiplier; // Rate in pixel by frame
    pipeToUpdate.posX += pipeMovementRate; // Pipe move in uniform movement with constant rate

    // If the pipe get out of the screen, move it to the begining and change its sizes randomly
    if (pipeToUpdate.posX > gameWidth){
        // Looking for the last pipe to place the pipe to update at the right distance from it
        if (pipes.length>1){
            let lastPipePosition = gameWidth;
            for (const pipe of pipes){
                if (pipe.posX < lastPipePosition){
                    lastPipePosition = pipe.posX;
                }
            }
            pipeToUpdate.posX = lastPipePosition - distanceBetweenPipe;
        } else {
            pipeToUpdate.posX = -pipeToUpdate.width;
        }
        
        // Changing randomly the pipe's property
        pipeToUpdate.passed = false;
        pipeToUpdate.gap = pipeGapRatio*gameHeight;
        pipeToUpdate.height = Math.floor(Math.random() * (pipeHeightMaxRatio*gameHeight) + pipeHeightMinRatio*gameHeight);
    }

}

// Update bird's position according to its movement
function updateBird(bird){
    bird.velocity += gravity
    bird.posY += bird.velocity;
    if (bird.velocity <= terminalVelocity){
        bird.velocity = terminalVelocity;
    }
}

// Update bird's velocity when user want to jump
function updateBirdVelocity(bird){
    bird.velocity = jumpStrengh;
}

// Update game's object position according to their movement
function updatePhysics(bird, pipes,score){
    let timeMultiplier = 1 + (score * timeIncreasingFactor); // ? move time multiplier in pipe update function ?

    // Update pipe position
    for (const pipe of pipes){
        updatePipe(pipe, pipes, timeMultiplier);
    }

    // Update bird position
    updateBird(bird);
}

// Called when user jump
function birdJump(bird){
    updateBirdVelocity(bird);
    GameAssets.SFXjumping.play();
}

function shouldGameFinish(bird, pipes){
    return doesBirdCollide(bird, pipes) || bird.posY<groundTolerance*gameHeight;
}

// ---- Game Management

let accumulator = 0;
let lastTime = 0;

// Hide UI, show game's canva and initialyse game
function launchGame(){
    playBtnEl.hidden = true;
    parBtnEl.hidden = true;
    titleEl.hidden = true;
    scoreEl.hidden = true;
    authorEl.hidden = true;

    canvasEl.hidden = false;
    initialize();
}

// Launch the game by creating game's object and user interactions, and start displaying
async function initialize(){
    try {
        const imgSrc = [    "./assets/Image/flappybird.png",
                            "./assets/Image/background.jpg",
                            "./assets/Image/pipebody.png",
                            "./assets/Image/pipehead.png"
        ];
        const loadedImages = await Promise.all(imgSrc.map(url => loadPicture(url)));
        GameAssets.bird = loadedImages[0];
        GameAssets.background = loadedImages[1];
        GameAssets.pipebody = loadedImages[2];
        GameAssets.pipehead = loadedImages[3];

        const audioSrc = [  "./assets/sfx/jumping.mp3",
                            "./assets/sfx/scoring.mp3",
                            "./assets/sfx/die.mp3"
        ];
        
        const loadedSounds = await Promise.all(audioSrc.map(url => loadSound(url)));
        GameAssets.SFXjumping = loadedSounds[0];
        GameAssets.SFXscoring = loadedSounds[1];
        GameAssets.SFXdie = loadedSounds[2];

        let bird = {
            posX : gameWidth/2 - birdSizeX/2,
            posY : gameHeight*3/4 - birdSizeY/2,
            width : birdSizeX,
            height : birdSizeY,
            velocity : 0
        };

        let pipes = [];
        let numberOfPipes = Math.floor(((gameWidth+distanceBetweenPipe) / (distanceBetweenPipe+ pipeWidth))+1)+1;
        for (let i=0;i<numberOfPipes;i++){
            pipes.push({
                posX : -pipeWidth - (distanceBetweenPipe)*i, 
                width: pipeWidth,
                gap : pipeGapRatio*gameHeight,
                height : Math.floor(Math.random() * (pipeHeightMaxRatio*gameHeight) + pipeHeightMinRatio*gameHeight),
                passed : false
            })
        }

        let score = 0 ;

        canvasEl.addEventListener("click", () => {
            birdJump(bird);
        })

        requestAnimationFrame((t) => 
            {   
                lastTime = t;
                gameLoop(t,bird, pipes, score);
            });
    } catch (error) {
        console.error("Critical error during loading", error);
    }
    
}

// Update the game's physics and display it,  
function gameLoop(timestamp, bird, pipes, score){

    let deltaTime = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    accumulator += deltaTime;

    while (accumulator >= FIXED_STEP) {
        updatePhysics(bird, pipes,score);
        accumulator -= FIXED_STEP;
    }

    score = updateScore(bird, pipes, score);

    updateCanva(bird, pipes,score);

    // Checking end-game condition

    //Bird collide with pipe or go under the map
    if (shouldGameFinish(bird, pipes)){
        GameAssets.SFXdie.play();
        finishGame(score);
        return
    } else {
        requestAnimationFrame((t) => gameLoop(t,bird, pipes, score));
    }
}

// Store highscore, hide game's canva and show UI
function finishGame(score){

    if (score >= maxScore){
        maxScore = score;
        highestScoreValueEl.innerText = score;
        localStorage.setItem("highscore", score);
    }

    canvasEl.hidden = true;

    playBtnEl.hidden = false;
    parBtnEl.hidden = false;
    titleEl.hidden = false;
    scoreEl.hidden = false;
    authorEl.hidden = false;
}

// ---- User interface

// Getting UI components
const playBtnEl = document.getElementById("start_game");
const parBtnEl = document.getElementById("parameters");
const highestScoreValueEl = document.getElementById("highScoreValue");

const titleEl = document.querySelector(".title");
const scoreEl = document.querySelector(".best-score-container");
const authorEl = document.querySelector(".author");

playBtnEl.addEventListener("click", launchGame)
parBtnEl.addEventListener("click",openParameters)
highestScoreValueEl.innerText = getHighscore()

// Display parameters menu (parameters.html)
async function openParameters(){
    if (document.getElementById('parameters_form')) return; //If parameters is already open don't need to go further

    try {
        const answer = await fetch("parameters.html");
        if (!answer.ok) throw new Error("Can't load parameters");

        const parametershtml = await answer.text();

        document.body.insertAdjacentHTML("beforeend",parametershtml)

        initParametersBtn();

    } catch {
        console.error("Error occured during loading of parameters")
    }
    
}
// Binding events on parameters menu buttons
function initParametersBtn(){
    const parDivEl = document.getElementById("parameters_form")

    const parSaveBtnEl = document.getElementById("parameters-save");
    const parCancelBtnEl = document.getElementById("parameters-cancel");

    parSaveBtnEl.addEventListener("click", () =>{
        document.body.removeChild(parDivEl); //Removing parameters box
    })

    parCancelBtnEl.addEventListener("click", () =>{
        document.body.removeChild(parDivEl); //Removing parameters box
    })
}

function getHighscore(){
    return localStorage.getItem("highscore");
}
