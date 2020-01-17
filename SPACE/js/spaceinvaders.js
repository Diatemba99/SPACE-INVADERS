
//  creation des constantes pour le game.
var KEY_LEFT = 37;
var KEY_RIGHT = 39;
var KEY_SPACE = 32;

//  Creations des diffents cas du Game class.
function Game() {

    // Initialisation des variables a utiliser dans le game.
    this.config = {
        bombRate: 0.05,
        bombMinVelocity: 50,
        bombMaxVelocity: 50,
        invaderInitialVelocity: 25,
        invaderAcceleration: 0,
        invaderDropDistance: 20,
        rocketVelocity: 120,
        rocketMaxFireRate: 2,
        gameWidth: 400,
        gameHeight: 300,
        fps: 50,
        debugMode: false,
        invaderRanks: 5,
        invaderFiles: 10,
        shipSpeed: 120,
        niveauDifficultyMultiplier: 0.2,
        pointsPerInvader: 5,
        limitniveauIncrease: 25
    };

    //  On fait juste une initialisation des variables qu'on utilisera en bas .
    this.vies = 3;
    this.width = 0;
    this.height = 0;
    this.gameBounds = {left: 0, top: 0, right: 0, bottom: 0};
    this.intervalId = 0;
    this.score = 0;
    this.niveau = 1;

    //  un tableau vide pour les cas a venir.
    this.stateStack = [];

    //  Input/output
    this.pressedKeys = {};
    this.gameCanvas =  null;

    //  le sound lors d'un tir et du touche.
    this.sounds = null;

    //  la position precedente du x, utilise pour le game.
    this.previousX = 0;
}

//  CREATION DU CANVAS POUR LE GAME
Game.prototype.initialise = function(gameCanvas) {

    //  Set the game canvas.
    this.gameCanvas = gameCanvas;

    //  On initialise la hauteur et la largeur du canvas.
    this.width = gameCanvas.width;
    this.height = gameCanvas.height;

    //  une fonctions pour faire bouger le block des ennemis ensemble.
    this.gameBounds = {
        left: gameCanvas.width / 2 - this.config.gameWidth / 2,
        right: gameCanvas.width / 2 + this.config.gameWidth / 2,
        top: gameCanvas.height / 2 - this.config.gameHeight / 2,
        bottom: gameCanvas.height / 2 + this.config.gameHeight / 2,
        //c'est pour limiter le deplacement du game
    };
};


Game.prototype.moveToState = function(state) {
 
   //  pour quitter le niveau
   if(this.currentState() && this.currentState().leave) {
     this.currentState().leave(game);
     this.stateStack.pop();
   }
   
   //  Appeler la fonction sur le niveau suivant.
   if(state.enter) {
     state.enter(game);
   }
 
   //  fixer l'etat actuel.
   this.stateStack.pop();
   this.stateStack.push(state);
 };

//  Commencer le jeu.
Game.prototype.start = function() {

    //  Partir a la page d'acceuil.
    this.moveToState(new WelcomeState());

    
    //on initialise le nombre de vies a 3
    this.vies = 3;
    this.config.debugMode = /debug=true/.test(window.location.href);

    //  Commencez la boucle du game.
    var game = this;
    this.intervalId = setInterval(function () { GameLoop(game);}, 1000 / this.config.fps);

};

//  revenir au niveau actuel.
Game.prototype.currentState = function() {
    return this.stateStack.length > 0 ? this.stateStack[this.stateStack.length - 1] : null;
};

//  Mettre en mode silencieux le game.
Game.prototype.mute = function(mute) {

    //  mettre en mode silencieux
    if(mute === true) {
        this.sounds.mute = true;
    } else if (mute === false) {
        this.sounds.mute = false;
    } else {
        // Toggle mute instead...
        this.sounds.mute = this.sounds.mute ? false : true;
    }
};

//  La focntion principale du game.
function GameLoop(game) {
    var currentState = game.currentState();
    if(currentState) {

        //  Delta t est la duree de mise a jour.
        var dt = 1 / game.config.fps;

        //   context du jeu. 
        var ctx = this.gameCanvas.getContext("2d");
        
        //  Update if we have an update function. Also draw
        //  if we have a draw function.
        if(currentState.update) {
            currentState.update(game, dt);
        }
        if(currentState.draw) {
            currentState.draw(game, dt, ctx);
        }
    }
}

