
const gameHeight = innerHeight *0.9; //600
const gameWidth = gameHeight/2;

const pipeWidth = gameWidth/6;
const distanceBetweenPipe = gameWidth*2/3;
const pipeGapRatio = 0.25;
const pipeHeightMinRatio = 0.2;
const pipeHeightMaxRatio = 0.3;
const birdSizeX = gameWidth/8;
const birdSizeY = birdSizeX*3/4;

const gravity = -0.009 * gameHeight/600;
const jumpStrengh = 1 * gameHeight/600;
const terminalVelocity = -3 * gameHeight/600;

let maxScore = 0;

import { GameAssets } from './assets.js';

const canvasEl = document.getElementById('game');
canvasEl.width = gameWidth;
canvasEl.height = gameHeight;
const ctx = canvasEl.getContext("2d");

function updateCanva(bird,pipes,score){

    ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);

    // Define background

    //ctx.fillStyle = "#cfecf7";
    //ctx.fillRect(0,0, gameWidth,gameHeight);
    ctx.drawImage(GameAssets.background, 0, 0, gameWidth, gameHeight)

    // Drawing pipes

    for (const pipe of pipes){
        ctx.fillStyle = "#32CD32";

        let pipeheadSize = 30;
        // Lower pipe

        let canvaX = gameWidth - pipe.posX - pipe.width;
        let canvaY = gameHeight - pipe.height;
        
        //ctx.fillRect(canvaX, canvaY , pipe.width,pipe.height);
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

        //ctx.fillRect(canvaX, canvaY , pipe.width , upperPipeHeight);
        ctx.drawImage(GameAssets.pipebody, canvaX, canvaY, pipe.width, upperPipeHeight)
        ctx.drawImage(GameAssets.pipehead, canvaX, upperPipeHeight-pipeheadSize, pipe.width,pipeheadSize)
    }

    // Drawing bird

    let canvaX = gameWidth - bird.posX - bird.width;
    let canvaY = gameHeight - bird.posY - bird.height;

    //ctx.fillStyle = "red";
    //ctx.fillRect(canvaX, canvaY, bird.width, bird.height);
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

function updateScore(bird, pipes, score){
    for (const pipe of pipes){
        if (pipe.posX >= bird.posX && pipe.passed==false){
            score += 1;
            pipe.passed = true;
        }
    }
    return score;
}

function updatePipe(pipeToUpdate, pipes, timeMultiplier){
    
    let pipeMovementRate = 0.5*timeMultiplier; // Rate in pixel by frame
    pipeToUpdate.posX += pipeMovementRate; // Pipe move in uniform movement with constant rate

    if (pipeToUpdate.posX > gameWidth){
        // Looking for the last pipe
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
        
        pipeToUpdate.passed = false;
        pipeToUpdate.gap = 0.25*gameHeight;
        pipeToUpdate.height = Math.floor(Math.random() * (0.3*gameHeight) + 0.2*gameHeight);
    }

}

function updateBird(bird){
    bird.velocity += gravity
    if (bird.posY > 0){
        bird.posY += bird.velocity;
        if (bird.velocity <= terminalVelocity){
            bird.velocity = terminalVelocity;
        }
    } else {
        bird.posY = 0;
    }
}

function gameLoop(bird, pipes, score){

    let timeMultiplier = 1/2 + (score/20);

    // Update pipe position
    for (const pipe of pipes){
        updatePipe(pipe, pipes, timeMultiplier);
    }

    updateBird(bird);

    score = updateScore(bird, pipes, score);
    updateCanva(bird, pipes,score);

    if (doesBirdCollide(bird, pipes)){
        finishGame(score);
        return
    } else {
        requestAnimationFrame(() => gameLoop(bird, pipes, score));
    }
}

function birdJump(bird){
    bird.velocity = jumpStrengh  ;
}


function loadPicture(url){
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = url;
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("Error during loading of" + url ))
    });
}

async function initialize(){
    try {
        const imgSrc = [    "./assets/flappybird.png",
                            "./assets/background.jpg",
                            "./assets/pipebody.png",
                            "./assets/pipehead.png"
        ];
        const loadedImages = await Promise.all(imgSrc.map(url => loadPicture(url)));
        GameAssets.bird = loadedImages[0];
        GameAssets.background = loadedImages[1];
        GameAssets.pipebody = loadedImages[2];
        GameAssets.pipehead = loadedImages[3];

        let bird = {
            posX : gameWidth/2 - birdSizeX/2,
            posY : gameHeight/2 - birdSizeY/2,
            width : birdSizeX,
            height : birdSizeY,
            velocity : 0
        };

        let pipes = [];
        let numberOfPipes = Math.floor(((gameWidth+distanceBetweenPipe) / (distanceBetweenPipe+ pipeWidth))+1);
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

        requestAnimationFrame(() => gameLoop(bird, pipes, score));
    } catch (error) {
        console.error("Critical error during loading", error);
    }
    
}


// User interface
const playBtnEl = document.getElementById("start_game");
const parBtnEl = document.getElementById("parameters");
const titleEl = document.querySelector(".title");
const scoreEl = document.querySelector(".best-score-container");
const authorEl = document.querySelector(".author");
const highestScoreValueEl = document.getElementById("highScoreValue");

playBtnEl.addEventListener("click", ()=>{
    playBtnEl.hidden = true;
    parBtnEl.hidden = true;
    titleEl.hidden = true;
    scoreEl.hidden = true;
    authorEl.hidden = true;

    canvasEl.hidden = false;
    initialize();
})

function finishGame(score){

    if (score >= maxScore){
        maxScore = score;
        highestScoreValueEl.innerText = score;
    }

    canvasEl.hidden = true;

    playBtnEl.hidden = false;
    parBtnEl.hidden = false;
    titleEl.hidden = false;
    scoreEl.hidden = false;
    authorEl.hidden = false;
}