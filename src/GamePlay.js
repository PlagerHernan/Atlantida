var amountDiamonds = 3;
var amountBoobles = 30;

GamePlayManager = {
		
    init: function() {
        game.scale.scaleMode =  Phaser.ScaleManager.SHOW_ALL;
        game.scale.pageAlignHorizontally = true;
        game.scale.pageAlignVertically = true;
        
        this.gameOver = false;
        this.flagMouse = false;
    },
    
    preload: function() {
        game.load.image('background', 'assets/images/background.png');
        game.load.image('explosion', 'assets/images/explosion.png');
        game.load.image('shark', 'assets/images/shark.png');
        game.load.image('fishes', 'assets/images/fishes.png');
        game.load.image('mollusk', 'assets/images/mollusk.png');
        game.load.image('booble1', 'assets/images/booble1.png');
        game.load.image('booble2', 'assets/images/booble2.png');
        
        game.load.spritesheet('horse', 'assets/images/horse.png', 84, 156, 2); //  84: ancho total dividido dos (xq hay dos sprites) (168/2) //2: cantidad de sprites
        game.load.spritesheet('diamonds', 'assets/images/diamonds.png', 81, 84, 4);
        
        game.load.audio('music', [ 'assets/sounds/musicLoop.mp3' ], true);
        game.load.audio('pop', [ 'assets/sounds/sfxPop.mp3' ], true);
        game.load.audio('die', [ 'assets/sounds/Die.mp3' ], true);
        game.load.audio('win', [ 'assets/sounds/Win.wav' ], true);
    },
    
    create: function() {
    	this.music = game.add.audio('music', 0.3, true, true);    	
    	this.music.play();
    	this.sfxPop = game.add.audio('pop', 1, false, true);
    	this.sfxDie = game.add.audio('die', 0.15, false, true);
    	this.sfxWin = game.add.audio('win', 0.3, false, true);
    	
        game.add.sprite(0, 0, 'background');
        this.shark = game.add.sprite(1000, 80, 'shark');
        this.fishes = game.add.sprite(10, 500, 'fishes');
        var mollusk = game.add.sprite(380, 50, 'mollusk');
    	game.add.tween(mollusk).to({ y: 200 }, 8000, Phaser.Easing.Quadratic.InOut, true, 0, 1000, true);
    	this.boobles = [];
    	for (var int = 0; int < amountBoobles; int++)
    	{
			var booble = game.add.sprite(game.rnd.integerInRange(-10, 1140), game.rnd.integerInRange(500, 900), 'booble' + game.rnd.integerInRange(1, 2)); //'booble' + game.rnd.integerInRange(1, 2): imagen random entre booble1 y booble2
			booble.alpha = 0.5;
			booble.scale.set(0.2 + game.rnd.frac());
			booble.vel = 0.2 + game.rnd.frac();
			this.boobles[int] = booble;
		}
        
        this.explosionsGroup = game.add.group();
        for (var int = 0; int < 10; int++) 
        {
        	var explosion = this.explosionsGroup.create(100, 100, 'explosion');
            explosion.tweenScale = game.add.tween(explosion.scale).to({
            	x: [0.4, 0.8, 0.4],
                y: [0.4, 0.8, 0.4]
    			}, 600, Phaser.Easing.Exponential.Out, false, 0, 0, false);
            explosion.tweenAlpha = game.add.tween(explosion).to({
                alpha: [1, 0.6, 0]
            	}, 600, Phaser.Easing.Exponential.Out, false, 0, 0, false);
            explosion.anchor.setTo(0.5);
            explosion.kill(); //lo hace invisible y lo deja disponible para ser llamado luego con getFirstDead() y reset() -> (ver en update)
		}
        
        
        this.horse = game.add.sprite(game.width/2, game.height/2, 'horse', 1); //1: frame nro 2
        this.horse.anchor.setTo(0.5);
        //this.horse.angle = 90;
        //this.horse.scale.setTo(1.5);
        //this.horse.alpha = 0.5;
        
        game.input.onDown.add(this.flagOn, this);
        
        this.diamonds = [];
        for (var int = 0; int < amountDiamonds; int++) 
        {
			var diamond = game.add.sprite(100, 100, 'diamonds'); //inicializa la variable (no importa los parámetros, después se cambian)
			diamond.frame = game.rnd.integerInRange(0, 3); //frame random entre 0 y 3 (hay 4 sprites en el spritesheet)
			diamond.anchor.setTo(0.5); // anchor en medio del sprite (por defecto está en la esquina superior izquierda)
			diamond.scale.setTo(0.3 + game.rnd.frac()); //tamaño random entre 0.3 y 1.3
			diamond.x = game.rnd.integerInRange(50, 1050); //posición random en la pantalla (sin llegar a los márgenes)
			diamond.y = game.rnd.integerInRange(50, 600);
			
			this.diamonds[int] = diamond;
			var rectDiamond = this.getCollider(diamond); //obtengo collider del diamante
			var rectHorse = this.getCollider(this.horse); //obtengo collider del caballo
			
			while (this.isCollision(rectDiamond, rectHorse) || this.isCollisionOthers(int, rectDiamond)) //compruebo si colliders del diamante y del caballo están colisionando 
			{
				diamond.x = game.rnd.integerInRange(50, 1050); //reasigna posicion
				diamond.y = game.rnd.integerInRange(50, 600);
				rectDiamond = this.getCollider(diamond); //obtengo nuevo collider del diamante (y vuelve a comprobar)
			}
		}
        
        var styleText =
        {
			font : "bold 40px Arial",
			fill : "#ffffff",
			align: "center"
		}
        var styleTitle =
        {
			font : "bold 70px Arial",
			fill : "#ffffff",
			align: "center"
		}
        
        this.titleText = game.add.text(game.width/2, 80, 'ATLANTIDA', styleTitle);
        this.titleText.anchor.setTo(0.5);
        
        this.infoText = game.add.text(game.width/2, 140, 'Click para jugar', styleText);
        this.infoText.anchor.setTo(0.5);
        game.add.tween(this.infoText.scale).to({
        	x: [1, 0.7, 1],
            y: [1, 0.7, 1]
			}, 2000, Phaser.Easing.Exponential.Out, true, 0, 100, false);
        
        this.score = 0;
        this.scoreText = game.add.text(200, 40, 'Puntaje: ' + this.score, styleText);
        this.scoreText.anchor.setTo(0.5);
        this.scoreText.visible = false;
        
        this.time = 5;
        this.timeText = game.add.text(950, 40, 'Tiempo: ' + this.time, styleText);
        this.timeText.anchor.setTo(0.5);
        this.timeText.visible = false;
        this.timerGameOver = game.time.events.loop(Phaser.Timer.SECOND, this.updateCounter, this);
        
    },
    
    increaseScore: function() 
    {
		this.score ++;
		this.scoreText.text = 'Puntaje: ' + this.score * 100;
		
		//triunfo
		if (this.score >= amountDiamonds) 
		{
			this.ShowFinalMessage("Felicitaciones!");
			this.sfxWin.play();
		}
	},
	
	updateCounter: function() 
	{
		if (this.flagMouse) 
        {
			this.time --;
			this.timeText.text = 'Tiempo: ' + this.time;
			//derrota
			if (this.time <= 0)
			{
				this.ShowFinalMessage("Tiempo terminado");
				this.sfxDie.play();
			}
        }	
	},
	
	ShowFinalMessage: function(message) 
	{
		this.music.stop();
		
		//fondo oscuro
		var bmd = game.add.bitmapData(game.width, game.height);
		bmd.ctx.fillStyle = '#000000';
		bmd.ctx.fillRect(0,0, game.width, game.height);
		var bg = game.add.sprite(0, 0, bmd);
		bg.alpha = 0.5;
		
		//texto
		var text = game.add.text(game.width/2, game.height/2, message, {
			font : "bold 60px Arial",
			fill : "#FFFFFF",
			align: "center"
		});
		text.anchor.set(0.5);
		
		//elimino timer
		game.time.events.remove(this.timerGameOver);
		//bloqueo movimiento
		this.gameOver = true;
		//reinicio juego a los 5 segundos
		setTimeout(this.ResetGame, 5000);
	},
	
	ResetGame : function()
	{
		game.state.start("gameplay");
	},
    
    /*render: function()
    {
    	game.debug.spriteBounds(this.horse);
    	for (var int = 0; int < amountDiamonds; int++) {
    		game.debug.spriteBounds(this.diamonds[int]);
		}
	},*/
    
	//retorna rectangulo en la posicion del sprite
    getCollider: function(sprite)
    {
    	return new Phaser.Rectangle(sprite.left, sprite.top, sprite.width, sprite.height);
    },
    
    getColliderHorse: function()
    {
		var x0 = this.horse.x - Math.abs(this.horse.width)/4;
		var width = Math.abs(this.horse.width)/2;
		var y0 = this.horse.y - this.horse.height/3;
		var height = this.horse.height/1.5;
		
		return new Phaser.Rectangle(x0, y0, width, height);
	},
    
    //retorna true si los rectangulos están colisionando entre si
    isCollision: function(rectA, rectB) 
    {
    	if (rectA.x > rectB.x + rectB.width || rectB.x > rectA.x + rectA.width) 
    	{
			return false;
		}
    	if (rectA.y > rectB.y + rectB.height || rectB.y > rectA.y + rectA.height) 
    	{
			return false;
		}
			return true;
    },
    
    isCollisionOthers: function(index, rectA) 
    {
    	for (var int = 0; int < index; int++) 
    	{
			var rectOther = this.getCollider(this.diamonds[int]); //obtengo coliders de todos los diamantes hasta el actual
			if (this.isCollision(rectOther, rectA)) //verifico si hay colision
			{
				return true;
			}
		}
    	return false;
    },
    
    flagOn: function() 
    {
		this.flagMouse = true;
		
		this.titleText.visible = false;
		this.infoText.visible = false;
		this.scoreText.visible = true;
		this.timeText.visible = true;
	},
    
    update: function() 
    {
    	//movimiento burbujas
    	for (var int = 0; int < amountBoobles; int++)
    	{
    		var booble = this.boobles[int];
    		booble.y -= booble.vel;
    		//al salir por encima de la pantalla, la recoloco por debajo, en posicion random en Y
    		if (booble.y <-20)
    		{
    			booble.y = 660;
    			booble.x = game.rnd.integerInRange(-10, 1140);
			}
    	}	
    	
    	//movimiento tiburon
    	this.shark.x -= 0.8;
    	if (this.shark.x < -300)
    	{
    		this.shark.x = 1200;
		}
    	//movimiento pescados
    	this.fishes.x += 0.6;
    	if (this.fishes.x > 1200) 
    	{
    		this.fishes.x = -200
		}
    	
    	//posición del mouse
    	var pointerX = game.input.x;
    	var pointerY = game.input.y;
    	
    	/*console.log("pointerX: " + pointerX);
    	console.log("pointerY: " + pointerY);*/
    	
    	//distancia entre mouse y caballo
    	var distX = pointerX - this.horse.x;
    	var distY = pointerY - this.horse.y;
    	
    	//rotación del caballo
    	if (distX > 0) 
    	{
    		this.horse.scale.setTo(1);
		}
    	else 
    	{
    		this.horse.scale.setTo(-1, 1);
		}
    	
    	 
    	if (this.flagMouse && !this.gameOver) 
    	{
    		//movimiento del caballo
    		this.horse.x += 0.02 * distX;
        	this.horse.y += 0.02 * distY;
        	
        	for (var int = 0; int < amountDiamonds; int++) 
        	{
        		var rectHorse = this.getColliderHorse(); 
        		var rectDiamond = this.getCollider(this.diamonds[int]);
        		
        		//colision caballo - diamante
            	if (this.isCollision(rectHorse, rectDiamond) && this.diamonds[int].visible) 
            	{
            		this.sfxPop.play();
            		
            		this.diamonds[int].visible = false;
            		
            		var explosion = this.explosionsGroup.getFirstDead();
            		if (explosion != null) 
            		{
            			explosion.reset(this.diamonds[int].x, this.diamonds[int].y);
                		console.log("explosion: " + explosion);
                		explosion.tweenScale.start();
                        explosion.tweenAlpha.start();
                        
                        //cuando completa el tween, elimino la explosion para reutilizarla luego
                        explosion.tweenAlpha.onComplete.add(function (currentTarget) {
                            currentTarget.kill();
                        }, this);
                        
                        this.increaseScore();
					}
    			}
			}
		}
    }
}

var game = new Phaser.Game(1136, 640, Phaser.CANVAS);
    
game.state.add("gameplay", GamePlayManager);
game.state.start("gameplay");