Game.prototype.pushState = function(state) {

    //  If there's an enter function for the new state, call it.
    if(state.enter) {
        state.enter(game);
    }
    //  Set the current state.
    this.stateStack.push(state);
};

Game.prototype.popState = function() {

    //  Leave and pop the state.
    if(this.currentState()) {
        if(this.currentState().leave) {
            this.currentState().leave(game);
        }

        //  Set the current state.
        this.stateStack.pop();
    }
};

//  The stop function stops the game.
Game.prototype.stop = function Stop() {
    clearInterval(this.intervalId);
};

//  Inform the game a key is down.
Game.prototype.keyDown = function(keyCode) {
    this.pressedKeys[keyCode] = true;
    //  Delegate to the current state too.
    if(this.currentState() && this.currentState().keyDown) {
        this.currentState().keyDown(this, keyCode);
    }
};

Game.prototype.touchstart = function(s) {
    if(this.currentState() && this.currentState().keyDown) {
        this.currentState().keyDown(this, KEY_SPACE);
    }    
};

Game.prototype.touchend = function(s) {
    delete this.pressedKeys[KEY_RIGHT];
    delete this.pressedKeys[KEY_LEFT];
};

Game.prototype.touchmove = function(e) {
	var currentX = e.changedTouches[0].pageX;
    if (this.previousX > 0) {
        if (currentX > this.previousX) {
            delete this.pressedKeys[KEY_LEFT];
            this.pressedKeys[KEY_RIGHT] = true;
        } else {
            delete this.pressedKeys[KEY_RIGHT];
            this.pressedKeys[KEY_LEFT] = true;
        }
    }
    this.previousX = currentX;
};

//  Inform the game a key is up.
Game.prototype.keyUp = function(keyCode) {
    delete this.pressedKeys[keyCode];
    //  Attribuer au  niveau actuel aussi.
    if(this.currentState() && this.currentState().keyUp) {
        this.currentState().keyUp(this, keyCode);
    }
};

function WelcomeState() {

}

WelcomeState.prototype.enter = function(game) {

    // Creer et charger la musique du game.
    game.sounds = new Sounds();
    game.sounds.init();
    game.sounds.loadSound('shoot', 'sounds/shoot.wav');
    game.sounds.loadSound('bang', 'sounds/bang.wav');
    game.sounds.loadSound('explosion', 'sounds/explosion.wav');
};

WelcomeState.prototype.update = function (game, dt) {


};

WelcomeState.prototype.draw = function(game, dt, ctx) {

    //  nettoyer le background.
    ctx.clearRect(0, 0, game.width, game.height);

    ctx.font="30px Arial";
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline="middle"; 
    ctx.textAlign="center"; 
    ctx.fillText("Space Invaders", game.width / 2, game.height/2 - 40); 
    ctx.font="16px Arial";

    ctx.fillText("Tape espace pour Commencer", game.width / 2, game.height/2); 
};

WelcomeState.prototype.keyDown = function(game, keyCode) {
    if(keyCode == KEY_SPACE) {
        //  Commencer le jeu avec la touche espace.
        game.niveau = 1;
        game.score = 0;
        game.vies = 3;
        game.moveToState(new niveauIntroState(game.niveau));
    }
};

function GameOverState() {

}

GameOverState.prototype.update = function(game, dt) {

};

GameOverState.prototype.draw = function(game, dt, ctx) {

    //  effacer le jeu avant de relancer la partie.
    ctx.clearRect(0, 0, game.width, game.height);

    ctx.font="30px Arial";
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline="center"; 
    ctx.textAlign="center"; 
    ctx.fillText("Vous avez perdu !!", game.width / 2, game.height/2 - 40); 
    ctx.font="16px Arial";
    ctx.fillText("Tu as  " + game.score + "point(s) et tu passes au  niveau " + game.niveau, game.width / 2, game.height/2);
    ctx.font="16px Arial";
    ctx.fillText("tape espace pour rejouer.", game.width / 2, game.height/2 + 40);   
};

GameOverState.prototype.keyDown = function(game, keyCode) {
    if(keyCode == KEY_SPACE) {
        //  Relancer le game avec la touch espace.
        game.vies = 3;
        game.score = 0;
        game.niveau = 1;
        game.moveToState(new niveauIntroState(1));
    }
};

//  Create a PlayState with the game config and the niveau you are on.
function PlayState(config, niveau) {
    this.config = config;
    this.niveau = niveau;

    //  Game state.
    this.invaderCurrentVelocity =  10;
    this.invaderCurrentDropDistance =  0;
    this.invadersAreDropping =  false;
    this.lastRocketTime = null;

    //  Game entities.
    this.ship = null;
    this.invaders = [];
    this.rockets = [];
    this.bombs = [];
}

PlayState.prototype.enter = function(game) {

    //  Create the ship.
    this.ship = new Ship(game.width / 2, game.gameBounds.bottom);

    //  Setup initial state.
    this.invaderCurrentVelocity =  10;
    this.invaderCurrentDropDistance =  0;
    this.invadersAreDropping =  false;

    //  Set the ship speed for this niveau, as well as invader params.
    var niveauMultiplier = this.niveau * this.config.niveauDifficultyMultiplier;
    var limitniveau = (this.niveau < this.config.limitniveauIncrease ? this.niveau : this.config.limitniveauIncrease);
    this.shipSpeed = this.config.shipSpeed;
    this.invaderInitialVelocity = this.config.invaderInitialVelocity + 1.5 * (niveauMultiplier * this.config.invaderInitialVelocity);
    this.bombRate = this.config.bombRate + (niveauMultiplier * this.config.bombRate);
    this.bombMinVelocity = this.config.bombMinVelocity + (niveauMultiplier * this.config.bombMinVelocity);
    this.bombMaxVelocity = this.config.bombMaxVelocity + (niveauMultiplier * this.config.bombMaxVelocity);
    this.rocketMaxFireRate = this.config.rocketMaxFireRate + 0.4 * limitniveau;

    //  Create the invaders.
    var ranks = this.config.invaderRanks + 0.1 * limitniveau;
    var files = this.config.invaderFiles + 0.2 * limitniveau;
    var invaders = [];
    for(var rank = 0; rank < ranks; rank++)
       {
        for(var file = 0; file < files; file++) 
           {
                invaders.push(new Invader(
                (game.width / 2) + ((files/2 - file) * 200 / files),
                (game.gameBounds.top + rank * 20),
                rank, file, 'Invader'));
            }
        }

    this.invaders = invaders;
    this.invaderCurrentVelocity = this.invaderInitialVelocity;
    this.invaderVelocity = {x: -this.invaderInitialVelocity, y:0};
    this.invaderNextVelocity = null;
};

PlayState.prototype.update = function(game, dt) {
    
    //  If the left or right arrow keys are pressed, move
    //  the ship. Check this on ticks rather than via a keydown
    //  event for smooth movement, otherwise the ship would move
    //  more like a text editor caret.
    if(game.pressedKeys[KEY_LEFT]) {
        this.ship.x -= this.shipSpeed * dt;
    }
    if(game.pressedKeys[KEY_RIGHT]) {
        this.ship.x += this.shipSpeed * dt;
    }
    if(game.pressedKeys[KEY_SPACE]) {
        this.fireRocket();
    }

    //  Keep the ship in bounds.
    if(this.ship.x < game.gameBounds.left) {
        this.ship.x = game.gameBounds.left;
    }
    if(this.ship.x > game.gameBounds.right) {
        this.ship.x = game.gameBounds.right;
    }

    //  Move each bomb.
    for(var i=0; i<this.bombs.length; i++) {
        var bomb = this.bombs[i];
        bomb.y += dt * bomb.velocity;

        //  If the rocket has gone off the screen remove it.
        if(bomb.y > this.height) {
            this.bombs.splice(i--, 1);
        }
    }

    //  Move each rocket.
    for(i=0; i<this.rockets.length; i++) {
        var rocket = this.rockets[i];
        rocket.y -= dt * rocket.velocity;

        //  If the rocket has gone off the screen remove it.
        if(rocket.y < 0) {
            this.rockets.splice(i--, 1);
        }
    }

    //  Move the invaders.
    var hitLeft = false, hitRight = false, hitBottom = false;
    for(i=0; i<this.invaders.length; i++) {
        var invader = this.invaders[i];
        var newx = invader.x + this.invaderVelocity.x * dt;
        var newy = invader.y + this.invaderVelocity.y * dt;
        if(hitLeft == false && newx < game.gameBounds.left) {
            hitLeft = true;
        }
        else if(hitRight == false && newx > game.gameBounds.right) {
            hitRight = true;
        }
        else if(hitBottom == false && newy > game.gameBounds.bottom) {
            hitBottom = true;
        }

        if(!hitLeft && !hitRight && !hitBottom) {
            invader.x = newx;
            invader.y = newy;
        }
    }

    //  Update invader velocities.
    if(this.invadersAreDropping) {
        this.invaderCurrentDropDistance += this.invaderVelocity.y * dt;
        if(this.invaderCurrentDropDistance >= this.config.invaderDropDistance) {
            this.invadersAreDropping = false;
            this.invaderVelocity = this.invaderNextVelocity;
            this.invaderCurrentDropDistance = 0;
        }
    }
    //  If we've hit the left, move down then right.
    if(hitLeft) {
        this.invaderCurrentVelocity += this.config.invaderAcceleration;
        this.invaderVelocity = {x: 0, y:this.invaderCurrentVelocity };
        this.invadersAreDropping = true;
        this.invaderNextVelocity = {x: this.invaderCurrentVelocity , y:0};
    }
    //  If we've hit the right, move down then left.
    if(hitRight) {
        this.invaderCurrentVelocity += this.config.invaderAcceleration;
        this.invaderVelocity = {x: 0, y:this.invaderCurrentVelocity };
        this.invadersAreDropping = true;
        this.invaderNextVelocity = {x: -this.invaderCurrentVelocity , y:0};
    }
    //  If we've hit the bottom, it's game over.
    if(hitBottom) {
        game.vies = 0;
    }
    
    //  les instructions pour la conditions pour la collision.
    // ------------------------------------------------------------
    // ------------------------------------------------------------
    for(i=0; i<this.invaders.length; i++) 
       {
        var invader = this.invaders[i];
        var bang = false; //initialise le choc a faux

        for(var j=0; j<this.rockets.length; j++)
           {
            var rocket = this.rockets[j];

            if(    rocket.x >= (invader.x - invader.width/2) 
                && rocket.x <= (invader.x + invader.width/2) 
                && rocket.y >= (invader.y - invader.height/2) 
                && rocket.y <= (invader.y + invader.height/2))
                    {
                
                //  Remove the rocket, set 'bang' so we don't process
                //  this rocket again.
                this.rockets.splice(j--, 1);
                bang = true;
                game.score += this.config.pointsPerInvader;
                //incremente a chaqu fois qu'il touche l'ennemi
                break;
                    }
        }
        if(bang) {
            this.invaders.splice(i--, 1);
            game.sounds.playSound('bang');
        }
    }

    //  Find all of the front rank invaders.
    var frontRankInvaders = {};
    for(var i=0; i<this.invaders.length; i++) {
        var invader = this.invaders[i];
        //  If we have no invader for game file, or the invader
        //  for game file is futher behind, set the front
        //  rank invader to game one.
        if(!frontRankInvaders[invader.file] || frontRankInvaders[invader.file].rank < invader.rank) {
            frontRankInvaders[invader.file] = invader;
        }
    }

    //  Give each front rank invader a chance to drop a bomb.
    for(var i=0; i<this.config.invaderFiles; i++) {
        var invader = frontRankInvaders[i];
        if(!invader) continue;
        var chance = this.bombRate * dt;
        if(chance > Math.random()) {
            //  Fire!
            this.bombs.push(new Bomb(invader.x, invader.y + invader.height / 2, 
                this.bombMinVelocity + Math.random()*(this.bombMaxVelocity - this.bombMinVelocity)));
        }
    }

    //  Check for bomb/ship collisions.
    for(var i=0; i<this.bombs.length; i++) {
        var bomb = this.bombs[i];
        if(bomb.x >= (this.ship.x - this.ship.width/2) && bomb.x <= (this.ship.x + this.ship.width/2) &&
                bomb.y >= (this.ship.y - this.ship.height/2) && bomb.y <= (this.ship.y + this.ship.height/2)) {
            this.bombs.splice(i--, 1);
            game.vies--;
            game.sounds.playSound('explosion');
        }
                
    }

    //  Check for invader/ship collisions.
    for(var i=0; i<this.invaders.length; i++) {
        var invader = this.invaders[i];
        if((invader.x + invader.width/2) > (this.ship.x - this.ship.width/2) && 
            (invader.x - invader.width/2) < (this.ship.x + this.ship.width/2) &&
            (invader.y + invader.height/2) > (this.ship.y - this.ship.height/2) &&
            (invader.y - invader.height/2) < (this.ship.y + this.ship.height/2)) {
            //  Dead by collision!
            game.vies = 0;
            game.sounds.playSound('explosion');
        }
    }

    //  Check for failure
    if(game.vies <= 0) {
        game.moveToState(new GameOverState());
    }

    //  Check for victory
    if(this.invaders.length === 0) {
        game.score += this.niveau * 50;
        game.niveau += 1;
        game.moveToState(new niveauIntroState(game.niveau));
    }
};

PlayState.prototype.draw = function(game, dt, ctx) {

    //  Pour nettoyer le backgroung du game.
    ctx.clearRect(0, 0, game.width, game.height);
    
    //  acteur du game.
    ctx.fillStyle = 'yellow';
    ctx.fillRect(this.ship.x - (this.ship.width / 2), this.ship.y - (this.ship.height / 2), this.ship.width, this.ship.height);

    //  ennemis du game.
    ctx.fillStyle = 'blue';
    for(var i=0; i<this.invaders.length; i++) 
    {
        var invader = this.invaders[i];
        ctx.fillRect(invader.x - invader.width/2, invader.y - invader.height/2, invader.width, invader.height);
    }

    //  creations des tirs ennemis.
    ctx.fillStyle = 'blue';
    for(var i=0; i<this.bombs.length; i++) //boucle infinie de tirs
    {
        var bomb = this.bombs[i];
        ctx.fillRect(bomb.x - 2, bomb.y - 2, 4, 4);
    }

    //  Creation des tirs.
    ctx.fillStyle = 'yellow';
    for(var i=0; i<this.rockets.length; i++)
     {
        var rocket = this.rockets[i];
        ctx.fillRect(rocket.x, rocket.y - 2, 1, 4);
    }

    //  la partie ou on incremente le score et le niveau.
    var textYpos = game.gameBounds.bottom + ((game.height - game.gameBounds.bottom) / 2) + 14/2;
    ctx.font="14px Arial";
    ctx.fillStyle = '#ffffff';
    var info = "vies: " + game.vies;
    ctx.textAlign = "left";
    ctx.fillText(info, game.gameBounds.left, textYpos);
    info = "Score: " + game.score + ", niveau: " + game.niveau;
    ctx.textAlign = "right";
    ctx.fillText(info, game.gameBounds.right, textYpos);

    //  If we're in debug mode, tracer les bornes.
    if(this.config.debugMode) {
        ctx.strokeStyle = '#ff0000';
        ctx.strokeRect(0,0,game.width, game.height);
        ctx.strokeRect(game.gameBounds.left, game.gameBounds.top,
            game.gameBounds.right - game.gameBounds.left,
            game.gameBounds.bottom - game.gameBounds.top);
    }

};

PlayState.prototype.keyDown = function(game, keyCode) {

    if(keyCode == KEY_SPACE) {
        //  Fire!
        this.fireRocket();
    }
    if(keyCode == 80) {
        //  Push the pause state.
        game.pushState(new PauseState());
    }
};

PlayState.prototype.keyUp = function(game, keyCode) {

};

PlayState.prototype.fireRocket = function() {
    //  If we have no last rocket time, or the last rocket time 
    //  is older than the max rocket rate, we can fire.
    if(this.lastRocketTime === null || ((new Date()).valueOf() - this.lastRocketTime) > (1000 / this.rocketMaxFireRate))
    {   
        //  Add a rocket.
        this.rockets.push(new Rocket(this.ship.x, this.ship.y - 12, this.config.rocketVelocity));
        this.lastRocketTime = (new Date()).valueOf();

        //  Play the 'shoot' sound.
        game.sounds.playSound('shoot');
    }
};

function PauseState() {

}

PauseState.prototype.keyDown = function(game, keyCode) {

    if(keyCode == 80) {
        //  Pop the pause state.
        game.popState();
    }
};

PauseState.prototype.draw = function(game, dt, ctx) {

    //  Clear the background.
    ctx.clearRect(0, 0, game.width, game.height);

    ctx.font="14px Arial";
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline="middle";
    ctx.textAlign="center";
    ctx.fillText("Paused", game.width / 2, game.height/2);
    return;
};

/*  
    niveau Intro State

    The niveau Intro state shows a 'niveau X' message and
    a countdown for the niveau.
*/
function niveauIntroState(niveau) {
    this.niveau = niveau;
    this.countdownMessage = "3";
}

niveauIntroState.prototype.update = function(game, dt) {

    //  Mettre a jour le temps avant chaque nouvelle partie.
    if(this.countdown === undefined) {
        this.countdown = 3; // il patiente 3 secondes avant le debut du game
    }
    this.countdown -= dt; // pour voir la diminution de temps

    if(this.countdown < 2) { 
        this.countdownMessage = "2"; 
    }
    if(this.countdown < 1) { 
        this.countdownMessage = "1"; 
    } 
    if(this.countdown <= 0) {
        //  Passez au niveau suivant , en indiquant le niveau a venir.
        game.moveToState(new PlayState(game.config, this.niveau));
    }

};

niveauIntroState.prototype.draw = function(game, dt, ctx) {

    //  effacer le background avant de recommencer.
    ctx.clearRect(0, 0, game.width, game.height);

    ctx.font="36px Arial";
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline="middle"; 
    ctx.textAlign="center"; 
    ctx.fillText("niveau " + this.niveau, game.width / 2, game.height/2);
    ctx.font="24px Arial";
    ctx.fillText("Le jeu commence dans " + this.countdownMessage, game.width / 2, game.height/2 + 36);      
    return;
};


/*
 
  Tirs 

  The ship has a position and that's about it.

*/
function Ship(x, y) 
{
    this.x = x;
    this.y = y;
    this.width = 20;
    this.height = 16;
}

/*
    Rocket

    Fired by the ship, they've got a position, velocity and state.

    */
function Rocket(x, y, velocity) {
    this.x = x;
    this.y = y;
    this.velocity = velocity;
}

/*
    Bomb

    Dropped by invaders, they've got position, velocity.

*/
function Bomb(x, y, velocity) {
    this.x = x;
    this.y = y;
    this.velocity = velocity;
}
 
/*
    Invader 

    Invader's have position, type, rank/file and that's about it. 
*/

function Invader(x, y, rank, file, type) {
    this.x = x;
    this.y = y;
    this.rank = rank;
    this.file = file;
    this.type = type;
    this.width = 18;
    this.height = 14;
}

/*
    Pour passer au niveau suivant

   Quand on passe au niveau suivant on fait une mise a jour et on
   fait appel a nos fonctions specifiques

*/
function GameState(updateProc, drawProc, keyDown, keyUp, enter, leave) {
    this.updateProc = updateProc;
    this.drawProc = drawProc;
    this.keyDown = keyDown;
    this.keyUp = keyUp;
    this.enter = enter;
    this.leave = leave;
}

/*

    Songs

    pour avoir le song du game

*/
function Sounds() {

    //  The audio context.
    this.audioContext = null;

    //  The actual set of loaded sounds.
    this.sounds = {};
}

Sounds.prototype.init = function() {

    //  Create the audio context, paying attention to webkit browsers.
    context = window.AudioContext || window.webkitAudioContext;
    this.audioContext = new context();
    this.mute = false;
};

Sounds.prototype.loadSound = function(name, url) {

    //  Reference to ourselves for closures.
    var self = this;

    //  Create an entry in the sounds object.
    this.sounds[name] = null;

    //  Create an asynchronous request for the sound.
    var req = new XMLHttpRequest();
    req.open('GET', url, true);
    req.responseType = 'arraybuffer';
    req.onload = function() {
        self.audioContext.decodeAudioData(req.response, function(buffer) {
            self.sounds[name] = {buffer: buffer};
        });
    };
    try {
      req.send();
    } catch(e) {
      console.log("An exception occured getting sound the sound " + name + " this might be " +
         "because the page is running from the file system, not a webserver.");
      console.log(e);
    }
};

Sounds.prototype.playSound = function(name) {

    //  le cas ou le song ne marche pas
    if(this.sounds[name] === undefined || this.sounds[name] === null || this.mute === true) {
        return;
    }

    //les effets sonnores
    var source = this.audioContext.createBufferSource();
    source.buffer = this.sounds[name].buffer;
    source.connect(this.audioContext.destination);
    source.start(0);
};
